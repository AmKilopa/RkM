const axios = require('axios');

class SystemValidator {
    constructor() {
        this.timeout = parseInt(process.env.SYSTEM_CHECK_TIMEOUT) || 10000;
        this.testUrl = process.env.TEST_URL || 'https://google.com';
    }

    async checkAll() {
        console.log('🔍 Начинаем проверку системы (упрощенная версия)...');
        const issues = [];
        const results = {};

        try {
            // 1. Проверка Node.js версии
            const nodeCheck = this.checkNodeVersion();
            results.node = nodeCheck;
            if (!nodeCheck.success) {
                issues.push({
                    name: 'Node.js версия',
                    description: `Требуется Node.js 18+, текущая: ${nodeCheck.version}`,
                    downloadUrl: 'https://nodejs.org/en/download/'
                });
            }

            // 2. Проверка интернет соединения
            const internetCheck = await this.checkInternet();
            results.internet = internetCheck;
            if (!internetCheck.success) {
                issues.push({
                    name: 'Интернет соединение',
                    description: 'Нет доступа к интернету или медленное соединение',
                    downloadUrl: ''
                });
            }

            // 3. Проверка доступности TradeIt API
            const tradeitCheck = await this.checkTradeItAPI();
            results.tradeit = tradeitCheck;
            if (!tradeitCheck.success) {
                issues.push({
                    name: 'TradeIt API',
                    description: 'API TradeIt недоступен',
                    downloadUrl: ''
                });
            }

            // 4. Проверка системных ресурсов
            const resourcesCheck = this.checkSystemResources();
            results.resources = resourcesCheck;

            // 5. Заглушка для Chrome (пока не установлен Puppeteer)
            results.chrome = { 
                success: true, 
                note: 'Puppeteer не установлен, проверка пропущена' 
            };

            console.log(`✅ Проверка завершена. Найдено проблем: ${issues.length}`);
            
            return {
                success: issues.length === 0,
                issues: issues,
                details: results,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Критическая ошибка проверки системы:', error);
            return {
                success: false,
                issues: [{
                    name: 'Критическая ошибка',
                    description: `Произошла критическая ошибка: ${error.message}`,
                    downloadUrl: ''
                }],
                details: results,
                timestamp: new Date().toISOString()
            };
        }
    }

    checkNodeVersion() {
        try {
            const version = process.version;
            const majorVersion = parseInt(version.slice(1).split('.')[0]);
            
            return {
                success: majorVersion >= 18,
                version: version,
                major: majorVersion
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async checkInternet() {
        try {
            console.log('🔍 Проверка интернет соединения...');
            
            const start = Date.now();
            const response = await axios.get('https://www.google.com', {
                timeout: this.timeout,
                headers: {
                    'User-Agent': 'RkM-SystemCheck/1.0'
                }
            });
            const responseTime = Date.now() - start;

            console.log(`✅ Интернет доступен (${responseTime}ms)`);
            return {
                success: response.status === 200,
                responseTime: responseTime,
                status: response.status
            };
        } catch (error) {
            console.error('❌ Нет интернет соединения:', error.message);
            return {
                success: false,
                error: `Интернет недоступен: ${error.message}`
            };
        }
    }

    async checkTradeItAPI() {
        try {
            console.log('🔍 Проверка TradeIt API...');
            
            // Тестовый Steam ID для проверки
            const testSteamId = '76561198000000000';
            const apiUrl = `https://tradeit.gg/api/v2/inventory/search?steamId=${testSteamId}`;
            
            const start = Date.now();
            const response = await axios.get(apiUrl, {
                timeout: this.timeout,
                headers: {
                    'User-Agent': 'RkM-SystemCheck/1.0'
                }
            });
            const responseTime = Date.now() - start;

            console.log(`✅ TradeIt API доступен (${responseTime}ms)`);
            return {
                success: true,
                responseTime: responseTime,
                status: response.status
            };
        } catch (error) {
            console.error('❌ TradeIt API недоступен:', error.message);
            return {
                success: false,
                error: `TradeIt API ошибка: ${error.message}`
            };
        }
    }

    checkSystemResources() {
        try {
            console.log('🔍 Проверка системных ресурсов...');
            
            const freeMemory = process.memoryUsage();
            const totalMemory = require('os').totalmem();
            const freeMemoryMB = Math.round(freeMemory.external / 1024 / 1024);
            const totalMemoryMB = Math.round(totalMemory / 1024 / 1024);
            
            const hasEnoughMemory = totalMemoryMB > 512; // Минимум 512MB
            
            console.log(`💾 Память: ${freeMemoryMB}MB / ${totalMemoryMB}MB`);
            
            return {
                success: hasEnoughMemory,
                memory: {
                    free: freeMemoryMB,
                    total: totalMemoryMB
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new SystemValidator();