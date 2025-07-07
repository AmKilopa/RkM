const express = require('express');
const router = express.Router();
const tradeitAPI = require('../services/tradeit-api');

// === ПРОВЕРКА СТОИМОСТИ ИНВЕНТАРЯ ===
router.post('/check', async (req, res) => {
    try {
        const { steamId } = req.body;
        
        if (!steamId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Steam ID обязателен' 
            });
        }
        
        // Валидация Steam ID
        const validation = tradeitAPI.validateSteamId(steamId);
        if (!validation.valid) {
            return res.status(400).json({ 
                success: false, 
                error: validation.error 
            });
        }
        
        // Получение и обработка инвентаря
        const result = await tradeitAPI.getProcessedInventory(validation.cleanId);
        
        res.json(result);
        
    } catch (error) {
        console.error('Inventory check error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка проверки инвентаря' 
        });
    }
});

// === ПОЛУЧИТЬ СЫРЫЕ ДАННЫЕ ИНВЕНТАРЯ ===
router.post('/raw', async (req, res) => {
    try {
        const { steamId } = req.body;
        
        if (!steamId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Steam ID обязателен' 
            });
        }
        
        const result = await tradeitAPI.getInventory(steamId);
        res.json(result);
        
    } catch (error) {
        console.error('Raw inventory error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка получения инвентаря' 
        });
    }
});

// === ВАЛИДАЦИЯ STEAM ID ===
router.post('/validate-steamid', (req, res) => {
    try {
        const { steamId } = req.body;
        
        const validation = tradeitAPI.validateSteamId(steamId);
        res.json({ success: true, ...validation });
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка валидации' 
        });
    }
});

module.exports = router;