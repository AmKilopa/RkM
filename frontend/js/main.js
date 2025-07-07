// Главный скрипт
class App {
    constructor() {
        this.currentPage = 'home';
        this.updateCheckInterval = null;
        this.isUpdating = false;
        this.init();
    }
    
    init() {
        console.log('🔧 Инициализация приложения');
        
        // Очищаем кеш браузера для GitHub API
        this.clearApiCache();
        
        this.setupEventListeners();
        this.updateBugReportLink();
        this.startUpdateMonitoring();
        this.checkBackendStatus();
    }
    
    // Очистка кеша API для предотвращения проблем
    clearApiCache() {
        try {
            // Очищаем sessionStorage от старых данных
            const keysToRemove = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && key.includes('github') || key && key.includes('api')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => sessionStorage.removeItem(key));
            
            console.log('🧹 Кеш API очищен');
        } catch (e) {
            console.log('⚠️ Не удалось очистить кеш:', e.message);
        }
    }
    
    setupEventListeners() {
        document.getElementById('inventory-btn')?.addEventListener('click', () => {
            if (!this.isDisabled('inventory-btn')) {
                this.navigateTo('inventory');
            }
        });
        
        document.getElementById('friend-error-btn')?.addEventListener('click', () => {
            if (!this.isDisabled('friend-error-btn')) {
                this.navigateTo('friend-error');
            }
        });
        
        document.getElementById('substitution-btn')?.addEventListener('click', () => {
            this.navigateTo('substitution');
        });
        
        document.getElementById('changelog-btn')?.addEventListener('click', () => {
            this.showChangelog();
        });
    }
    
    isDisabled(buttonId) {
        return document.getElementById(buttonId)?.classList.contains('disabled');
    }
    
    navigateTo(page) {
        this.currentPage = page;
        this.updateBugReportLink();
        
        if (page === 'substitution') {
            window.substitutionModule.show();
        }
    }
    
    updateBugReportLink() {
        const bugBtn = document.getElementById('bug-report-btn');
        if (!bugBtn) return;
        
        const config = window.RkMConfig?.github;
        if (!config) return;
        
        const links = {
            'home': config.getIssueUrl('home'),
            'inventory': config.getIssueUrl('inventory'),
            'friend-error': config.getIssueUrl('friendError'),
            'substitution': config.getIssueUrl('substitution')
        };
        
        bugBtn.onclick = () => window.open(links[this.currentPage], '_blank');
    }
    
    showHomePage() {
        const pages = document.querySelectorAll('.page:not(#home-page)');
        pages.forEach(page => page.remove());
        
        const homePage = document.getElementById('home-page');
        if (homePage) {
            homePage.classList.add('active');
        }
        
        this.currentPage = 'home';
        this.updateBugReportLink();
    }
    
    showChangelog() {
        if (window.changelogModule) {
            window.changelogModule.show();
        } else {
            window.notifications?.error('Модуль логов недоступен');
        }
    }
    
    startUpdateMonitoring() {
        const config = window.RkMConfig?.github;
        if (!config) {
            console.log('📋 Конфигурация GitHub не найдена');
            return;
        }
        
        // Очищаем localStorage от старых данных для предотвращения проблем
        try {
            const oldCommit = localStorage.getItem('rkm_last_commit');
            console.log('🔄 Запуск мониторинга обновлений, текущий коммит:', oldCommit ? oldCommit.substring(0, 7) : 'none');
        } catch (e) {
            console.log('⚠️ Проблемы с localStorage, используем временное хранение');
        }
        
        // Увеличиваем интервал до 10 минут для избежания rate limiting
        this.updateCheckInterval = setInterval(() => {
            this.checkForUpdates();
        }, 600000); // 10 минут
        
        // Первая проверка через 30 секунд
        setTimeout(() => {
            this.checkForUpdates();
        }, 30000);
        
        console.log('⏰ Мониторинг настроен: проверка каждые 10 минут, первая через 30 секунд');
    }
    
    async checkForUpdates() {
        if (this.isUpdating) {
            console.log('🔄 Уже в процессе обновления, пропускаем проверку');
            return;
        }
        
        const config = window.RkMConfig?.github;
        if (!config) return;
        
        console.log('🔍 Начинаем проверку обновлений...');
        
        try {
            // Агрессивное предотвращение кеширования
            const timestamp = Date.now();
            const randomParam = Math.random().toString(36).substring(7);
            const url = `${config.apiUrl}/commits?per_page=1&_t=${timestamp}&_r=${randomParam}`;
            
            console.log('📡 Запрос к GitHub API:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'RkM-Update-Monitor',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                cache: 'no-store' // Самый строгий режим кеширования
            });
            
            console.log(`📊 Ответ GitHub API: ${response.status} ${response.statusText}`);
            
            if (response.status === 404) {
                console.log(`📋 GitHub репозиторий ${config.owner}/${config.repo} не найден`);
                return;
            }
            
            if (response.status === 403) {
                const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
                const rateLimitReset = response.headers.get('X-RateLimit-Reset');
                
                console.log(`⚠️ GitHub API rate limit exceeded`);
                console.log(`📊 Remaining: ${rateLimitRemaining}, Reset: ${rateLimitReset ? new Date(rateLimitReset * 1000) : 'Unknown'}`);
                
                // Полностью останавливаем проверки при rate limiting
                if (this.updateCheckInterval) {
                    clearInterval(this.updateCheckInterval);
                    this.updateCheckInterval = null;
                }
                
                // Перезапускаем через 1 час
                console.log('🕐 Перезапуск мониторинга через 1 час из-за rate limiting');
                setTimeout(() => {
                    this.startUpdateMonitoring();
                }, 3600000); // 1 час
                
                return;
            }
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }
            
            const commits = await response.json();
            console.log('📋 Получены данные о коммитах:', commits.length);
            
            if (commits && commits[0]) {
                const latestCommit = commits[0];
                console.log('📌 Последний коммит:', latestCommit.sha.substring(0, 7), '-', latestCommit.commit.message.substring(0, 50));
                
                // Безопасная работа с localStorage
                let storedCommit = null;
                try {
                    storedCommit = localStorage.getItem('rkm_last_commit');
                } catch (e) {
                    console.log('⚠️ localStorage недоступен, используем сессионное хранение');
                    storedCommit = sessionStorage.getItem('rkm_last_commit');
                }
                
                console.log('💾 Сохраненный коммит:', storedCommit ? storedCommit.substring(0, 7) : 'none');
                
                if (storedCommit && storedCommit !== latestCommit.sha) {
                    console.log('🆕 ОБНАРУЖЕН НОВЫЙ КОММИТ! Запуск процедуры обновления');
                    this.handleNewUpdate(latestCommit);
                    return;
                } else if (!storedCommit) {
                    // Сохраняем текущий коммит
                    try {
                        localStorage.setItem('rkm_last_commit', latestCommit.sha);
                        console.log('💾 Коммит сохранен в localStorage');
                    } catch (e) {
                        sessionStorage.setItem('rkm_last_commit', latestCommit.sha);
                        console.log('💾 Коммит сохранен в sessionStorage (fallback)');
                    }
                    console.log('📋 Первый запуск - сохранен текущий коммит:', latestCommit.sha.substring(0, 7));
                } else {
                    console.log('✅ Новых коммитов нет');
                }
            }
            
        } catch (error) {
            console.log('❌ Ошибка проверки обновлений:', error.message);
            
            // При любой ошибке увеличиваем интервал
            if (this.updateCheckInterval) {
                clearInterval(this.updateCheckInterval);
            }
            
            console.log('🔄 Перезапуск мониторинга через 15 минут из-за ошибки');
            this.updateCheckInterval = setInterval(() => {
                this.checkForUpdates();
            }, 900000); // 15 минут при ошибках
        }
    }
    
    handleNewUpdate(commit) {
        console.log('🚀 НАЧИНАЕМ ПРОЦЕДУРУ ОБНОВЛЕНИЯ');
        console.log('📝 Коммит:', commit.sha.substring(0, 7), '-', commit.commit.message);
        
        this.isUpdating = true;
        
        // Полностью останавливаем мониторинг
        if (this.updateCheckInterval) {
            clearInterval(this.updateCheckInterval);
            this.updateCheckInterval = null;
            console.log('⏹️ Мониторинг остановлен');
        }
        
        console.log('⏰ Показываем 5-секундное предупреждение...');
        
        this.showUpdateWarning(() => {
            console.log('✅ Предупреждение завершено, показываем страницу обновления');
            this.showUpdatePage(commit);
        });
    }
    
    showUpdateWarning(callback) {
        console.log('⚠️ Показываем предупреждение об обновлении');
        
        let countdown = 5;
        
        const notificationId = window.notifications?.show(
            this.createCountdownHTML(countdown),
            'warning',
            0 // Не исчезает автоматически
        );
        
        console.log('📢 ID уведомления:', notificationId);
        
        // Звуковое предупреждение
        if (window.soundSystem) {
            console.log('🔊 Воспроизводим звук предупреждения');
            window.soundSystem.playWarning();
        }
        
        // Обновляем таймер каждую секунду
        const timer = setInterval(() => {
            countdown--;
            console.log('⏰ Обратный отсчет:', countdown);
            
            const notification = document.getElementById(notificationId);
            if (notification) {
                const textEl = notification.querySelector('.notification-text');
                if (textEl) {
                    textEl.innerHTML = this.createCountdownHTML(countdown);
                }
            } else {
                console.log('⚠️ Уведомление не найдено в DOM');
            }
            
            if (countdown <= 0) {
                clearInterval(timer);
                console.log('⏰ Обратный отсчет завершен');
                
                // Скрываем уведомление
                if (notificationId) {
                    window.notifications?.hide(notificationId);
                    console.log('🗑️ Уведомление скрыто');
                }
                
                // Выполняем callback
                console.log('▶️ Выполняем callback');
                callback();
            }
        }, 1000);
    }
    
    createCountdownHTML(seconds) {
        return `
            <div style="text-align: center; font-size: 1.1rem;">
                <div style="font-weight: bold; margin-bottom: 8px;">🔄 Обновление сайта</div>
                <div style="color: #ccc; margin-bottom: 8px;">Сайт будет перезапущен через:</div>
                <div style="font-size: 2rem; color: #ffc107; font-weight: bold; margin: 8px 0;">${seconds}</div>
                <div style="color: #888; font-size: 0.9rem;">Подготовьтесь к перезагрузке страницы</div>
            </div>
        `;
    }
    
    showUpdatePage(commit) {
        console.log('📄 Создаем страницу обновления');
        
        // Сохраняем новый коммит
        try {
            localStorage.setItem('rkm_last_commit', commit.sha);
            console.log('💾 Новый коммит сохранен в localStorage');
        } catch (e) {
            sessionStorage.setItem('rkm_last_commit', commit.sha);
            console.log('💾 Новый коммит сохранен в sessionStorage (fallback)');
        }
        
        document.body.innerHTML = `
            <button onclick="window.open('https://github.com/AmKilopa/RkM/issues/new?title=HPR', '_blank')" class="bug-report-btn">🐛 Нашёл баг</button>
            <button onclick="window.changelogModule?.show()" class="changelog-btn">📋 Логи обновлений</button>
            
            <div id="notifications-container" class="notifications-container"></div>
            <div id="modal-overlay" class="modal-overlay"></div>
            
            <div class="status-page update-page">
                <div class="main-container">
                    <div class="status-icon rotating">🔄</div>
                    <h1 class="main-title">Обновление сайта</h1>
                    <p class="update-message">🎵 Применяем последние изменения...</p>
                    
                    <div class="commit-info">
                        <h3>🆕 Последний коммит:</h3>
                        <div class="commit-message">${commit.commit.message}</div>
                        <div class="commit-details">
                            <span class="commit-author">👤 ${commit.commit.author.name}</span>
                            <span class="commit-date">📅 ${new Date(commit.commit.author.date).toLocaleString('ru')}</span>
                        </div>
                        <div class="commit-sha">#${commit.sha.substring(0, 7)}</div>
                    </div>
                    
                    <div class="loading-section">
                        <div class="loading-spinner"></div>
                        <p class="loading-text">Воспроизводим мелодию обновления...</p>
                    </div>
                    
                    <div class="auto-refresh">
                        🎵 Сайт автоматически перезагрузится через <span id="countdown">30</span> секунд
                    </div>
                </div>
            </div>
        `;
        
        console.log('🔄 Переинициализируем модули');
        this.reinitializeModules();
        
        // СРАЗУ запускаем зацикленную мелодию
        let melodyIntervalId = null;
        if (window.soundSystem) {
            console.log('🎵 Запускаем зацикленную мелодию обновления');
            melodyIntervalId = window.soundSystem.startLoopingUpdateMelody();
        } else {
            console.log('⚠️ Система звуков недоступна');
        }
        
        // Запускаем 30-секундный таймер
        console.log('⏲️ Запускаем 30-секундный таймер перезагрузки');
        this.startSimpleCountdown(30, melodyIntervalId);
    }
    
    // Тестовая функция для проверки системы обновления
    testUpdateSystem() {
        console.log('🧪 ТЕСТИРОВАНИЕ СИСТЕМЫ ОБНОВЛЕНИЯ');
        
        const fakeCommit = {
            sha: 'test1234567890abcdef',
            commit: {
                message: 'Тестовое обновление для проверки системы',
                author: {
                    name: 'Test User',
                    date: new Date().toISOString()
                }
            }
        };
        
        this.handleNewUpdate(fakeCommit);
    }
    
    startSimpleCountdown(seconds, melodyIntervalId = null) {
        let remaining = seconds;
        const countdownEl = document.getElementById('countdown');
        
        const timer = setInterval(() => {
            remaining--;
            if (countdownEl) {
                countdownEl.textContent = remaining;
            }
            
            if (remaining <= 0) {
                clearInterval(timer);
                
                if (melodyIntervalId && window.soundSystem) {
                    window.soundSystem.stopLoopingMelody(melodyIntervalId);
                }
                
                console.log('⏰ Время ожидания истекло, перезагружаем страницу');
                window.location.reload();
            }
        }, 1000);
    }
    
    async checkBackendStatus() {
        try {
            const connected = await window.api.testConnection();
            if (!connected) {
                this.showOfflinePage();
            }
        } catch (error) {
            this.showOfflinePage();
        }
    }
    
    showOfflinePage() {
        const config = window.RkMConfig?.github;
        const helpUrl = config ? config.getIssueUrl('helpBackend') : 'https://github.com/AmKilopa/RkM/issues/new?title=HBR';
        
        document.body.innerHTML = `
            <button onclick="window.open('${config ? config.getIssueUrl('home') : '#'}', '_blank')" class="bug-report-btn">🐛 Нашёл баг</button>
            <button onclick="window.changelogModule?.show()" class="changelog-btn">📋 Логи обновлений</button>
            
            <div id="notifications-container" class="notifications-container"></div>
            <div id="modal-overlay" class="modal-overlay"></div>
            
            <div class="status-page offline-page">
                <div class="main-container">
                    <h1 class="main-title">📡 Сервер недоступен</h1>
                    <p class="offline-message">Backend сервер не отвечает</p>
                    
                    <div class="offline-content">
                        <div class="offline-info">
                            <p>Если сайт долго не работает, вы можете подать просьбу</p>
                        </div>
                        
                        <div class="buttons-container">
                            <button onclick="window.location.reload()" class="main-btn">
                                🔄 Попробовать снова
                            </button>
                            <button onclick="window.open('${helpUrl}', '_blank')" class="main-btn">
                                📝 Подать просьбу
                            </button>
                        </div>
                    </div>
                    
                    <div class="status-indicator">
                        <div class="pulse-dot offline"></div>
                        <span>Автопроверка каждые 10 секунд</span>
                    </div>
                </div>
            </div>
        `;
        
        this.reinitializeModules();
        
        setInterval(async () => {
            const connected = await window.api.testConnection();
            if (connected) {
                window.location.reload();
            }
        }, 10000);
    }
    
    reinitializeModules() {
        if (window.notifications) {
            window.notifications.updateContainer();
        }
        if (window.modals) {
            window.modals.setupEventListeners();
        }
        if (window.buttonSounds) {
            window.buttonSounds.addSoundsToButtons();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    console.log('🚀 RkM приложение запущено');
    console.log('🧪 Для тестирования системы обновления используйте: window.app.testUpdateSystem()');
    
    // Добавляем информацию о браузере для диагностики
    console.log('🌐 Браузер:', navigator.userAgent);
    console.log('🔄 Поддержка localStorage:', typeof(Storage) !== "undefined");
});