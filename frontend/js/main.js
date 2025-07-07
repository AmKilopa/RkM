// Главный скрипт
class App {
    constructor() {
        this.currentPage = 'home';
        this.updateCheckInterval = null;
        this.isUpdating = false;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateBugReportLink();
        this.startUpdateMonitoring();
        this.checkBackendStatus();
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
        
        console.log('🔄 Запуск мониторинга обновлений');
        
        this.updateCheckInterval = setInterval(() => {
            this.checkForUpdates();
        }, 120000); // 2 минуты
        
        setTimeout(() => {
            this.checkForUpdates();
        }, 10000); // первая проверка через 10 секунд
    }
    
    async checkForUpdates() {
        if (this.isUpdating) return;
        
        const config = window.RkMConfig?.github;
        if (!config) return;
        
        try {
            const timestamp = Date.now();
            const response = await fetch(`${config.apiUrl}/commits?per_page=1&_t=${timestamp}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'RkM-Update-Monitor'
                },
                cache: 'no-cache'
            });
            
            if (response.status === 404) {
                console.log(`📋 GitHub репозиторий ${config.owner}/${config.repo} не найден`);
                return;
            }
            
            if (response.status === 403) {
                console.log('⚠️ GitHub API rate limit exceeded, увеличиваем интервал');
                if (this.updateCheckInterval) {
                    clearInterval(this.updateCheckInterval);
                }
                this.updateCheckInterval = setInterval(() => {
                    this.checkForUpdates();
                }, 600000); // 10 минут
                return;
            }
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            const commits = await response.json();
            
            if (commits && commits[0]) {
                const latestCommit = commits[0];
                const storedCommit = localStorage.getItem('rkm_last_commit');
                
                if (storedCommit && storedCommit !== latestCommit.sha) {
                    console.log('🆕 Обнаружен новый коммит:', latestCommit.sha.substring(0, 7));
                    this.handleNewUpdate(latestCommit);
                    return;
                } else if (!storedCommit) {
                    localStorage.setItem('rkm_last_commit', latestCommit.sha);
                    console.log('📋 Сохранен текущий коммит:', latestCommit.sha.substring(0, 7));
                }
            }
            
        } catch (error) {
            console.log('📋 Ошибка проверки обновлений:', error.message);
            if (error.message.includes('fetch')) {
                if (this.updateCheckInterval) {
                    clearInterval(this.updateCheckInterval);
                }
                this.updateCheckInterval = setInterval(() => {
                    this.checkForUpdates();
                }, 600000); // 10 минут при проблемах с сетью
            }
        }
    }
    
    handleNewUpdate(commit) {
        this.isUpdating = true;
        
        if (this.updateCheckInterval) {
            clearInterval(this.updateCheckInterval);
            this.updateCheckInterval = null;
        }
        
        console.log('🚀 Запуск процедуры обновления');
        
        this.showUpdateWarning(() => {
            this.showUpdatePage(commit);
        });
    }
    
    showUpdateWarning(callback) {
        let countdown = 5;
        
        const notificationId = window.notifications?.show(
            this.createCountdownHTML(countdown),
            'warning',
            0
        );
        
        if (window.soundSystem) {
            window.soundSystem.playWarning();
        }
        
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
                
                if (notificationId) {
                    window.notifications?.hide(notificationId);
                }
                
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
        localStorage.setItem('rkm_last_commit', commit.sha);
        
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
        
        this.reinitializeModules();
        
        let melodyIntervalId = null;
        if (window.soundSystem) {
            console.log('🎵 Запускаем мелодию сразу при появлении страницы обновления');
            melodyIntervalId = window.soundSystem.startLoopingUpdateMelody();
        }
        
        this.startSimpleCountdown(30, melodyIntervalId);
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
});