const express = require('express');
const cors = require('cors');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Расширенные CORS настройки
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
        'Pragma'
    ],
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
    maxAge: 86400, // 24 часа для preflight кэша
    optionsSuccessStatus: 200 // Для старых браузеров
};

// Применяем CORS
app.use(cors(corsOptions));

// Дополнительная обработка preflight запросов
app.options('*', (req, res) => {
    console.log('🔍 Preflight запрос:', req.method, req.path, 'Origin:', req.get('Origin'));
    
    // Устанавливаем CORS заголовки вручную
    const origin = req.get('Origin');
    if (corsOptions.origin.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,HEAD');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin,Cache-Control,Pragma');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    
    res.status(200).end();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Расширенное логирование всех запросов
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const origin = req.get('Origin') || 'none';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    console.log(`${timestamp} - ${req.method} ${req.path}`);
    console.log(`  Origin: ${origin}`);
    console.log(`  User-Agent: ${userAgent.substring(0, 50)}...`);
    
    // Устанавливаем CORS заголовки для всех ответов
    if (corsOptions.origin.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    
    next();
});

// Хранение состояния обновлений
let updateState = {
    hasNewUpdate: false,           // Флаг нового обновления
    latestCommit: null,           // Последний коммит от webhook
    lastWebhookTime: null,        // Время последнего webhook
    updateNotified: false         // Было ли уведомление отправлено
};

// === ОСНОВНЫЕ API ЭНДПОИНТЫ ===

// Проверка статуса сервера
app.get('/api/status', (req, res) => {
    console.log('📊 Запрос статуса сервера от:', req.get('Origin'));
    
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
    
    console.log('📊 Ответ статуса:', responseData.status, 'CORS:', responseData.cors.allowed);
    
    res.json(responseData);
});

// Проверка обновлений (БЕЗ запросов к GitHub!)
app.get('/api/updates/check', (req, res) => {
    console.log('🔍 Проверка обновлений от:', req.get('Origin'));
    
    try {
        // Возвращаем состояние основанное на webhook данных
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
            console.log('🆕 Отправляем уведомление об обновлении');
            updateState.updateNotified = true; // Помечаем как уведомленное
            
            // Через 30 секунд сбрасываем флаг (после того как фронтенд обработает)
            setTimeout(() => {
                console.log('🔄 Сброс флага обновления');
                updateState.hasNewUpdate = false;
                updateState.updateNotified = false;
            }, 30000);
        }
        
        console.log('🔍 Состояние обновлений:', {
            hasUpdate: result.hasUpdate,
            commit: result.latestCommit?.sha?.substring(0, 7) || 'none',
            webhookTime: result.webhookTime
        });
        
        res.json(result);
        
    } catch (error) {
        console.log('❌ Ошибка при проверке состояния:', error.message);
        
        res.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// GitHub Webhook - ГЛАВНЫЙ ЭНДПОИНТ!
app.post('/webhook/github', (req, res) => {
    console.log('🎣 ========== ПОЛУЧЕН GITHUB WEBHOOK ==========');
    
    try {
        const payload = req.body;
        
        // Логируем основную информацию
        console.log('📝 Event:', req.headers['x-github-event']);
        console.log('📝 Repository:', payload.repository?.full_name);
        console.log('📝 Ref:', payload.ref);
        
        // Проверяем что это push в main ветку
        if (payload.ref === 'refs/heads/main' && payload.commits && payload.commits.length > 0) {
            const latestCommit = payload.commits[payload.commits.length - 1];
            
            console.log('🚀 ========== НОВЫЙ PUSH В MAIN! ==========');
            console.log('📝 Коммит ID:', latestCommit.id.substring(0, 7));
            console.log('📝 Сообщение:', latestCommit.message);
            console.log('📝 Автор:', latestCommit.author.name);
            console.log('📝 Время:', latestCommit.timestamp);
            console.log('===============================================');
            
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
            
            console.log('✅ Состояние обновлено - ожидаем запрос от фронтенда');
            
        } else {
            console.log('ℹ️ Webhook не для main ветки или без коммитов');
        }
        
        res.status(200).send('OK');
        
    } catch (error) {
        console.log('❌ Ошибка обработки webhook:', error.message);
        res.status(500).send('Error');
    }
});

// Принудительная проверка - сбрасывает состояние
app.post('/api/updates/force', (req, res) => {
    console.log('🔄 Принудительный сброс состояния обновлений от:', req.get('Origin'));
    
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
    console.log('🔍 Запрос текущего состояния обновлений от:', req.get('Origin'));
    
    res.json({
        success: true,
        state: updateState,
        timestamp: new Date().toISOString()
    });
});

// Тестовый эндпоинт для проверки CORS
app.get('/api/test', (req, res) => {
    console.log('🧪 Тестовый запрос от:', req.get('Origin'));
    
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
    
    console.log('🧪 CORS проверка:', responseData.cors);
    
    res.json(responseData);
});

// Новый эндпоинт для диагностики CORS
app.get('/api/cors-test', (req, res) => {
    console.log('🔧 CORS диагностика от:', req.get('Origin'));
    
    const origin = req.get('Origin');
    const isAllowed = corsOptions.origin.includes(origin);
    
    console.log('🔧 Origin разрешен:', isAllowed);
    console.log('🔧 Разрешенные origins:', corsOptions.origin);
    
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
    console.log('❌ API эндпоинт не найден:', req.path, 'от:', req.get('Origin'));
    res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        path: req.path
    });
});

// Общий обработчик ошибок
app.use((error, req, res, next) => {
    console.log('❌ Серверная ошибка:', error.message);
    
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
    });
});

// === ЗАПУСК СЕРВЕРА ===

app.listen(PORT, () => {
    console.log('🚀 RkM Backend запущен (Webhook режим + улучшенный CORS)');
    console.log(`🔗 Сервер: http://localhost:${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log('📊 Эндпоинты:');
    console.log('  GET  /api/status - статус сервера');
    console.log('  GET  /api/updates/check - проверка обновлений (webhook)');
    console.log('  POST /api/updates/force - сброс состояния');
    console.log('  GET  /api/updates/state - текущее состояние');
    console.log('  GET  /api/test - тестовый эндпоинт');
    console.log('  GET  /api/cors-test - диагностика CORS');
    console.log('  POST /webhook/github - GitHub webhook');
    console.log('');
    console.log('🎣 WEBHOOK готов к приему:');
    console.log(`   URL: http://localhost:${PORT}/webhook/github`);
    console.log(`   Production: https://rkm-9vui.onrender.com/webhook/github`);
    console.log('');
    console.log('🔧 CORS разрешен для:');
    corsOptions.origin.forEach(origin => {
        console.log(`  - ${origin}`);
    });
    console.log('');
    console.log('⚡ БЕЗ запросов к GitHub API - только webhook!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('📴 Получен SIGTERM, завершаем работу...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('📴 Получен SIGINT, завершаем работу...');
    process.exit(0);
});

module.exports = app;