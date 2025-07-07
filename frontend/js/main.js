// === ГЛАВНЫЙ СКРИПТ ===
class App {
    constructor() {
        this.currentPage = 'home';
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateBugReportLink();
        this.startSystemChecks();
    }
    
    setupEventListeners() {
        // Кнопки главной страницы
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
        
        // Кнопка "Логи обновлений"
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
        
        const links = {
            'home': 'https://github.com/AmKilopa/RkM/issues/new?title=HPR',
            'inventory': 'https://github.com/AmKilopa/RkM/issues/new?title=ICR',
            'friend-error': 'https://github.com/AmKilopa/RkM/issues/new?title=FER',
            'substitution': 'https://github.com/AmKilopa/RkM/issues/new?title=SSR'
        };
        
        bugBtn.onclick = () => window.open(links[this.currentPage], '_blank');
    }
    
    showHomePage() {
        // Удаляем все страницы кроме главной
        const pages = document.querySelectorAll('.page:not(#home-page)');
        pages.forEach(page => page.remove());
        
        // Показываем главную страницу
        const homePage = document.getElementById('home-page');
        if (homePage) {
            homePage.classList.add('active');
        }
        
        // Сбрасываем состояние
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
    
    // === СИСТЕМА ПРОВЕРОК ===
    async startSystemChecks() {
        // 1. Проверяем обновления GitHub
        await this.checkForUpdates();
        
        // 2. Проверяем backend
        setTimeout(() => this.checkBackendStatus(), 2000);
        
        // 3. Проверяем Netlify статус
        setTimeout(() => this.checkNetlifyStatus(), 4000);
    }
    
    // === ПРОВЕРКА ОБНОВЛЕНИЙ GITHUB ===
    async checkForUpdates() {
        try {
            const response = await fetch('https://api.github.com/repos/AmKilopa/RkM/commits?per_page=1');
            const commits = await response.json();
            
            if (commits && commits[0]) {
                const latestCommit = commits[0];
                const storedCommit = localStorage.getItem('rkm_last_commit');
                
                if (storedCommit && storedCommit !== latestCommit.sha) {
                    // Есть новое обновление - показываем страницу обновления
                    this.showUpdatePage(latestCommit);
                    return;
                } else if (!storedCommit) {
                    // Первый запуск - сохраняем текущий коммит
                    localStorage.setItem('rkm_last_commit', latestCommit.sha);
                }
            }
        } catch (error) {
            // Игнорируем ошибки проверки обновлений
        }
    }
    
    // === ПРОВЕРКА BACKEND ===
    async checkBackendStatus() {
        try {
            const connected = await window.api.testConnection();
            if (!connected) {
                // Backend недоступен - показываем offline страницу
                this.showOfflinePage();
            }
        } catch (error) {
            this.showOfflinePage();
        }
    }
    
    // === ПРОВЕРКА NETLIFY СТАТУСА ===
    async checkNetlifyStatus() {
        try {
            // Проверяем заголовки ответа для определения статуса деплоя
            const response = await fetch(window.location.origin, { method: 'HEAD' });
            const deployState = response.headers.get('x-nf-request-id');
            
            // Если есть индикатор что идет сборка, показываем страницу сборки
            if (this.isNetlifyBuilding()) {
                this.showBuildingPage();
            }
        } catch (error) {
            // Игнорируем ошибки проверки Netlify
        }
    }
    
    isNetlifyBuilding() {
        // Простая проверка - если URL содержит preview или deploy параметры
        const url = window.location.href;
        return url.includes('deploy-preview') || url.includes('branch-deploy');
    }
    
    // === СТРАНИЦА ОБНОВЛЕНИЯ ===
    showUpdatePage(commit) {
        document.body.innerHTML = `
            <!-- Кнопки интерфейса -->
            <button onclick="window.open('https://github.com/AmKilopa/RkM/issues/new?title=HPR', '_blank')" class="bug-report-btn">🐛 Нашёл баг</button>
            <button onclick="window.changelogModule?.show()" class="changelog-btn">📋 Логи обновлений</button>
            
            <!-- Контейнер для уведомлений -->
            <div id="notifications-container" class="notifications-container"></div>
            
            <!-- Модальные окна -->
            <div id="modal-overlay" class="modal-overlay"></div>
            
            <div class="status-page update-page">
                <div class="main-container">
                    <div class="status-icon rotating">🔄</div>
                    <h1 class="main-title">Обновление сайта</h1>
                    <p class="update-message">На сайте происходят изменения...</p>
                    
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
                        <p class="loading-text">Ожидаем завершения сборки...</p>
                    </div>
                    
                    <div class="buttons-container">
                        <button onclick="window.location.reload()" class="main-btn">
                            🔄 Обновить страницу
                        </button>
                        <button onclick="localStorage.setItem('rkm_last_commit', '${commit.sha}'); window.location.reload()" class="main-btn secondary">
                            ⏭️ Пропустить обновление
                        </button>
                    </div>
                    
                    <div class="auto-refresh">
                        Автоматическое обновление через <span id="countdown">30</span> секунд
                    </div>
                </div>
            </div>
        `;
        
        // Переинициализируем модули
        this.reinitializeModules();
        
        // Запускаем обратный отсчет
        this.startCountdown(30);
        
        // Проверяем статус сборки каждые 30 секунд
        setInterval(() => {
            window.location.reload();
        }, 30000);
    }
    
    // === OFFLINE СТРАНИЦА ===
    showOfflinePage() {
        document.body.innerHTML = `
            <!-- Кнопки интерфейса -->
            <button onclick="window.open('https://github.com/AmKilopa/RkM/issues/new?title=HPR', '_blank')" class="bug-report-btn">🐛 Нашёл баг</button>
            <button onclick="window.changelogModule?.show()" class="changelog-btn">📋 Логи обновлений</button>
            
            <!-- Контейнер для уведомлений -->
            <div id="notifications-container" class="notifications-container"></div>
            
            <!-- Модальные окна -->
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
                            <button onclick="window.open('https://github.com/AmKilopa/RkM/issues/new?title=HBR', '_blank')" class="main-btn">
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
        
        // Переинициализируем модули после смены DOM
        this.reinitializeModules();
        
        // Автоматическая проверка каждые 10 секунд
        setInterval(async () => {
            const connected = await window.api.testConnection();
            if (connected) {
                window.location.reload();
            }
        }, 10000);
    }
    
    // === СТРАНИЦА СБОРКИ NETLIFY ===
    showBuildingPage() {
        document.body.innerHTML = `
            <!-- Кнопки интерфейса -->
            <button onclick="window.open('https://github.com/AmKilopa/RkM/issues/new?title=HPR', '_blank')" class="bug-report-btn">🐛 Нашёл баг</button>
            <button onclick="window.changelogModule?.show()" class="changelog-btn">📋 Логи обновлений</button>
            
            <!-- Контейнер для уведомлений -->
            <div id="notifications-container" class="notifications-container"></div>
            
            <!-- Модальные окна -->
            <div id="modal-overlay" class="modal-overlay"></div>
            
            <div class="status-page building-page">
                <div class="main-container">
                    <div class="status-icon rotating">⚙️</div>
                    <h1 class="main-title">Сборка сайта</h1>
                    <p class="building-message">Netlify выполняет деплой новой версии...</p>
                    
                    <div class="build-progress">
                        <div class="build-step active">📥 Загрузка кода</div>
                        <div class="build-step active">🔨 Сборка проекта</div>
                        <div class="build-step">🚀 Публикация</div>
                        <div class="build-step">✅ Готово</div>
                    </div>
                    
                    <div class="loading-section">
                        <div class="loading-spinner"></div>
                        <p class="loading-text">Ожидаем завершения деплоя...</p>
                    </div>
                    
                    <div class="buttons-container">
                        <button onclick="window.location.reload()" class="main-btn">
                            🔄 Проверить статус
                        </button>
                        <button onclick="window.open('https://app.netlify.com', '_blank')" class="main-btn secondary">
                            📊 Netlify Dashboard
                        </button>
                    </div>
                    
                    <div class="auto-refresh">
                        Автопроверка каждые 15 секунд
                    </div>
                </div>
            </div>
        `;
        
        // Переинициализируем модули
        this.reinitializeModules();
        
        // Проверяем статус каждые 15 секунд
        setInterval(() => {
            window.location.reload();
        }, 15000);
    }
    
    // === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
    reinitializeModules() {
        // Переинициализируем системы после смены DOM
        if (window.notifications) {
            window.notifications.container = document.getElementById('notifications-container');
        }
        if (window.modals) {
            window.modals.overlay = document.getElementById('modal-overlay');
            window.modals.setupEventListeners();
        }
    }
    
    startCountdown(seconds) {
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
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});