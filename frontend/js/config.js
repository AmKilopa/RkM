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
        this.lastCommitSha = null;
        this.backendAvailable = null;
        this.corsSupported = null;
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
                'Accept': 'application/json',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                ...options.headers
            },
            credentials: 'include',
            mode: 'cors',
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
    
    // === УЛУЧШЕННАЯ ПРОВЕРКА ОБНОВЛЕНИЙ ===
    async checkForUpdates() {
        try {
            console.log('🔍 Проверка обновлений через backend...');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 секунд timeout
            
            const response = await fetch(`${this.baseUrl}/updates/check`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                credentials: 'include',
                mode: 'cors',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Backend ответ получен:', result.success ? 'успешно' : 'с ошибкой');
                
                if (result.success && result.hasUpdate) {
                    console.log('🆕 Найдено обновление через backend!');
                    return {
                        success: true,
                        hasUpdate: true,
                        latestCommit: result.latestCommit?.sha || result.latestCommit,
                        source: 'backend'
                    };
                }
                
                return {
                    success: true,
                    hasUpdate: false,
                    source: 'backend'
                };
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
            
        } catch (error) {
            console.log('❌ Backend недоступен:', error.message);
            
            // Если это CORS ошибка или сеть недоступна, пробуем GitHub API
            if (error.message.includes('CORS') || 
                error.message.includes('Failed to fetch') ||
                error.message.includes('ERR_FAILED') ||
                error.message.includes('blocked') ||
                error.name === 'AbortError') {
                
                console.log('🔄 Переключаемся на GitHub API...');
                return await this.checkForUpdatesGitHub();
            }
            
            throw error;
        }
    }
    
    // === ПРОВЕРКА ЧЕРЕЗ GITHUB API ===
    async checkForUpdatesGitHub() {
        const config = window.RkMConfig?.github;
        if (!config) {
            console.log('❌ GitHub конфиг не найден');
            return { success: false, error: 'No GitHub config' };
        }
        
        try {
            console.log('🔍 Проверка обновлений через GitHub API...');
            
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
                console.log('⚠️ GitHub API rate limit или требуется авторизация');
                return { success: false, error: 'GitHub API rate limit' };
            }
            
            if (response.status === 404) {
                console.log('⚠️ Репозиторий не найден или недоступен');
                return { success: false, error: 'Repository not found' };
            }
            
            if (!response.ok) {
                throw new Error(`GitHub API: ${response.status}`);
            }
            
            const commits = await response.json();
            
            if (commits && commits[0]) {
                const latestCommit = commits[0];
                
                // Проверяем сохраненный коммит
                let storedCommit = null;
                try {
                    storedCommit = localStorage.getItem('rkm_last_commit');
                } catch (e) {
                    storedCommit = sessionStorage.getItem('rkm_last_commit');
                }
                
                if (storedCommit && storedCommit !== latestCommit.sha) {
                    // Найдено обновление!
                    console.log('🆕 Найдено обновление через GitHub API!');
                    
                    try {
                        localStorage.setItem('rkm_update_detected', JSON.stringify({
                            timestamp: new Date().toISOString(),
                            commit: latestCommit.sha,
                            message: latestCommit.commit.message
                        }));
                    } catch (e) {
                        sessionStorage.setItem('rkm_update_detected', JSON.stringify({
                            timestamp: new Date().toISOString(),
                            commit: latestCommit.sha,
                            message: latestCommit.commit.message
                        }));
                    }
                    
                    return {
                        success: true,
                        hasUpdate: true,
                        latestCommit: latestCommit,
                        source: 'github'
                    };
                } else if (!storedCommit) {
                    // Первый запуск - сохраняем текущий коммит
                    try {
                        localStorage.setItem('rkm_last_commit', latestCommit.sha);
                    } catch (e) {
                        sessionStorage.setItem('rkm_last_commit', latestCommit.sha);
                    }
                    console.log('💾 Сохранен текущий коммит для отслеживания');
                }
                
                return {
                    success: true,
                    hasUpdate: false,
                    latestCommit: latestCommit,
                    source: 'github'
                };
            }
            
            return { success: false, error: 'No commits found' };
            
        } catch (error) {
            console.log('❌ Ошибка GitHub API:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    async getLatestCommit() {
        return this.request('/updates/latest-commit', { method: 'GET' });
    }
    
    // === УЛУЧШЕННАЯ ПРОВЕРКА СОЕДИНЕНИЯ ===
    async testConnection() {
        const maxRetries = 3;
        const retryDelay = 1000; // 1 секунда
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔍 Попытка подключения к backend ${attempt}/${maxRetries}`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд timeout
                
                const response = await fetch(`${this.baseUrl}/status`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    },
                    credentials: 'include',
                    mode: 'cors',
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Backend подключен:', data.status);
                    console.log('🔧 CORS статус:', data.cors || 'не указан');
                    
                    this.backendAvailable = true;
                    this.corsSupported = true;
                    return true;
                } else {
                    console.log(`⚠️ Backend ответил с кодом: ${response.status}`);
                    if (attempt === maxRetries) {
                        this.backendAvailable = false;
                        return false;
                    }
                }
                
            } catch (error) {
                console.log(`❌ Ошибка подключения (попытка ${attempt}):`, error.message);
                
                // Специальная обработка CORS ошибок
                if (error.message.includes('CORS') || error.message.includes('Access-Control')) {
                    console.log('🚫 CORS ошибка - проверьте настройки backend');
                    console.log('🔧 Убедитесь что backend включает домен:', window.location.origin);
                    this.corsSupported = false;
                }
                
                // Если это последняя попытка, возвращаем false
                if (attempt === maxRetries) {
                    this.backendAvailable = false;
                    return false;
                }
                
                // Ждем перед следующей попыткой
                await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
            }
        }
        
        this.backendAvailable = false;
        return false;
    }
    
    // === CORS ДИАГНОСТИКА ===
    async testCorsConnection() {
        try {
            console.log('🔧 Тестирование CORS соединения...');
            
            const response = await fetch(`${this.baseUrl}/cors-test`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                credentials: 'include',
                mode: 'cors'
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('🔧 CORS тест результат:', data);
                this.corsSupported = data.allowed;
                return data;
            } else {
                console.log('🔧 CORS тест неудачен:', response.status);
                this.corsSupported = false;
                return null;
            }
            
        } catch (error) {
            console.log('🔧 CORS тест ошибка:', error.message);
            this.corsSupported = false;
            return null;
        }
    }
    
    // === ПРОВЕРКА СОСТОЯНИЯ СИСТЕМЫ ===
    getSystemStatus() {
        return {
            backendAvailable: this.backendAvailable,
            corsSupported: this.corsSupported,
            currentDomain: window.location.origin,
            backendUrl: this.baseUrl
        };
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

// === СИСТЕМА ДИАГНОСТИКИ ===
window.diagnoseCORSIssues = async function() {
    console.log('🔧 ========== ДИАГНОСТИКА CORS ==========');
    console.log('🌐 Текущий домен:', window.location.origin);
    console.log('📍 Backend URL:', window.api?.baseUrl || 'API не инициализирован');
    
    if (!window.api) {
        console.log('❌ API клиент не инициализирован');
        return;
    }
    
    // Тест 1: Простой запрос статуса
    console.log('\n📋 Тест 1: Проверка статуса backend...');
    try {
        const response = await fetch(window.api.baseUrl + '/status', {
            method: 'GET',
            mode: 'cors',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Статус OK:', data.status);
            console.log('🔧 CORS данные:', data.cors || 'не указаны');
        } else {
            console.log('⚠️ Ответ получен, но код:', response.status);
        }
    } catch (error) {
        console.log('❌ Ошибка статуса:', error.message);
    }
    
    // Тест 2: CORS диагностика
    console.log('\n📋 Тест 2: Специальная CORS диагностика...');
    const corsResult = await window.api.testCorsConnection();
    if (corsResult) {
        console.log('✅ CORS тест прошел успешно');
    } else {
        console.log('❌ CORS тест неудачен');
    }
    
    // Тест 3: Проверка обновлений
    console.log('\n📋 Тест 3: Проверка системы обновлений...');
    try {
        const updateResult = await window.api.checkForUpdates();
        console.log('✅ Система обновлений работает:', updateResult.source);
    } catch (error) {
        console.log('❌ Ошибка системы обновлений:', error.message);
    }
    
    // Общий статус
    console.log('\n📊 ИТОГОВЫЙ СТАТУС:');
    const status = window.api.getSystemStatus();
    console.log('🔗 Backend доступен:', status.backendAvailable);
    console.log('🌐 CORS поддерживается:', status.corsSupported);
    console.log('📍 Домен:', status.currentDomain);
    console.log('🔧 Backend URL:', status.backendUrl);
    
    console.log('\n🔧 ========== КОНЕЦ ДИАГНОСТИКИ ==========');
    
    return status;
};

// === ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Инициализация API клиента...');
    
    window.api = new ApiClient();
    window.authSystem = new AuthSystem();
    window.modals = new ModalSystem();
    
    // Тихая проверка соединения
    console.log('🔍 Проверка подключения к backend...');
    const connected = await window.api.testConnection();
    
    if (connected) {
        console.log('🟢 Backend подключен');
        
        // Автоматическая CORS диагностика в production
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            setTimeout(async () => {
                await window.api.testCorsConnection();
            }, 2000);
        }
    } else {
        console.log('🔴 Backend недоступен');
    }
    
   // console.log('✅ Инициализация завершена');
});

window.config = window.RkMConfig;