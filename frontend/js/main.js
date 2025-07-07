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
        console.log('🔧 Инициализация мониторинга обновлений');
        console.log('🔗 Backend URL:', window.api?.baseUrl || 'не определен');
        
        // Очищаем localStorage от старых данных для предотвращения проблем
        try {
            const oldCommit = localStorage.getItem('rkm_last_commit');
            console.log('🔄 Запуск мониторинга через backend, последний коммит:', oldCommit ? oldCommit.substring(0, 7) : 'none');
        } catch (e) {
            console.log('⚠️ Проблемы с localStorage, используем временное хранение');
        }
        
        // Проверяем обновления каждые 5 минут через backend
        this.updateCheckInterval = setInterval(() => {
            this.checkForUpdates();
        }, 300000); // 5 минут
        
        // Первая проверка через 10 секунд
        setTimeout(() => {
            this.checkForUpdates();
        }, 10000);
        
        console.log('⏰ Мониторинг настроен: проверка через backend каждые 5 минут, первая через 10 секунд');
    }
    
    async checkForUpdates() {
        if (this.isUpdating) {
            console.log('🔄 Уже в процессе обновления, пропускаем проверку');
            return;
        }
        
        console.log('🔍 Проверяем обновления через backend...');
        
        try {
            // Проверяем обновления через backend вместо прямого обращения к GitHub
            const result = await window.api.checkForUpdates();
            
            console.log('📊 Ответ backend:', result);
            
            if (result.success && result.hasUpdate) {
                console.log('🆕 BACKEND СООБЩАЕТ О НОВОМ ОБНОВЛЕНИИ!');
                console.log('📝 Новый коммит:', result.latestCommit);
                
                this.handleNewUpdate(result.latestCommit);
                return;
            } else if (result.success) {
                console.log('✅ Новых обновлений нет');
            } else {
                console.log('⚠️ Backend не смог проверить обновления:', result.error);
            }
            
        } catch (error) {
            console.log('❌ Ошибка проверки обновлений через backend:', error.message);
            
            // При ошибке backend увеличиваем интервал проверки
            if (this.updateCheckInterval) {
                clearInterval(this.updateCheckInterval);
            }
            
            console.log('🔄 Перезапуск мониторинга через 15 минут из-за ошибки backend');
            this.updateCheckInterval = setInterval(() => {
                this.checkForUpdates();
            }, 900000); // 15 минут при ошибках
        }
    }
    
    handleNewUpdate(commit) {
        console.log('🚀 НАЧИНАЕМ ПРОЦЕДУРУ ОБНОВЛЕНИЯ (данные от backend)');
        console.log('📝 Коммит:', commit.sha?.substring(0, 7) || 'unknown', '-', commit.commit?.message || commit.message || 'no message');
        
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
        console.log('📄 Создаем страницу обновления (данные от backend)');
        
        // Сохраняем новый коммит
        const commitSha = commit.sha || commit.id || 'unknown';
        try {
            localStorage.setItem('rkm_last_commit', commitSha);
            console.log('💾 Новый коммит сохранен в localStorage');
        } catch (e) {
            sessionStorage.setItem('rkm_last_commit', commitSha);
            console.log('💾 Новый коммит сохранен в sessionStorage (fallback)');
        }
        
        // Обработка данных коммита от backend
        const commitMessage = commit.commit?.message || commit.message || 'Обновление получено от backend';
        const authorName = commit.commit?.author?.name || commit.author?.name || 'Backend';
        const authorDate = commit.commit?.author?.date || commit.author?.date || new Date().toISOString();
        const shortSha = commitSha.substring(0, 7);
        
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
                        <div class="commit-message">${commitMessage}</div>
                        <div class="commit-details">
                            <span class="commit-author">👤 ${authorName}</span>
                            <span class="commit-date">📅 ${new Date(authorDate).toLocaleString('ru')}</span>
                        </div>
                        <div class="commit-sha">#${shortSha}</div>
                    </div>
                    
                    <div class="loading-section">
                        <div class="loading-spinner"></div>
                        <p class="loading-text">Воспроизводим мелодию обновления...</p>
                        <p style="font-size: 0.9rem; color: #888; margin-top: 0.5rem;">Обновление получено через backend</p>
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
        console.log('🧪 ТЕСТИРОВАНИЕ СИСТЕМЫ ОБНОВЛЕНИЯ (через backend)');
        
        const fakeCommit = {
            sha: 'test1234567890abcdef',
            commit: {
                message: 'Тестовое обновление для проверки системы через backend',
                author: {
                    name: 'Backend Test',
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
        console.log('🏥 Проверяем статус backend:', window.api?.baseUrl || 'URL не определен');
        
        try {
            const connected = await window.api.testConnection();
            if (!connected) {
                console.log('❌ Backend недоступен, показываем offline страницу');
                this.showOfflinePage();
            } else {
                console.log('✅ Backend доступен и работает');
            }
        } catch (error) {
            console.log('❌ Ошибка при проверке backend:', error.message);
            this.showOfflinePage();
        }
    }
    
    showOfflinePage() {
        const config = window.RkMConfig?.github;
        const helpUrl = config ? config.getIssueUrl('helpBackend') : 'https://github.com/AmKilopa/RkM/issues/new?title=HBR';
        
        console.log('📴 Показываем offline страницу (backend недоступен)');
        
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
                            <p>Backend: https://rkm-9vui.onrender.com</p>
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
            console.log('🔄 Автопроверка backend...');
            const connected = await window.api.testConnection();
            if (connected) {
                console.log('✅ Backend восстановлен, перезагружаем страницу');
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
    console.log('🔗 Backend: https://rkm-9vui.onrender.com');
    console.log('🧪 Для тестирования системы обновления используйте: window.app.testUpdateSystem()');
    
    // Добавляем информацию о браузере для диагностики
    console.log('🌐 Браузер:', navigator.userAgent);
    console.log('🔄 Поддержка localStorage:', typeof(Storage) !== "undefined");
});