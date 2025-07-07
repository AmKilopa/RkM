const express = require('express');
const router = express.Router();
const systemValidator = require('../services/system-validator');
const substitutionService = require('../services/substitution-service');

// === ПРОВЕРКА СИСТЕМЫ ===
router.post('/check-system', async (req, res) => {
    try {
        const result = await systemValidator.checkAll();
        res.json(result);
    } catch (error) {
        console.error('System check error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка проверки системы' 
        });
    }
});

// === ЗАПУСК ПОДМЕНЫ ===
router.post('/start', async (req, res) => {
    try {
        const { steamId } = req.body;
        
        if (!steamId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Steam ID обязателен' 
            });
        }
        
        const result = await substitutionService.start(steamId);
        res.json(result);
    } catch (error) {
        console.error('Substitution error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка подмены' 
        });
    }
});

module.exports = router;