const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// Глобальные переменные для отслеживания обновлений
global.hasUpdate = false;
global.latestCommit = null;

// Middleware
app.use(express.json({ limit: '10mb' })); // Увеличиваем лимит для webhook payload
app.use(express.urlencoded({ extended: true }));

// CORS с подробными настройками
app.use(cors({
    origin: ['*'], // Разрешаем все источники для webhook
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-GitHub-Event', 'X-GitHub-Delivery', 'X-Hub-Signature-256'],
    credentials: true
}));

// Дополнительные заголовки для GitHub webhook
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, X-GitHub-Event, X-GitHub-Delivery');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Логирование всех запросов с деталями
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`\n=== ${timestamp} ===`);
    console.log(`${req.method} ${req.url}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    if (req.method === 'POST' && req.body) {
        console.log('Body size:', JSON.stringify(req.body).length, 'characters');
        if (req.url.includes('webhook')) {
            console.log('Body keys:', Object.keys(req.body));
        }
    }
    
    next();
});

// ===== КОРНЕВОЙ МАРШРУТ =====
app.get('/', (req, res) => {
    res.json({ 
        status: 'running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// ===== WEBHOOK ОТ GITHUB =====
app.post('/api/webhooks/github', (req, res) => {
    console.log('🔔 GitHub webhook получен!');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    // Проверяем GitHub события
    const event = req.headers['x-github-event'];
    console.log('📅 GitHub Event:', event);
    
    try {
        if (event === 'push') {
            console.log('📝 Push событие обнаружено!');
            console.log('Body:', JSON.stringify(req.body, null, 2));
            
            // Проверяем что это push в main/master ветку
            if (req.body.ref === 'refs/heads/main' || req.body.ref === 'refs/heads/master') {
                console.log('🎯 Push в main ветку!');
                
                const latestCommit = req.body.head_commit;
                if (latestCommit) {
                    console.log('🆕 Новый коммит найден:');
                    console.log('  SHA:', latestCommit.id.substring(0, 7));
                    console.log('  Message:', latestCommit.message);
                    console.log('  Author:', latestCommit.author.name);
                    
                    // Устанавливаем флаг обновления
                    global.hasUpdate = true;
                    global.latestCommit = {
                        sha: latestCommit.id,
                        message: latestCommit.message,
                        author: {
                            name: latestCommit.author.name,
                            date: latestCommit.timestamp
                        },
                        url: latestCommit.url
                    };
                    
                    console.log('✅ Флаг обновления установлен!');
                    console.log('🔔 Клиенты получат уведомление при следующей проверке');
                } else {
                    console.log('⚠️ head_commit не найден в payload');
                }
            } else {
                console.log('ℹ️ Push не в main ветку:', req.body.ref);
            }
        } else if (event === 'ping') {
            console.log('🏓 Ping от GitHub - webhook настроен правильно!');
        } else {
            console.log('ℹ️ Событие не push:', event);
        }
        
        res.status(200).json({ 
            received: true,
            event: event,
            hasUpdate: global.hasUpdate,
            timestamp: new Date().toISOString(),
            message: 'Webhook processed successfully'
        });
        
    } catch (error) {
        console.error('❌ Ошибка обработки webhook:', error);
        res.status(200).json({ // Возвращаем 200 чтобы GitHub не считал ошибкой
            received: true,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ===== ПРОВЕРКА ОБНОВЛЕНИЙ =====
app.get('/api/updates/check', async (req, res) => {
    console.log('🔍 Запрос проверки обновлений');
    console.log('📊 Текущее состояние:');
    console.log('  hasUpdate:', global.hasUpdate);
    console.log('  latestCommit:', global.latestCommit ? global.latestCommit.sha?.substring(0, 7) : 'none');
    
    try {
        // Проверяем есть ли флаг обновления от webhook
        if (global.hasUpdate && global.latestCommit) {
            console.log('✅ ОБНАРУЖЕНО ОБНОВЛЕНИЕ ОТ WEBHOOK!');
            console.log('📝 Коммит для отправки:', global.latestCommit.sha.substring(0, 7));
            
            const result = {
                success: true,
                hasUpdate: true,
                latestCommit: global.latestCommit,
                source: 'webhook',
                timestamp: new Date().toISOString()
            };
            
            // Сбрасываем флаг после отправки
            global.hasUpdate = false;
            console.log('🔄 Флаг обновления сброшен - уведомление отправлено клиенту');
            
            res.json(result);
            return;
        }
        
        // Если webhook не сработал, fallback на GitHub API (с улучшенной обработкой)
        console.log('📡 Fallback: проверяем GitHub API');
        
        const fetch = (await import('node-fetch')).default;
        
        // Добавляем заголовки для избежания rate limiting
        const response = await fetch('https://api.github.com/repos/AmKilopa/RkM/commits?per_page=1', {
            headers: {
                'User-Agent': 'RkM-Backend/1.0',
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        console.log('📊 GitHub API response:', response.status, response.statusText);
        
        if (response.status === 403) {
            console.log('⚠️ GitHub API rate limit exceeded');
            // Возвращаем успешный ответ без обновлений
            res.json({
                success: true,
                hasUpdate: false,
                error: 'GitHub API rate limit exceeded',
                source: 'github-api-limited',
                timestamp: new Date().toISOString()
            });
            return;
        }
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
        
        const commits = await response.json();
        const latestCommit = commits[0];
        
        console.log('📝 GitHub API - последний коммит:', latestCommit.sha.substring(0, 7));
        
        res.json({
            success: true,
            hasUpdate: false, // Без webhook считаем что обновлений нет
            latestCommit: {
                sha: latestCommit.sha,
                message: latestCommit.commit.message,
                author: {
                    name: latestCommit.commit.author.name,
                    date: latestCommit.commit.author.date
                }
            },
            source: 'github-api',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Ошибка проверки обновлений:', error);
        res.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ===== ПОСЛЕДНИЙ КОММИТ =====
app.get('/api/updates/latest-commit', async (req, res) => {
    console.log('📝 Запрос последнего коммита');
    
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch('https://api.github.com/repos/AmKilopa/RkM/commits?per_page=1');
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const commits = await response.json();
        const latestCommit = commits[0];
        
        res.json({
            success: true,
            commit: {
                sha: latestCommit.sha,
                message: latestCommit.commit.message,
                author: {
                    name: latestCommit.commit.author.name,
                    date: latestCommit.commit.author.date
                },
                url: latestCommit.html_url
            }
        });
        
    } catch (error) {
        console.error('❌ Ошибка получения коммита:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// ===== ТЕСТ WEBHOOK ВРУЧНУЮ =====
app.post('/api/test-webhook', (req, res) => {
    console.log('\n🧪🧪🧪 MANUAL WEBHOOK TEST 🧪🧪🧪');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    
    // Симулируем webhook
    global.hasUpdate = true;
    global.latestCommit = {
        sha: 'manual-test-' + Date.now(),
        message: 'Manual webhook test commit',
        author: {
            name: 'Manual Test',
            date: new Date().toISOString()
        },
        url: 'https://github.com/AmKilopa/RkM'
    };
    
    console.log('✅ Manual flag set for testing');
    
    res.json({
        success: true,
        message: 'Manual webhook test completed',
        hasUpdate: global.hasUpdate,
        latestCommit: global.latestCommit
    });
    
    console.log('🧪🧪🧪 MANUAL TEST COMPLETE 🧪🧪🧪\n');
});

// ===== ПРОВЕРКА ДОСТУПНОСТИ WEBHOOK ENDPOINT =====
app.get('/api/webhooks/github', (req, res) => {
    console.log('🔍 GET request to webhook endpoint');
    res.json({
        message: 'GitHub webhook endpoint is accessible',
        method: 'This endpoint expects POST requests from GitHub',
        url: req.url,
        timestamp: new Date().toISOString()
    });
});

// ===== ЛЮБОЙ POST НА WEBHOOK ENDPOINT (для диагностики) =====
app.all('/api/webhooks/*', (req, res) => {
    console.log('\n🔍🔍🔍 WEBHOOK ENDPOINT ACCESS 🔍🔍🔍');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('📋 Method:', req.method);
    console.log('🔗 URL:', req.url);
    console.log('🌐 IP:', req.ip);
    console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('📦 Body size:', JSON.stringify(req.body || {}).length);
    
    if (req.method === 'POST' && req.url === '/api/webhooks/github') {
        // Перенаправляем на основной обработчик
        console.log('🔄 Redirecting to main webhook handler');
    } else {
        console.log('ℹ️ Non-standard webhook access');
        res.json({
            received: true,
            method: req.method,
            url: req.url,
            note: 'Webhook endpoint accessed but not standard GitHub POST'
        });
    }
    
    console.log('🔍🔍🔍 WEBHOOK ACCESS LOG COMPLETE 🔍🔍🔍\n');
});
app.get('/api/updates/status', (req, res) => {
    console.log('📊 Запрос статуса обновлений');
    res.json({
        hasUpdate: global.hasUpdate,
        latestCommit: global.latestCommit,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ===== ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ (для тестирования) =====
app.post('/api/updates/force', (req, res) => {
    console.log('🧪 Принудительное установка флага обновления');
    
    global.hasUpdate = true;
    global.latestCommit = {
        sha: 'test' + Date.now(),
        message: 'Тестовое обновление для проверки системы',
        author: {
            name: 'Test User',
            date: new Date().toISOString()
        },
        url: 'https://github.com/AmKilopa/RkM'
    };
    
    console.log('✅ Флаг принудительно установлен');
    
    res.json({
        success: true,
        message: 'Update flag set manually',
        hasUpdate: global.hasUpdate,
        latestCommit: global.latestCommit
    });
});

// ===== СБРОС ФЛАГА (для дебага) =====
app.post('/api/updates/reset', (req, res) => {
    console.log('🔄 Сброс флага обновления');
    
    global.hasUpdate = false;
    global.latestCommit = null;
    
    res.json({
        success: true,
        message: 'Update flag reset',
        hasUpdate: global.hasUpdate
    });
});

// ===== ЗДОРОВЬЕ СЕРВЕРА =====
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// ===== CATCH-ALL =====
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        method: req.method,
        url: req.originalUrl
    });
});

// ===== ЗАПУСК СЕРВЕРА =====
app.listen(PORT, () => {
    console.log(`🚀 Backend сервер запущен на порту ${PORT}`);
    console.log(`🌐 URL: https://rkm-9vui.onrender.com`);
    console.log(`🔔 Webhook URL: https://rkm-9vui.onrender.com/api/webhooks/github`);
    console.log(`📡 Updates API: https://rkm-9vui.onrender.com/api/updates/check`);
});

// ===== ОБРАБОТКА ОШИБОК =====
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled Rejection:', error);
});