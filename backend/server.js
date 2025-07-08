const express = require('express');
const cors = require('cors');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS настройки
app.use(cors({
    origin: [
        'https://rkmhelper.netlify.app',
        'https://rkm-9vui.onrender.com',
        'http://localhost:3000',
        'http://localhost:8080',
        'http://127.0.0.1:5500',
        'http://localhost:5000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование всех запросов
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'none'}`);
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
  //  console.log('📊 Запрос статуса сервера');
    res.json({
        status: 'running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        hasNewUpdate: updateState.hasNewUpdate,
        lastCommit: updateState.latestCommit?.sha?.substring(0, 7) || null,
        lastWebhook: updateState.lastWebhookTime
    });
});

// Проверка обновлений (БЕЗ запросов к GitHub!)
app.get('/api/updates/check', (req, res) => {
 //   console.log('🔍 Проверка обновлений (через webhook состояние)');
    
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
        //    console.log('🆕 Отправляем уведомление об обновлении');
            updateState.updateNotified = true; // Помечаем как уведомленное
            
            // Через 30 секунд сбрасываем флаг (после того как фронтенд обработает)
            setTimeout(() => {
           //     console.log('🔄 Сброс флага обновления');
                updateState.hasNewUpdate = false;
                updateState.updateNotified = false;
            }, 30000);
        }
        
        console.log('Состояние обновлений:', {
            hasUpdate: result.hasUpdate,
            commit: result.latestCommit?.sha?.substring(0, 7) || 'none',
            webhookTime: result.webhookTime
        });
        
        res.json(result);
        
    } catch (error) {
       // console.log('❌ Ошибка при проверке состояния:', error.message);
        
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
    console.log('🔄 Принудительный сброс состояния обновлений');
    
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
    console.log('🔍 Запрос текущего состояния обновлений');
    
    res.json({
        success: true,
        state: updateState,
        timestamp: new Date().toISOString()
    });
});

// Тестовый эндпоинт
app.get('/api/test', (req, res) => {
    console.log('🧪 Тестовый запрос');
    res.json({
        message: 'Backend работает!',
        timestamp: new Date().toISOString(),
        origin: req.get('Origin'),
        userAgent: req.get('User-Agent'),
        updateState: updateState
    });
});

// === ОБРАБОТКА ОШИБОК ===

// 404 для API
app.use('/api/*', (req, res) => {
    console.log('❌ API эндпоинт не найден:', req.path);
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
    console.log('🚀 RkM Backend запущен (Webhook режим)');
    console.log(`🔗 Сервер: http://localhost:${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log('📊 Эндпоинты:');
    console.log('  GET  /api/status - статус сервера');
    console.log('  GET  /api/updates/check - проверка обновлений (webhook)');
    console.log('  POST /api/updates/force - сброс состояния');
    console.log('  GET  /api/updates/state - текущее состояние');
    console.log('  POST /webhook/github - GitHub webhook');
    console.log('  GET  /api/test - тестовый эндпоинт');
    console.log('');
    console.log('🎣 WEBHOOK готов к приему:');
    console.log(`   URL: http://localhost:${PORT}/webhook/github`);
    console.log(`   Production: https://rkm-9vui.onrender.com/webhook/github`);
    console.log('');
    console.log('🔧 CORS разрешен для:');
    console.log('  - https://rkmhelper.netlify.app');
    console.log('  - https://rkm-9vui.onrender.com');
    console.log('  - localhost (различные порты)');
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