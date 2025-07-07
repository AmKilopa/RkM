const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class SystemValidator {
    constructor() {
        this.timeout = 15000;
    }

    async checkAll() {
        try {
            // Только одна проверка - запуск и закрытие Chrome
            const chromeCheck = await this.testChrome();
            
            return {
                success: chromeCheck.success,
                issues: chromeCheck.success ? [] : [{
                    name: 'Chrome браузер',
                    description: chromeCheck.error || 'Chrome недоступен для автоматизации',
                    downloadUrl: 'https://www.google.com/chrome/'
                }],
                details: { chrome: chromeCheck },
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            return {
                success: false,
                issues: [{
                    name: 'Критическая ошибка',
                    description: `Ошибка проверки: ${error.message}`,
                    downloadUrl: ''
                }],
                details: {},
                timestamp: new Date().toISOString()
            };
        }
    }

    async testChrome() {
        try {
            // Определяем путь к Chrome
            const chromePaths = this.getChromePaths();
            let chromeExecutable = null;
            
            // Ищем рабочий Chrome
            for (const path of chromePaths) {
                try {
                    await execAsync(`"${path}" --version`);
                    chromeExecutable = path;
                    break;
                } catch (error) {
                    continue;
                }
            }
            
            if (!chromeExecutable) {
                throw new Error('Chrome не найден в системе');
            }

            // Тестируем запуск Chrome
            const testResult = await this.launchAndCloseChrome(chromeExecutable);
            
            if (testResult.success) {
                return {
                    success: true,
                    executable: chromeExecutable,
                    duration: testResult.duration
                };
            } else {
                throw new Error(testResult.error);
            }

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    getChromePaths() {
        const platform = process.platform;
        
        if (platform === 'win32') {
            return [
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
            ];
        } else if (platform === 'darwin') {
            return [
                '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
            ];
        } else {
            return [
                '/usr/bin/google-chrome',
                '/usr/bin/google-chrome-stable',
                '/usr/bin/chromium-browser'
            ];
        }
    }

    async launchAndCloseChrome(chromeExecutable) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            
            // Запускаем Chrome
            const chromeArgs = [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--no-first-run',
                '--window-size=800,600',
                'about:blank'
            ];

            const chromeProcess = spawn(chromeExecutable, chromeArgs);
            let resolved = false;

            // Таймер для автоматического закрытия через 3 секунды
            const closeTimer = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    chromeProcess.kill();
                    
                    const duration = Date.now() - startTime;
                    resolve({
                        success: true,
                        duration: duration,
                        message: 'Chrome успешно запущен и закрыт'
                    });
                }
            }, 3000);

            // Обработка ошибок процесса
            chromeProcess.on('error', (error) => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(closeTimer);
                    resolve({
                        success: false,
                        error: `Ошибка запуска Chrome: ${error.message}`
                    });
                }
            });

            chromeProcess.on('exit', (code) => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(closeTimer);
                    
                    const duration = Date.now() - startTime;
                    if (code === 0 || duration > 1000) {
                        // Если Chrome работал хотя бы секунду, считаем успехом
                        resolve({
                            success: true,
                            duration: duration,
                            message: 'Chrome работает корректно'
                        });
                    } else {
                        resolve({
                            success: false,
                            error: `Chrome завершился с кодом: ${code}`
                        });
                    }
                }
            });
        });
    }
}

module.exports = new SystemValidator();