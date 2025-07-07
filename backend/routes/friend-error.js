const express = require('express');
const router = express.Router();
const screenshotService = require('../services/screenshot');

// === ГЕНЕРАЦИЯ СКРИНШОТА FRIEND ERROR ===
router.post('/generate', async (req, res) => {
    try {
        const { steamId } = req.body;
        
        if (!steamId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Steam ID обязателен' 
            });
        }
        
        // Генерация скриншота
        const result = await screenshotService.generateFriendError(steamId);
        
        res.json(result);
        
    } catch (error) {
        console.error('Friend Error generation error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка генерации скриншота' 
        });
    }
});

// === ПРОВЕРКА ВОЗМОЖНОСТЕЙ ===
router.get('/capabilities', async (req, res) => {
    try {
        const capabilities = await screenshotService.checkCapabilities();
        res.json({ success: true, ...capabilities });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка проверки возможностей' 
        });
    }
});

module.exports = router;