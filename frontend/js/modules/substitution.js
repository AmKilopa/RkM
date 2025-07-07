// === МОДУЛЬ ПОДМЕНЫ ===
class SubstitutionModule {
    constructor() {
        this.isAuthenticated = false;
        this.systemChecked = false;
        this.password = 'admin123'; // В продакшене использовать env
        this.init();
    }
    
    init() {
        this.checkStoredAuth();
    }
    
    checkStoredAuth() {
        const stored = localStorage.getItem('rkm_auth');
        if (stored === this.password) {
            this.isAuthenticated = true;
        }
    }
    
    show() {
        if (!this.isAuthenticated) {
            this.showAuthModal();
        } else {
            this.showSubstitutionPage();
        }
    }
    
    showAuthModal() {
        const modal = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">Авторизация</h3>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Введите пароль:</label>
                        <input type="password" id="auth-password" class="form-input" placeholder="Пароль">
                    </div>
                    <button onclick="window.substitutionModule.authenticate()" class="btn">Войти</button>
                    <button onclick="window.modals.hide()" class="btn btn-danger" style="margin-left: 10px;">Отмена</button>
                </div>
            </div>
        `;
        
        window.modals.show(modal);
        
        // Enter для входа
        document.getElementById('auth-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.authenticate();
            }
        });
    }
    
    authenticate() {
        const password = document.getElementById('auth-password').value;
        
        if (password === this.password) {
            this.isAuthenticated = true;
            localStorage.setItem('rkm_auth', password);
            window.modals.hide();
            window.notifications.show('Успешная авторизация', 'success');
            this.showSubstitutionPage();
        } else {
            window.notifications.show('Неверный пароль', 'error');
        }
    }
    
    showSubstitutionPage() {
        document.getElementById('home-page').classList.remove('active');
        
        const pageHtml = `
            <div id="substitution-page" class="page active">
                <button onclick="window.app.showHomePage()" class="back-btn">← Назад на главную</button>
                
                <div class="form-container">
                    <h2>Создание подмены</h2>
                    
                    ${!this.systemChecked ? this.getSystemCheckHtml() : this.getWorkInterfaceHtml()}
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', pageHtml);
    }
    
    getSystemCheckHtml() {
        return `
            <div class="system-check">
                <h3>Проверка системы</h3>
                <p>Перед началом работы необходимо проверить готовность системы.</p>
                <button onclick="window.substitutionModule.checkSystem()" class="btn btn-success">
                    Проверить работоспособность
                </button>
            </div>
        `;
    }
    
    getWorkInterfaceHtml() {
        return `
            <div class="work-interface">
                <div class="form-group">
                    <label class="form-label">Steam ID для подмены:</label>
                    <input type="text" id="target-steamid" class="form-input" placeholder="Введите Steam ID">
                </div>
                
                <button onclick="window.substitutionModule.startSubstitution()" class="btn">
                    Начать подмену
                </button>
                
                <div class="logs-container" id="substitution-logs">
                    <div class="log-entry log-info">Система готова к работе</div>
                </div>
            </div>
        `;
    }
    
    async checkSystem() {
        window.notifications.show('Проверка системы...', 'info');
        
        try {
            const response = await fetch('/api/substitution/check-system', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.systemChecked = true;
                window.notifications.show('Система готова к работе', 'success');
                this.refreshInterface();
            } else {
                this.showSystemIssues(result.issues);
            }
        } catch (error) {
            window.notifications.show('Ошибка проверки системы', 'error');
        }
    }
    
    showSystemIssues(issues) {
        window.notifications.show('Обнаружены проблемы с системой', 'error');
        
        const modal = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">Проблемы системы</h3>
                </div>
                <div class="modal-body">
                    ${issues.map(issue => `
                        <div class="system-issue">
                            <h4>${issue.name}</h4>
                            <p>${issue.description}</p>
                            <button onclick="window.substitutionModule.downloadComponent('${issue.downloadUrl}')" class="btn">
                                Скачать
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        window.modals.show(modal);
    }
    
    downloadComponent(url) {
        window.open(url, '_blank');
        window.notifications.show('Скачивание начато', 'info');
    }
    
    refreshInterface() {
        const container = document.querySelector('#substitution-page .form-container');
        container.innerHTML = `
            <h2>Создание подмены</h2>
            ${this.getWorkInterfaceHtml()}
        `;
    }
    
    async startSubstitution() {
        const steamId = document.getElementById('target-steamid').value;
        if (!steamId.trim()) {
            window.notifications.show('Введите Steam ID', 'error');
            return;
        }
        
        this.addLog('Начинаем процесс подмены...', 'info');
        
        try {
            const response = await fetch('/api/substitution/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ steamId })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.addLog('Подмена успешно запущена', 'success');
                window.notifications.show('Подмена запущена', 'success');
            } else {
                this.addLog('Ошибка: ' + result.error, 'error');
                window.notifications.show('Ошибка подмены', 'error');
            }
        } catch (error) {
            this.addLog('Критическая ошибка: ' + error.message, 'error');
            window.notifications.show('Критическая ошибка', 'error');
        }
    }
    
    addLog(message, type = 'info') {
        const logsContainer = document.getElementById('substitution-logs');
        if (!logsContainer) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `
            <div class="log-entry log-${type}">
                [${timestamp}] ${message}
            </div>
        `;
        
        logsContainer.insertAdjacentHTML('beforeend', logEntry);
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }
}

// Инициализация модуля
window.substitutionModule = new SubstitutionModule();