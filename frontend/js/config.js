// === КОНФИГУРАЦИЯ ПРОЕКТА ===
window.RkMConfig = {
    // GitHub настройки
    github: {
        owner: 'AmKilopa',
        repo: 'RkM',
        get apiUrl() {
            return `https://api.github.com/repos/${this.owner}/${this.repo}`;
        },
        issues: {
            home: 'HPR',
            inventory: 'ICR', 
            friendError: 'FER',
            substitution: 'SSR',
            helpBackend: 'HBR'
        },
        getIssueUrl(type) {
            const title = this.issues[type] || 'BUG';
            return `https://github.com/${this.owner}/${this.repo}/issues/new?title=${title}`;
        }
    },
    
    // API настройки
    api: {
        backend: {
            local: 'http://localhost:3000/api',
            production: 'https://rkm-9vui.onrender.com/api'
        },
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
        updateCheck: 30000,
        backendCheck: 10000,
        netlifyCheck: 15000,
        offlineRetry: 10000
    },
    
    // Настройки уведомлений
    notifications: {
        durations: {
            success: 3000,
            error: 5000,
            info: 3000,
            warning: 4000
        }
    },
    
    // Основные настройки приложения
    app: {
        name: 'RkM',
        version: '2.0.0',
        author: 'AmKilopa',
        description: 'Многофункциональное приложение для Steam',
        build: Date.now(),
        environment: 'production'
    },
    
    // Настройки звука
    audio: {
        enabled: true,
        masterVolume: 0.6,
        defaultSoundPack: 'default',
        categories: {
            button: true,
            notification: true,
            interface: true,
            success: true,
            error: true,
            warning: true
        }
    },
    
    // Настройки интерфейса
    ui: {
        animations: true,
        compactMode: false,
        showTooltips: true,
        autoSave: true
    },
    
    // Фичи приложения
    features: {
        inventory: {
            enabled: false,
            inDevelopment: true
        },
        friendError: {
            enabled: false,
            inDevelopment: true
        },
        substitution: {
            enabled: true,
            inDevelopment: false
        },
        settings: {
            enabled: true,
            inDevelopment: false
        },
        changelog: {
            enabled: true,
            inDevelopment: false
        },
        bugReport: {
            enabled: true,
            inDevelopment: false
        }
    },
    
    // Утилиты конфигурации
    get(path, defaultValue = null) {
        return path.split('.').reduce((obj, key) => {
            return obj && obj[key] !== undefined ? obj[key] : defaultValue;
        }, this);
    },
    
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, this);
        target[lastKey] = value;
    },
    
    isFeatureEnabled(featureName) {
        return this.get(`features.${featureName}.enabled`, false);
    },
    
    isDevelopment() {
        return this.get('app.environment') === 'development';
    },
    
    getApiUrl(endpoint) {
        const baseUrl = this.get('api.backendUrl');
        return baseUrl + endpoint;
    }
};

// === API КЛИЕНТ ===
class ApiClient {
    constructor() {
        this.baseUrl = this.getBackendUrl();
    }
    
    getBackendUrl() {
        const config = window.RkMConfig?.api;
        if (config) {
            return config.backendUrl;
        }
        
        if (window.location.protocol === 'file:') {
            return 'http://localhost:3000/api';
        }
        
        const currentHost = window.location.host;
        if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
            return 'http://localhost:3000/api';
        }
        
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
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            throw error;
        }
    }
    
    async checkForUpdates() {
        return this.request('/updates/check', { method: 'GET' });
    }
    
    async getLatestCommit() {
        return this.request('/updates/latest-commit', { method: 'GET' });
    }
    
    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/status`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                timeout: 5000
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.status === 'running';
            }
            
            return false;
            
        } catch (error) {
            return false;
        }
    }
    
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
                window.soundSystem.playInterface();
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
    window.api = new ApiClient();
    window.authSystem = new AuthSystem();
    window.modals = new ModalSystem();
    
    // Тихая проверка соединения
    await window.api.testConnection();
});

window.config = window.RkMConfig;