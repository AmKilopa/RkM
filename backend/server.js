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
    console.log('Headers:', req.headers);
    console.log('Body keys:', Object.keys(req.body || {}));
    
    try {
        // Проверяем что это push событие в main/master ветку
        if (req.body.ref === 'refs/heads/main' || req.body.ref === 'refs/heads/master') {
            console.log('📝 Push в main ветку обнаружен!');
            
            const latestCommit = req.body.head_commit;
            if (latestCommit) {
                console.log('🆕 Новый коммит:', latestCommit.id.substring(0, 7), '-', latestCommit.message);
                
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
                
                console.log('✅ Флаг обновления установлен');
            } else {
                console.log('⚠️ head_commit не найден в webhook payload');
            }
        } else {
            console.log('ℹ️ Push не в main ветку, игнорируем');
        }
        
        res.status(200).json({ 
            received: true,
            timestamp: new Date().toISOString(),
            hasUpdate: global.hasUpdate
        });
        
    } catch (error) {
        console.error('❌ Ошибка обработки webhook:', error);
        res.status(500).json({ 
            error: 'Webhook processing failed',
            message: error.message 
        });
    }
});

// ===== ПРОВЕРКА ОБНОВЛЕНИЙ =====
app.get('/api/updates/check', async (req, res) => {
    console.log('🔍 Запрос проверки обновлений');
    
    try {
        // Проверяем есть ли флаг обновления от webhook
        if (global.hasUpdate && global.latestCommit) {
            console.log('✅ Обнаружено обновление от webhook');
            
            const result = {
                success: true,
                hasUpdate: true,
                latestCommit: global.latestCommit,
                source: 'webhook',
                timestamp: new Date().toISOString()
            };
            
            // Сбрасываем флаг после отправки
            global.hasUpdate = false;
            console.log('🔄 Флаг обновления сброшен');
            
            res.json(result);
            return;
        }
        
        // Если webhook не сработал, fallback на GitHub API
        console.log('📡 Fallback: проверяем GitHub API');
        
        const fetch = (await import('node-fetch')).default;
        const response = await fetch('https://api.github.com/repos/AmKilopa/RkM/commits?per_page=1');
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const commits = await response.json();
        const latestCommit = commits[0];
        
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
    res.json({
        hasUpdate: global.hasUpdate,
        latestCommit: global.latestCommit,
        timestamp: new Date().toISOString()
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