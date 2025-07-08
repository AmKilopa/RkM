const express = require('express');
const cors = require('cors');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Полные CORS настройки с всеми необходимыми заголовками
const corsOptions = {
    origin: [
        'https://rkmhelper.vercel.app',
        'https://rkm-9vui.onrender.com',
        'http://localhost:3000',
        'http://localhost:8080',
        'http://127.0.0.1:5500',
        'http://localhost:5000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With', 
        'Accept',
        'Origin',
        'Cache-Control',
        'Pragma',
        'Expires',
        'If-Modified-Since',
        'If-None-Match',
        'X-Forwarded-For',
        'X-Real-IP'
    ],
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
    maxAge: 86400, // 24 часа для preflight кэша
    optionsSuccessStatus: 200
};

// Применяем CORS
app.use(cors(corsOptions));

// Дополнительная обработка preflight запросов
app.options('*', (req, res) => {
    const origin = req.get('Origin');
    if (corsOptions.origin.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,HEAD');
    res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(','));
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    
    res.status(200).end();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Минимальное логирование
app.use((req, res, next) => {
    const origin = req.get('Origin') || 'none';
    
    // Устанавливаем CORS заголовки для всех ответов
    if (corsOptions.origin.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    
    next();
});

// Хранение состояния обновлений
let updateState = {
    hasNewUpdate: false,
    latestCommit: null,
    lastWebhookTime: null,
    updateNotified: false
};

// === ОСНОВНЫЕ API ЭНДПОИНТЫ ===

// Проверка статуса сервера
app.get('/api/status', (req, res) => {
    const responseData = {
        status: 'running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        hasNewUpdate: updateState.hasNewUpdate,
        lastCommit: updateState.latestCommit?.sha?.substring(0, 7) || null,
        lastWebhook: updateState.lastWebhookTime,
        cors: {
            origin: req.get('Origin'),
            allowed: corsOptions.origin.includes(req.get('Origin'))
        }
    };
    
    res.json(responseData);
});

// Проверка обновлений (БЕЗ запросов к GitHub!)
app.get('/api/updates/check', (req, res) => {
    try {
        const result = {
            success: true,
            hasUpdate: updateState.hasNewUpdate,
            latestCommit: updateState.latestCommit,
            source: 'webhook',
            timestamp: new Date().toISOString(),
            webhookTime: updateState.lastWebhookTime
        };
        
        // Если есть обновление и оно не было уведомлено
        if (updateState.hasNewUpdate && !updateState.updateNotified) {
            updateState.updateNotified = true;
            
            // Через 30 секунд сбрасываем флаг
            setTimeout(() => {
                updateState.hasNewUpdate = false;
                updateState.updateNotified = false;
            }, 30000);
        }
        
        res.json(result);
        
    } catch (error) {
        res.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// GitHub Webhook - ГЛАВНЫЙ ЭНДПОИНТ!
app.post('/webhook/github', (req, res) => {
    try {
        const payload = req.body;
        
        // Проверяем что это push в main ветку
        if (payload.ref === 'refs/heads/main' && payload.commits && payload.commits.length > 0) {
            const latestCommit = payload.commits[payload.commits.length - 1];
            
            console.log('🆕 Обновление!');
            
            // Обновляем состояние
            updateState.hasNewUpdate = true;
            updateState.updateNotified = false;
            updateState.lastWebhookTime = new Date().toISOString();
            updateState.latestCommit = {
                sha: latestCommit.id,
                commit: {
                    message: latestCommit.message,
                    author: {
                        name: latestCommit.author.name,
                        date: latestCommit.timestamp
                    }
                }
            };
        }
        
        res.status(200).send('OK');
        
    } catch (error) {
        res.status(500).send('Error');
    }
});

// Принудительная проверка - сбрасывает состояние
app.post('/api/updates/force', (req, res) => {
    updateState.hasNewUpdate = false;
    updateState.updateNotified = false;
    
    res.json({
        success: true,
        message: 'Update state reset',
        timestamp: new Date().toISOString()
    });
});

// Получение текущего состояния обновлений (для отладки)
app.get('/api/updates/state', (req, res) => {
    res.json({
        success: true,
        state: updateState,
        timestamp: new Date().toISOString()
    });
});

// Тестовый эндпоинт для проверки CORS
app.get('/api/test', (req, res) => {
    const responseData = {
        message: 'Backend работает!',
        timestamp: new Date().toISOString(),
        origin: req.get('Origin'),
        userAgent: req.get('User-Agent'),
        updateState: updateState,
        cors: {
            allowed: corsOptions.origin.includes(req.get('Origin')),
            headers: {
                'Access-Control-Allow-Origin': res.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Credentials': res.get('Access-Control-Allow-Credentials')
            }
        }
    };
    
    res.json(responseData);
});

// CORS диагностика
app.get('/api/cors-test', (req, res) => {
    const origin = req.get('Origin');
    const isAllowed = corsOptions.origin.includes(origin);
    
    res.json({
        success: true,
        origin: origin,
        allowed: isAllowed,
        allowedOrigins: corsOptions.origin,
        headers: req.headers,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// === ОБРАБОТКА ОШИБОК ===

// 404 для API
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        path: req.path
    });
});

// Общий обработчик ошибок
app.use((error, req, res, next) => {
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
    });
});

// === ЗАПУСК СЕРВЕРА ===

app.listen(PORT, () => {
    console.log('🚀 RkM Backend запущен');
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log('🎣 Webhook URL: https://rkm-9vui.onrender.com/webhook/github');
    console.log('🔧 CORS поддержка для Vercel включена');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('📴 Завершение работы...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('📴 Завершение работы...');
    process.exit(0);
});

module.exports = app;