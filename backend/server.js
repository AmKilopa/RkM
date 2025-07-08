const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS настройки
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
        'If-None-Match'
    ],
    maxAge: 86400,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    const origin = req.get('Origin');
    if (corsOptions.origin.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    next();
});

// Состояние обновлений
let updateState = {
    hasNewUpdate: false,
    latestCommit: null,
    lastWebhookTime: null,
    updateNotified: false
};

// API эндпоинты
app.get('/api/status', (req, res) => {
    res.json({
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
    });
});

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
        
        if (updateState.hasNewUpdate && !updateState.updateNotified) {
            updateState.updateNotified = true;
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

app.post('/webhook/github', (req, res) => {
    try {
        const payload = req.body;
        
        if (payload.ref === 'refs/heads/main' && payload.commits && payload.commits.length > 0) {
            const latestCommit = payload.commits[payload.commits.length - 1];
            
            console.log('🆕 Обновление!');
            
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

app.post('/api/updates/force', (req, res) => {
    updateState.hasNewUpdate = false;
    updateState.updateNotified = false;
    res.json({
        success: true,
        message: 'Update state reset',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/updates/state', (req, res) => {
    res.json({
        success: true,
        state: updateState,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/test', (req, res) => {
    res.json({
        message: 'Backend работает!',
        timestamp: new Date().toISOString(),
        origin: req.get('Origin'),
        updateState: updateState,
        cors: {
            allowed: corsOptions.origin.includes(req.get('Origin'))
        }
    });
});

app.get('/api/cors-test', (req, res) => {
    const origin = req.get('Origin');
    res.json({
        success: true,
        origin: origin,
        allowed: corsOptions.origin.includes(origin),
        allowedOrigins: corsOptions.origin,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        path: req.path
    });
});

app.use((error, req, res, next) => {
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
    });
});

app.listen(PORT, () => {
    console.log('🟢 Backend доступен');
});

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

module.exports = app;