const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// Глобальные переменные для отслеживания обновлений
global.hasUpdate = false;
global.latestCommit = null;

// Middleware
app.use(express.json());
app.use(cors({
    origin: '*', // В продакшене лучше указать конкретные домены
    credentials: true
}));

// Логирование всех запросов
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
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

// ===== СТАТУС ОБНОВЛЕНИЙ (для дебага) =====
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