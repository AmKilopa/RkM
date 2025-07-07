// Временная версия без Puppeteer
class SubstitutionService {
    constructor() {
        this.isRunning = false;
        this.currentProcess = null;
    }
    
    async start(steamId) {
        try {
            console.log(`🚀 Начинаем подмену для Steam ID: ${steamId}`);
            
            if (this.isRunning) {
                return {
                    success: false,
                    error: 'Подмена уже выполняется'
                };
            }

            this.isRunning = true;
            
            // Симуляция процесса подмены (пока без браузера)
            await this.simulateSubstitution(steamId);
            
            this.isRunning = false;
            
            return {
                success: true,
                message: 'Подмена выполнена успешно (симуляция)',
                steamId: steamId,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Ошибка подмены:', error);
            this.isRunning = false;
            
            return {
                success: false,
                error: error.message,
                steamId: steamId
            };
        }
    }
    
    async simulateSubstitution(steamId) {
        console.log('📋 Этап 1: Проверка Steam ID...');
        await this.delay(1000);
        
        console.log('🔐 Этап 2: Инициализация сессии...');
        await this.delay(1500);
        
        console.log('🌐 Этап 3: Подключение к Steam...');
        await this.delay(2000);
        
        console.log('⚙️ Этап 4: Выполнение подмены...');
        await this.delay(2500);
        
        console.log('✅ Этап 5: Завершение процесса...');
        await this.delay(1000);
        
        console.log('🎉 Подмена завершена успешно!');
    }
    
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Получить статус текущего процесса
    getStatus() {
        return {
            isRunning: this.isRunning,
            currentProcess: this.currentProcess
        };
    }
    
    // Остановить текущий процесс
    async stop() {
        if (this.isRunning) {
            console.log('🛑 Остановка процесса подмены...');
            this.isRunning = false;
            this.currentProcess = null;
            return { success: true, message: 'Процесс остановлен' };
        }
        
        return { success: false, message: 'Нет активных процессов' };
    }
    
    // Валидация Steam ID
    validateSteamId(steamId) {
        if (!steamId || typeof steamId !== 'string') {
            return {
                valid: false,
                error: 'Steam ID не предоставлен'
            };
        }

        const cleaned = steamId.trim();

        // Steam64 ID (17 цифр)
        if (/^[0-9]{17}$/.test(cleaned)) {
            return {
                valid: true,
                type: 'steam64',
                cleanId: cleaned
            };
        }

        // URL профиля
        const urlMatch = cleaned.match(/steamcommunity\.com\/profiles\/([0-9]{17})/);
        if (urlMatch) {
            return {
                valid: true,
                type: 'profile_url',
                cleanId: urlMatch[1]
            };
        }

        // Custom URL
        const customMatch = cleaned.match(/steamcommunity\.com\/id\/([a-zA-Z0-9_]+)/);
        if (customMatch) {
            return {
                valid: true,
                type: 'custom_url',
                cleanId: customMatch[1],
                note: 'Требуется конвертация в Steam64'
            };
        }

        return {
            valid: false,
            error: 'Неверный формат Steam ID'
        };
    }
    
    // Логирование для фронтенда
    getLogMessages() {
        return [
            { timestamp: new Date().toISOString(), type: 'info', message: 'Система готова к работе' },
            { timestamp: new Date().toISOString(), type: 'warning', message: 'Puppeteer не установлен - работает в режиме симуляции' }
        ];
    }
}

module.exports = new SubstitutionService();