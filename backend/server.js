const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS настройки - ИСПРАВЛЕНО!
app.use(cors({
    origin: [
        'https://rkmhelper.netlify.app',  // ← ГЛАВНЫЙ ДОМЕН ФРОНТЕНДА
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

// GitHub API конфигурация
const GITHUB_CONFIG = {
    owner: 'AmKilopa',
    repo: 'RkM',
    apiUrl: 'https://api.github.com/repos/AmKilopa/RkM'
};

// Хранение последнего коммита в памяти
let lastKnownCommit = null;
let lastUpdateCheck = null;

// === ОСНОВНЫЕ API ЭНДПОИНТЫ ===

// Проверка статуса сервера
app.get('/api/status', (req, res) => {
    console.log('📊 Запрос статуса сервера');
    res.json({
        status: 'running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        lastCommit: lastKnownCommit?.sha?.substring(0, 7) || null,
        lastCheck: lastUpdateCheck
    });
});

// Проверка обновлений
app.get('/api/updates/check', async (req, res) => {
    console.log('🔍 Запрос проверки обновлений');
    
    try {
        // Получаем последние коммиты из GitHub
        const response = await fetch(`${GITHUB_CONFIG.apiUrl}/commits?per_page=1`, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'RkM-Backend/1.0.0'
            }
        });
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
        
        const commits = await response.json();
        const latestCommit = commits[0];
        
        lastUpdateCheck = new Date().toISOString();
        
        if (!latestCommit) {
            console.log('⚠️ Не удалось получить коммиты из GitHub');
            return res.json({
                success: false,
                error: 'No commits found'
            });
        }
        
        console.log('📌 Последний коммит:', latestCommit.sha.substring(0, 7), '-', latestCommit.commit.message);
        
        // Проверяем есть ли обновление
        let hasUpdate = false;
        
        if (lastKnownCommit && lastKnownCommit.sha !== latestCommit.sha) {
            hasUpdate = true;
            console.log('🆕 НАЙДЕНО ОБНОВЛЕНИЕ!');
            console.log('📝 Старый коммит:', lastKnownCommit.sha.substring(0, 7));
            console.log('📝 Новый коммит:', latestCommit.sha.substring(0, 7));
        } else if (!lastKnownCommit) {
            console.log('📋 Первая проверка - сохраняем коммит');
        } else {
            console.log('✅ Новых обновлений нет');
        }
        
        // Обновляем последний известный коммит
        lastKnownCommit = latestCommit;
        
        res.json({
            success: true,
            hasUpdate: hasUpdate,
            latestCommit: latestCommit,
            source: 'github-api',
            timestamp: lastUpdateCheck
        });
        
    } catch (error) {
        console.log('❌ Ошибка при проверке обновлений:', error.message);
        
        res.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Принудительная проверка обновлений
app.post('/api/updates/force', async (req, res) => {
    console.log('🚀 Принудительная проверка обновлений');
    
    try {
        // Сбрасываем последний известный коммит
        lastKnownCommit = null;
        
        // Делаем обычную проверку
        const response = await fetch(`${GITHUB_CONFIG.apiUrl}/commits?per_page=1`, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'RkM-Backend/1.0.0'
            }
        });
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const commits = await response.json();
        const latestCommit = commits[0];
        
        lastKnownCommit = latestCommit;
        lastUpdateCheck = new Date().toISOString();
        
        console.log('✅ Принудительная проверка завершена, коммит:', latestCommit.sha.substring(0, 7));
        
        res.json({
            success: true,
            hasUpdate: true, // Всегда возвращаем true для принудительной проверки
            latestCommit: latestCommit,
            source: 'force-check',
            timestamp: lastUpdateCheck
        });
        
    } catch (error) {
        console.log('❌ Ошибка принудительной проверки:', error.message);
        
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Webhook для GitHub (если настроен)
app.post('/webhook/github', (req, res) => {
    console.log('🎣 Получен GitHub webhook');
    
    try {
        const payload = req.body;
        
        if (payload.ref === 'refs/heads/main' && payload.commits && payload.commits.length > 0) {
            const latestCommit = payload.commits[payload.commits.length - 1];
            
            console.log('📝 Webhook коммит:', latestCommit.id.substring(0, 7), '-', latestCommit.message);
            
            // Обновляем последний коммит из webhook
            lastKnownCommit = {
                sha: latestCommit.id,
                commit: {
                    message: latestCommit.message,
                    author: {
                        name: latestCommit.author.name,
                        date: latestCommit.timestamp
                    }
                }
            };
            
            lastUpdateCheck = new Date().toISOString();
            
            console.log('✅ Коммит обновлен через webhook');
        }
        
        res.status(200).send('OK');
        
    } catch (error) {
        console.log('❌ Ошибка обработки webhook:', error.message);
        res.status(500).send('Error');
    }
});

// Получение информации о репозитории
app.get('/api/repo/info', async (req, res) => {
    console.log('📊 Запрос информации о репозитории');
    
    try {
        const response = await fetch(GITHUB_CONFIG.apiUrl, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'RkM-Backend/1.0.0'
            }
        });
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const repoInfo = await response.json();
        
        res.json({
            success: true,
            repo: {
                name: repoInfo.name,
                fullName: repoInfo.full_name,
                description: repoInfo.description,
                stars: repoInfo.stargazers_count,
                forks: repoInfo.forks_count,
                language: repoInfo.language,
                updatedAt: repoInfo.updated_at,
                url: repoInfo.html_url
            }
        });
        
    } catch (error) {
        console.log('❌ Ошибка получения информации о репозитории:', error.message);
        
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Тестовый эндпоинт
app.get('/api/test', (req, res) => {
    console.log('🧪 Тестовый запрос');
    res.json({
        message: 'Backend работает!',
        timestamp: new Date().toISOString(),
        origin: req.get('Origin'),
        userAgent: req.get('User-Agent')
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
    console.log('🚀 RkM Backend запущен');
    console.log(`🔗 Сервер: http://localhost:${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log('📊 Эндпоинты:');
    console.log('  GET  /api/status - статус сервера');
    console.log('  GET  /api/updates/check - проверка обновлений');
    console.log('  POST /api/updates/force - принудительная проверка');
    console.log('  POST /webhook/github - GitHub webhook');
    console.log('  GET  /api/repo/info - информация о репозитории');
    console.log('  GET  /api/test - тестовый эндпоинт');
    console.log('');
    console.log('🔧 CORS разрешен для:');
    console.log('  - https://rkmhelper.netlify.app');
    console.log('  - https://rkm-9vui.onrender.com');
    console.log('  - localhost (различные порты)');
    
    // Первоначальная проверка коммитов
    setTimeout(async () => {
        console.log('📋 Первоначальная загрузка коммитов...');
        try {
            const response = await fetch(`${GITHUB_CONFIG.apiUrl}/commits?per_page=1`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'RkM-Backend/1.0.0'
                }
            });
            
            if (response.ok) {
                const commits = await response.json();
                if (commits[0]) {
                    lastKnownCommit = commits[0];
                    console.log('✅ Загружен начальный коммит:', lastKnownCommit.sha.substring(0, 7));
                }
            }
        } catch (error) {
            console.log('⚠️ Не удалось загрузить начальный коммит:', error.message);
        }
    }, 2000);
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