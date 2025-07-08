// === КОНФИГУРАЦИЯ ПРОЕКТА ===
window.RkMConfig = {
    // GitHub настройки
    github: {
        owner: 'AmKilopa',
        repo: 'RkM',
        // Полный путь для API
        get apiUrl() {
            return `https://api.github.com/repos/${this.owner}/${this.repo}`;
        },
        // Ссылки на issues
        issues: {
            home: 'HPR',
            inventory: 'ICR', 
            friendError: 'FER',
            substitution: 'SSR',
            helpBackend: 'HBR'
        },
        // Генерация ссылки на issue
        getIssueUrl(type) {
            const title = this.issues[type] || 'BUG';
            return `https://github.com/${this.owner}/${this.repo}/issues/new?title=${title}`;
        }
    },
    
    // API настройки
    api: {
        backend: {
            local: 'http://localhost:3000/api',
            production: 'https://rkm-9vui.onrender.com/api'  // НОВЫЙ URL!
        },
        // Определение текущего URL
        get backendUrl() {
            if (window.location.protocol === 'file:') {
                return this.backend.local;
            }
            
            const currentHost = window.location.host;
            if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
                return this.backend.local;
            }
            
            return this.backend.production;
        }
    },
    
    // Интервалы проверок (в миллисекундах)
    intervals: {
        updateCheck: 30000,    // 30 секунд
        backendCheck: 10000,   // 10 секунд
        netlifyCheck: 15000,   // 15 секунд
        offlineRetry: 10000    // 10 секунд
    },
    
    // Настройки уведомлений
    notifications: {
        durations: {
            success: 4000,
            error: 6000,
            info: 5000,
            warning: 5000
        }
    }
};

// === API КЛИЕНТ ===
class ApiClient {
    constructor() {
        this.baseUrl = this.getBackendUrl();
        console.log('🔗 API клиент инициализирован, Backend URL:', this.baseUrl);
    }
    
    getBackendUrl() {
        // Используем конфигурацию
        const config = window.RkMConfig?.api;
        if (config) {
            return config.backendUrl;
        }
        
        // Fallback
        if (window.location.protocol === 'file:') {
            return 'http://localhost:3000/api';
        }
        
        const currentHost = window.location.host;
        if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
            return 'http://localhost:3000/api';
        }
        
        // Новый production URL
        return 'https://rkm-9vui.onrender.com/api';
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        try {
            console.log(`📡 API запрос: ${config.method || 'GET'} ${url}`);
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ API ответ получен');
            return data;
            
        } catch (error) {
            console.log('❌ Ошибка API:', error.message);
            throw error;
        }
    }
    
    // === ПРОВЕРКА ОБНОВЛЕНИЙ ЧЕРЕЗ BACKEND ===
    async checkForUpdates() {
        return this.request('/updates/check', { method: 'GET' });
    }
    
    async getLatestCommit() {
        return this.request('/updates/latest-commit', { method: 'GET' });
    }
    
    // === ТЕСТОВЫЙ МЕТОД - ИСПРАВЛЕНО! ===
    async testConnection() {
        try {
            // ИСПРАВЛЕНО: проверяем API эндпоинт /status вместо корневого URL
            const response = await fetch(`${this.baseUrl}/status`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                timeout: 5000
            });
            
            console.log('🏥 Backend проверка:', response.status, response.statusText);
            
            if (response.ok) {
                const data = await response.json();
                console.log('📊 Backend ответ:', data);
                return data.status === 'running';
            }
            
            return false;
            
        } catch (error) {
            console.log('❌ Backend недоступен:', error.message);
            return false;
        }
    }
    
    // === МЕТОДЫ ДЛЯ ПОДМЕНЫ ===
    async authenticateSubstitution(password) {
        return this.request('/substitution/auth', {
            method: 'POST',
            body: JSON.stringify({ password })
        });
    }
    
    async checkSystemHealth() {
        return this.request('/substitution/check-system', { method: 'POST' });
    }
    
    async startSubstitution(steamId) {
        return this.request('/substitution/start', {
            method: 'POST',
            body: JSON.stringify({ steamId })
        });
    }
    
    // === МЕТОДЫ ДЛЯ ИНВЕНТАРЯ ===
    async checkInventory(steamId) {
        return this.request('/inventory/check', {
            method: 'POST',
            body: JSON.stringify({ steamId })
        });
    }
    
    async validateSteamId(steamId) {
        return this.request('/inventory/validate-steamid', {
            method: 'POST',
            body: JSON.stringify({ steamId })
        });
    }
    
    // === МЕТОДЫ ДЛЯ FRIEND ERROR ===
    async generateFriendError(steamId) {
        return this.request('/friend-error/generate', {
            method: 'POST',
            body: JSON.stringify({ steamId })
        });
    }
}

// === СИСТЕМА АВТОРИЗАЦИИ ===
class AuthSystem {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
    }
    
    checkAuth() {
        const stored = localStorage.getItem('rkm_auth');
        this.isAuthenticated = stored === 'authenticated';
        return this.isAuthenticated;
    }
    
    logout() {
        localStorage.removeItem('rkm_auth');
        this.isAuthenticated = false;
        this.currentUser = null;
        window.location.reload();
    }
    
    getAuthStatus() {
        return {
            authenticated: this.isAuthenticated,
            user: this.currentUser
        };
    }
}

// === МОДАЛЬНЫЕ ОКНА ===
class ModalSystem {
    constructor() {
        this.overlay = document.getElementById('modal-overlay');
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.overlay = document.getElementById('modal-overlay');
        
        if (this.overlay) {
            this.overlay.replaceWith(this.overlay.cloneNode(true));
            this.overlay = document.getElementById('modal-overlay');
            
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.hide();
                }
            });
        }
    }
    
    show(content) {
        if (!this.overlay) {
            this.overlay = document.getElementById('modal-overlay');
        }
        
        if (this.overlay) {
            this.overlay.innerHTML = content;
            this.overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            if (window.soundSystem) {
                window.soundSystem.playModal();
            }
        }
    }
    
    hide() {
        if (this.overlay) {
            this.overlay.classList.remove('active');
            document.body.style.overflow = '';
            setTimeout(() => {
                if (this.overlay) {
                    this.overlay.innerHTML = '';
                }
            }, 300);
        }
    }
}

// === ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔧 Инициализация API и модулей');
    
    // Создаем глобальные экземпляры
    window.api = new ApiClient();
    window.authSystem = new AuthSystem();
    window.modals = new ModalSystem();
    
    console.log('✅ API клиент создан:', window.api.baseUrl);
    
    // Проверяем соединение
    const connected = await window.api.testConnection();
    if (connected) {
        console.log('✅ Соединение с backend установлено');
    } else {
        console.log('❌ Backend недоступен');
    }
});