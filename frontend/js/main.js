// === ГЛАВНЫЙ СКРИПТ ПРИЛОЖЕНИЯ ===
class App {
    constructor() {
        this.currentPage = 'home';
        this.updateCheckInterval = null;
        this.isUpdating = false;
        this.init();
    }
    
    init() {
        // Ждем инициализации API клиента
        if (!window.api) {
            setTimeout(() => this.init(), 100);
            return;
        }
        
        this.clearApiCache();
        this.setupEventListeners();
        this.updateBugReportLink();
        this.startUpdateMonitoring();
        this.checkBackendStatus();
        
        console.log('✅ Приложение RkM инициализировано');
    }
    
    // Очистка кеша API для предотвращения проблем
    clearApiCache() {
        try {
            // Очищаем sessionStorage от старых данных
            const keysToRemove = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && (key.includes('github') || key.includes('api'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => sessionStorage.removeItem(key));
        } catch (e) {
            // Игнорируем ошибки
        }
    }
    
    setupEventListeners() {
        // Основные кнопки
        document.getElementById('inventory-btn')?.addEventListener('click', () => {
            if (!this.isDisabled('inventory-btn')) {
                this.navigateTo('inventory');
            } else {
                this.showDisabledFeatureMessage('inventory');
            }
        });
        
        document.getElementById('friend-error-btn')?.addEventListener('click', () => {
            if (!this.isDisabled('friend-error-btn')) {
                this.navigateTo('friend-error');
            } else {
                this.showDisabledFeatureMessage('friend-error');
            }
        });
        
        document.getElementById('substitution-btn')?.addEventListener('click', () => {
            this.navigateTo('substitution');
        });
        
        document.getElementById('changelog-btn')?.addEventListener('click', () => {
            this.showChangelog();
        });
        
        // Обработка кнопки "Назад"
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('back-btn')) {
                this.showHomePage();
            }
        });
        
        // Клавиатурные сочетания
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.showHomePage();
            }
            
            // Ctrl+R для обновления
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.checkForUpdates();
            }
        });
        
        // Воспроизведение звуков при загрузке
        if (window.soundSystem) {
            setTimeout(() => {
                window.soundSystem.playInterface();
            }, 500);
        }
    }
    
    isDisabled(buttonId) {
        return document.getElementById(buttonId)?.classList.contains('disabled');
    }
    
    navigateTo(page) {
        this.currentPage = page;
        this.updateBugReportLink();
        
        // Воспроизводим звук навигации
        if (window.soundSystem) {
            window.soundSystem.playInterface();
        }
        
        switch (page) {
            case 'substitution':
                if (window.substitutionModule) {
                    window.substitutionModule.show();
                } else {
                    this.loadModule('substitution');
                }
                break;
            case 'inventory':
                if (window.inventoryModule) {
                    window.inventoryModule.show();
                } else {
                    this.loadModule('inventory');
                }
                break;
            case 'friend-error':
                if (window.friendErrorModule) {
                    window.friendErrorModule.show();
                } else {
                    this.loadModule('friend-error');
                }
                break;
            default:
                console.warn(`Неизвестная страница: ${page}`);
        }
    }
    
    // Загрузка модулей по требованию
    async loadModule(moduleName) {
        try {
            const script = document.createElement('script');
            script.src = `js/modules/${moduleName}.js`;
            script.onload = () => {
                console.log(`✅ Модуль ${moduleName} загружен`);
                // Повторная попытка навигации после загрузки
                this.navigateTo(moduleName);
            };
            script.onerror = () => {
                console.error(`❌ Ошибка загрузки модуля ${moduleName}`);
                window.notifications?.error(`Ошибка загрузки модуля ${moduleName}`);
            };
            document.head.appendChild(script);
        } catch (error) {
            console.error(`Ошибка загрузки модуля ${moduleName}:`, error);
            window.notifications?.error(`Ошибка загрузки модуля ${moduleName}`);
        }
    }
    
    showDisabledFeatureMessage(feature) {
        const messages = {
            'inventory': 'Функция "Узнать стоимость инвентаря" находится в разработке',
            'friend-error': 'Функция "Friend ошибка" находится в разработке'
        };
        
        window.notifications?.warning(messages[feature] || 'Функция в разработке');
        
        if (window.soundSystem) {
            window.soundSystem.playWarning();
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
        
        bugBtn.onclick = () => {
            window.open(links[this.currentPage], '_blank');
            if (window.soundSystem) {
                window.soundSystem.playInterface();
            }
        };
    }
    
    showHomePage() {
        // Удаляем все страницы кроме главной
        const pages = document.querySelectorAll('.page:not(#home-page)');
        pages.forEach(page => {
            page.style.opacity = '0';
            page.style.transform = 'translateY(-20px)';
            setTimeout(() => page.remove(), 300);
        });
        
        // Показываем главную страницу
        const homePage = document.getElementById('home-page');
        if (homePage) {
            homePage.classList.add('active');
            homePage.style.opacity = '1';
            homePage.style.transform = 'translateY(0)';
        }
        
        this.currentPage = 'home';
        this.updateBugReportLink();
        
        // Звук возврата на главную
        if (window.soundSystem) {
            window.soundSystem.playInterface();
        }
    }
    
    showChangelog() {
        if (window.changelogModule) {
            window.changelogModule.show();
        } else {
            window.notifications?.error('Модуль логов недоступен');
        }
        
        if (window.soundSystem) {
            window.soundSystem.playInterface();
        }
    }
    
    startUpdateMonitoring() {
        try {
            const oldCommit = localStorage.getItem('rkm_last_commit');
        } catch (e) {
            // Игнорируем ошибки localStorage
        }
        
        // Проверка каждые 30 секунд для webhook обновлений
        const checkInterval = window.RkMConfig?.intervals?.updateCheck || 30000;
        this.updateCheckInterval = setInterval(() => {
            this.checkForUpdates();
        }, checkInterval);
        
        // Первая проверка через 2 секунды после загрузки
        setTimeout(() => {
            this.checkForUpdates();
        }, 2000);
        
        console.log(`🔄 Мониторинг обновлений запущен (интервал: ${checkInterval/1000}с)`);
    }
    
    async checkForUpdates() {
        if (this.isUpdating) {
            return;
        }
        
        try {
            // Проверяем обновления через backend
            const result = await window.api.checkForUpdates();
            
            if (result && result.success && result.hasUpdate) {
                console.log('🆕 Обновление обнаружено!');
                
                // Сохраняем информацию о том что обновление обнаружено
                try {
                    localStorage.setItem('rkm_update_detected', JSON.stringify({
                        timestamp: new Date().toISOString(),
                        commit: result.latestCommit
                    }));
                } catch (e) {
                    // Игнорируем ошибки localStorage
                }
                
                this.handleNewUpdate(result.latestCommit);
                return;
            }
            
        } catch (error) {
            // Если API эндпоинт не найден (404), используем fallback на GitHub
            if (error.message.includes('404')) {
                await this.checkForUpdatesGitHub();
                return;
            }
            
            // При других ошибках backend увеличиваем интервал проверки
            if (this.updateCheckInterval) {
                clearInterval(this.updateCheckInterval);
            }
            
            // Увеличиваем интервал при ошибках
            this.updateCheckInterval = setInterval(() => {
                this.checkForUpdates();
            }, 900000); // 15 минут при ошибках
            
            console.warn('⚠️ Ошибка проверки обновлений через backend, переход на fallback режим');
        }
    }
    
    // Fallback проверка через GitHub (если API не реализован)
    async checkForUpdatesGitHub() {
        const config = window.RkMConfig?.github;
        if (!config) {
            return;
        }
        
        try {
            const timestamp = Date.now();
            const randomParam = Math.random().toString(36).substring(7);
            const url = `${config.apiUrl}/commits?per_page=1&_t=${timestamp}&_r=${randomParam}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                cache: 'no-store'
            });
            
            if (response.status === 403) {
                console.warn('⚠️ GitHub API лимит превышен');
                return;
            }
            
            if (response.status === 404) {
                console.warn('⚠️ GitHub репозиторий не найден');
                return;
            }
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            const commits = await response.json();
            
            if (commits && commits[0]) {
                const latestCommit = commits[0];
                
                let storedCommit = null;
                try {
                    storedCommit = localStorage.getItem('rkm_last_commit');
                } catch (e) {
                    storedCommit = sessionStorage.getItem('rkm_last_commit');
                }
                
                if (storedCommit && storedCommit !== latestCommit.sha) {
                    console.log('🆕 Обновление получено через GitHub!');
                    this.handleNewUpdate(latestCommit);
                    return;
                } else if (!storedCommit) {
                    try {
                        localStorage.setItem('rkm_last_commit', latestCommit.sha);
                    } catch (e) {
                        sessionStorage.setItem('rkm_last_commit', latestCommit.sha);
                    }
                }
            }
            
        } catch (error) {
            console.warn('⚠️ Ошибка fallback проверки через GitHub:', error.message);
        }
    }
    
    handleNewUpdate(commit) {
        this.isUpdating = true;
        
        // Полностью останавливаем мониторинг
        if (this.updateCheckInterval) {
            clearInterval(this.updateCheckInterval);
            this.updateCheckInterval = null;
        }
        
        this.showUpdateWarning(() => {
            this.showUpdatePage(commit);
        });
    }
    
    showUpdateWarning(callback) {
        let countdown = 5;
        
        const notificationId = window.notifications?.show(
            this.createCountdownHTML(countdown),
            'warning',
            0 // Не исчезает автоматически
        );
        
        // Звуковое предупреждение
        if (window.soundSystem) {
            window.soundSystem.playWarning();
        }
        
        // Обновляем таймер каждую секунду
        const timer = setInterval(() => {
            countdown--;
            
            const notification = document.getElementById(notificationId);
            if (notification) {
                const textEl = notification.querySelector('.notification-text');
                if (textEl) {
                    textEl.innerHTML = this.createCountdownHTML(countdown);
                }
            }
            
            if (countdown <= 0) {
                clearInterval(timer);
                
                // Скрываем уведомление
                if (notificationId) {
                    window.notifications?.hide(notificationId);
                }
                
                // Выполняем callback
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
        // Сохраняем новый коммит
        const commitSha = commit.sha || commit.id || 'unknown';
        try {
            localStorage.setItem('rkm_last_commit', commitSha);
        } catch (e) {
            sessionStorage.setItem('rkm_last_commit', commitSha);
        }
        
        // Обработка данных коммита от backend
        const commitMessage = commit.commit?.message || commit.message || 'Обновление получено от backend';
        const authorName = commit.commit?.author?.name || commit.author?.name || 'Backend';
        const authorDate = commit.commit?.author?.date || commit.author?.date || new Date().toISOString();
        const shortSha = commitSha.substring(0, 7);
        
        document.body.innerHTML = `
            <button onclick="window.open('${window.RkMConfig?.github?.getIssueUrl('home') || '#'}', '_blank')" class="bug-report-btn">🐛 Нашёл баг</button>
            <button onclick="window.changelogModule?.show()" class="changelog-btn">📋 Логи обновлений</button>
            
            <div id="notifications-container" class="notifications-container"></div>
            <div id="modal-overlay" class="modal-overlay"></div>
            
            <div class="status-page update-page">
                <div class="main-container">
                    <div class="status-icon rotating">🔄</div>
                    <h1 class="main-title">Обновление сайта</h1>
                    <p class="update-message">Применяем последние изменения...</p>
                    
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
                        <p class="loading-text">Подготовка к перезагрузке...</p>
                        <p style="font-size: 0.9rem; color: #888; margin-top: 0.5rem;">Обновление получено</p>
                    </div>
                    
                    <div class="auto-refresh">
                        Сайт автоматически перезагрузится через <span id="countdown">30</span> секунд
                    </div>
                </div>
            </div>
        `;
        
        this.reinitializeModules();
        
        // Запускаем обновительную мелодию
        let melodyIntervalId = null;
        if (window.soundSystem && window.soundSystem.startLoopingUpdateMelody) {
            melodyIntervalId = window.soundSystem.startLoopingUpdateMelody();
        }
        
        // Запускаем 30-секундный таймер
        this.startSimpleCountdown(30, melodyIntervalId);
    }
    
    // Тестовая функция для проверки системы обновления
    testUpdateSystem() {
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
        
        console.log('🧪 Запуск тестового обновления...');
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
                
                window.location.reload();
            }
        }, 1000);
    }
    
    async checkBackendStatus() {
        try {
            const connected = await window.api.testConnection();
            if (!connected) {
                console.log('🔴 Backend недоступен');
                this.showOfflinePage();
            } else {
                console.log('🟢 Backend доступен');
            }
        } catch (error) {
            console.log('🔴 Backend недоступен:', error.message);
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
                    <div class="status-icon pulsing">📡</div>
                    <h1 class="main-title">Сервер недоступен</h1>
                    <p class="offline-message">Backend сервер не отвечает</p>
                    
                    <div class="commit-info">
                        <h3>ℹ️ Информация:</h3>
                        <div class="commit-message">Ожидайте восстановления в течение 5 минут</div>
                        <div class="commit-details">
                            <span>Если сайт долго не работает, вы можете подать просьбу</span>
                        </div>
                    </div>
                    
                    <div class="buttons-container">
                        <button onclick="window.location.reload()" class="main-btn">
                            🔄 Попробовать снова
                        </button>
                        <button onclick="window.open('${helpUrl}', '_blank')" class="main-btn">
                            📝 Подать просьбу
                        </button>
                    </div>
                    
                    <div class="status-indicator">
                        <div class="pulse-dot offline"></div>
                        <span>Автопроверка каждые 10 секунд</span>
                    </div>
                </div>
            </div>
        `;
        
        this.reinitializeModules();
        
        // Автоматическая проверка восстановления backend
        const retryInterval = window.RkMConfig?.intervals?.offlineRetry || 10000;
        setInterval(async () => {
            const connected = await window.api.testConnection();
            if (connected) {
                console.log('🟢 Backend восстановлен');
                window.location.reload();
            }
        }, retryInterval);
    }
    
    reinitializeModules() {
        // Переинициализируем модули после изменения DOM
        setTimeout(() => {
            if (window.notifications) {
                window.notifications.updateContainer();
            }
            if (window.modals) {
                window.modals.setupEventListeners();
            }
            if (window.buttonSounds) {
                window.buttonSounds.refreshBindings();
            }
        }, 100);
    }
    
    // Методы для разработки и отладки
    debug() {
        return {
            currentPage: this.currentPage,
            isUpdating: this.isUpdating,
            updateCheckInterval: this.updateCheckInterval,
            testUpdate: () => this.testUpdateSystem(),
            checkUpdates: () => this.checkForUpdates(),
            goHome: () => this.showHomePage()
        };
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    
    // Добавляем debug методы в консоль для разработки
    if (window.RkMConfig?.isDevelopment()) {
        window.debugApp = () => window.app.debug();
        console.log('🔧 Режим разработки: используйте debugApp() для отладки');
    }
});