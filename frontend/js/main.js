// === ГЛАВНЫЙ СКРИПТ ПРИЛОЖЕНИЯ ===
class App {
    constructor() {
        this.currentPage = 'home';
        this.updateCheckInterval = null;
        this.isUpdating = false;
        this.init();
    }
    
    init() {
        if (!window.api) {
            setTimeout(() => this.init(), 100);
            return;
        }
        
        this.clearApiCache();
        this.setupEventListeners();
        this.updateBugReportLink();
        this.startUpdateMonitoring();
        this.checkBackendStatus();
    }
    
    clearApiCache() {
        try {
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

        // Обработчик для кнопки настроек
        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.showSettings();
        });
        
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('back-btn')) {
                this.showHomePage();
            }
            
            // Обработчик закрытия модального окна настроек
            if (e.target.classList.contains('modal-close') || 
                (e.target.classList.contains('modal-overlay') && e.target === e.currentTarget)) {
                this.closeSettings();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSettings();
                this.showHomePage();
            }
            
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.checkForUpdates();
            }
        });
    }
    
    isDisabled(buttonId) {
        return document.getElementById(buttonId)?.classList.contains('disabled');
    }
    
    navigateTo(page) {
        this.currentPage = page;
        this.updateBugReportLink();
        
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
        }
    }
    
    async loadModule(moduleName) {
        try {
            const script = document.createElement('script');
            script.src = `js/modules/${moduleName}.js`;
            script.onload = () => {
                this.navigateTo(moduleName);
            };
            script.onerror = () => {
                window.notifications?.error(`Ошибка загрузки модуля ${moduleName}`);
            };
            document.head.appendChild(script);
        } catch (error) {
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

    // === МЕТОДЫ ДЛЯ НАСТРОЕК ===
    showSettings() {
        if (window.settings) {
            window.settings.openSettings();
        } else {
            window.notifications?.error('Модуль настроек недоступен');
        }
        
        if (window.soundSystem) {
            window.soundSystem.playInterface();
        }
    }

    closeSettings() {
        const settingsModal = document.querySelector('.settings-modal');
        if (settingsModal) {
            settingsModal.remove();
            document.body.style.overflow = '';
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
        const pages = document.querySelectorAll('.page:not(#home-page)');
        pages.forEach(page => {
            page.style.opacity = '0';
            page.style.transform = 'translateY(-20px)';
            setTimeout(() => page.remove(), 300);
        });
        
        const homePage = document.getElementById('home-page');
        if (homePage) {
            homePage.classList.add('active');
            homePage.style.opacity = '1';
            homePage.style.transform = 'translateY(0)';
        }
        
        this.currentPage = 'home';
        this.updateBugReportLink();
        
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
        const checkInterval = window.RkMConfig?.intervals?.updateCheck || 30000;
        this.updateCheckInterval = setInterval(() => {
            this.checkForUpdates();
        }, checkInterval);
        
        setTimeout(() => {
            this.checkForUpdates();
        }, 2000);
    }
    
    async checkForUpdates() {
        if (this.isUpdating) return;
        
        try {
            const result = await window.api.checkForUpdates();
            
            if (result && result.success && result.hasUpdate) {
                const now = new Date();
                const dateStr = now.toLocaleDateString('ru-RU');
                const timeStr = now.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'});
                const commitShort = result.latestCommit.substring(0, 7);
                
                console.log(`🆕 Обновление ${dateStr} / ${timeStr} \\ #${commitShort}`);
                
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
            if (error.message.includes('404')) {
                await this.checkForUpdatesGitHub();
                return;
            }
            
            if (this.updateCheckInterval) {
                clearInterval(this.updateCheckInterval);
            }
            
            this.updateCheckInterval = setInterval(() => {
                this.checkForUpdates();
            }, 900000);
        }
    }
    
    async checkForUpdatesGitHub() {
        const config = window.RkMConfig?.github;
        if (!config) return;
        
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
            
            if (response.status === 403 || response.status === 404 || !response.ok) {
                return;
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
                    const now = new Date();
                    const dateStr = now.toLocaleDateString('ru-RU');
                    const timeStr = now.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'});
                    const commitShort = latestCommit.sha.substring(0, 7);
                    
                    console.log(`🆕 Обновление ${dateStr} / ${timeStr} \\ #${commitShort}`);
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
            // Тихо игнорируем ошибки
        }
    }
    
    handleNewUpdate(commit) {
        this.isUpdating = true;
        
        if (this.updateCheckInterval) {
            clearInterval(this.updateCheckInterval);
            this.updateCheckInterval = null;
        }
        
        this.showUpdatePage(commit);
    }
    
    showUpdatePage(commit) {
        const commitSha = commit.sha || commit.id || 'unknown';
        try {
            localStorage.setItem('rkm_last_commit', commitSha);
        } catch (e) {
            sessionStorage.setItem('rkm_last_commit', commitSha);
        }
        
        const commitMessage = commit.commit?.message || commit.message || 'Обновление получено';
        const authorName = commit.commit?.author?.name || commit.author?.name || 'Backend';
        const authorDate = commit.commit?.author?.date || commit.author?.date || new Date().toISOString();
        const shortSha = commitSha.substring(0, 7);
        
        document.body.innerHTML = `
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
                    </div>
                    
                    <div class="auto-refresh">
                        Сайт автоматически перезагрузится через <span id="countdown">15</span> секунд
                    </div>
                </div>
            </div>
        `;
        
        this.reinitializeModules();
        this.startSimpleCountdown(15);
    }
    
    startSimpleCountdown(seconds) {
        let remaining = seconds;
        const countdownEl = document.getElementById('countdown');
        
        const timer = setInterval(() => {
            remaining--;
            if (countdownEl) {
                countdownEl.textContent = remaining;
            }
            
            if (remaining <= 0) {
                clearInterval(timer);
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
            console.log('🔴 Backend недоступен');
            this.showOfflinePage();
        }
    }
    
    // === ИСПРАВЛЕННАЯ СТРАНИЦА ОШИБКИ СЕРВЕРА ===
    showOfflinePage() {
        const config = window.RkMConfig?.github;
        const helpUrl = config ? config.getIssueUrl('helpBackend') : 'https://github.com/AmKilopa/RkM/issues/new?title=HBR';
        
        document.body.innerHTML = `
            <div id="notifications-container" class="notifications-container"></div>
            <div id="modal-overlay" class="modal-overlay"></div>
            
            <div class="page active" id="offline-page">
                <div class="main-container">
                    <div class="main-title">
                        <span class="lightning-icon" style="animation: pulse 2s ease-in-out infinite; color: #dc3545;">📡</span>
                        Сервер недоступен
                    </div>
                    
                    <div class="buttons-container">
                        <div class="commit-info" style="margin-bottom: 2rem;">
                            <h3>⚠️ Информация о проблеме</h3>
                            <div class="commit-message">
                                Backend сервер временно не отвечает на запросы
                            </div>
                            <div class="commit-details" style="margin-top: 1rem;">
                                <span class="commit-author">🕒 Ожидаемое время восстановления: до 5 минут</span>
                            </div>
                            <div class="commit-date" style="margin-top: 0.5rem;">
                                📊 Статус: Автоматическая проверка каждые 10 секунд
                            </div>
                        </div>
                        
                        <button onclick="window.location.reload()" class="main-btn" style="background: linear-gradient(145deg, var(--accent-green), #1e7e34);">
                            🔄 Попробовать снова
                            <div class="status">Перезагрузить страницу</div>
                        </button>
                        
                        <button onclick="window.open('${helpUrl}', '_blank')" class="main-btn" style="background: linear-gradient(145deg, var(--accent-red), #c82333);">
                            📝 Сообщить о проблеме
                            <div class="status">Создать заявку в GitHub</div>
                        </button>
                        
                        <div class="main-btn disabled" style="margin-top: 1rem; background: linear-gradient(145deg, #6c757d, #5a6268);">
                            <div style="display: flex; align-items: center; justify-content: center; gap: 1rem;">
                                <div class="status-indicator" style="display: flex; align-items: center; gap: 0.5rem;">
                                    <div class="pulse-dot" style="width: 12px; height: 12px; background: #dc3545; border-radius: 50%; animation: pulse 1.5s ease-in-out infinite;"></div>
                                    <span style="color: var(--text-secondary);">Соединение отсутствует</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Фоновые элементы для красоты -->
                <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 200px; height: 200px; background: radial-gradient(circle, rgba(220, 53, 69, 0.1), transparent); border-radius: 50%; z-index: -1; animation: pulse 3s ease-in-out infinite;"></div>
            </div>
            
            <style>
                @keyframes pulse {
                    0%, 100% { opacity: 0.6; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.05); }
                }
                
                .pulse-dot {
                    animation: pulse 1.5s ease-in-out infinite;
                }
                
                .status-indicator {
                    font-size: 0.9rem;
                    color: var(--text-muted);
                }
                
                #offline-page .main-title {
                    color: var(--accent-red);
                    margin-bottom: 3rem;
                }
                
                #offline-page .commit-info {
                    text-align: left;
                }
                
                #offline-page .commit-message {
                    color: var(--text-primary);
                    font-size: 1.1rem;
                    margin-bottom: 1rem;
                }
                
                #offline-page .commit-details {
                    color: var(--text-secondary);
                }
                
                #offline-page .commit-date {
                    color: var(--text-muted);
                    font-size: 0.9rem;
                }
            </style>
        `;
        
        this.reinitializeModules();
        
        const retryInterval = window.RkMConfig?.intervals?.offlineRetry || 10000;
        setInterval(async () => {
            try {
                const connected = await window.api.testConnection();
                if (connected) {
                    console.log('🟢 Backend восстановлен');
                    window.location.reload();
                }
            } catch (error) {
                // Продолжаем попытки
            }
        }, retryInterval);
    }
    
    reinitializeModules() {
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
    
    // Тест обновления для разработчиков
    testUpdateSystem() {
        const fakeCommit = {
            sha: 'test1234567',
            commit: {
                message: 'Тестовое обновление системы',
                author: {
                    name: 'Test Developer',
                    date: new Date().toISOString()
                }
            }
        };
        
        this.handleNewUpdate(fakeCommit);
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    // Сообщение о получении обновления после перезагрузки
    const updateInfo = localStorage.getItem('rkm_update_detected');
    if (updateInfo) {
        localStorage.removeItem('rkm_update_detected');
        console.log('☑️ Обновление получено');
    }
    
    window.app = new App();
});