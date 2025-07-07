const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// === MIDDLEWARE ===
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// === МАРШРУТЫ ===
app.use('/api/substitution', require('./routes/substitution'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/friend-error', require('./routes/friend-error'));

// === БАЗОВЫЙ МАРШРУТ ===
app.get('/', (req, res) => {
    res.json({ 
        message: 'RkM Backend API',
        version: '1.0.0',
        status: 'running'
    });
});

// === ОБРАБОТКА ОШИБОК ===
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        success: false, 
        error: 'Внутренняя ошибка сервера' 
    });
});

// === 404 ===
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        error: 'Маршрут не найден' 
    });
});

// === ЗАПУСК СЕРВЕРА ===
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📡 API доступен по адресу: http://localhost:${PORT}`);
});