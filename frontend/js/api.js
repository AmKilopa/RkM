// === API КЛИЕНТ ===
class ApiClient {
    constructor() {
        this.baseUrl = this.getBackendUrl();
    }
    
    getBackendUrl() {
        if (window.location.protocol === 'file:') {
            return 'http://localhost:3000/api';
        }
        
        const currentHost = window.location.host;
        if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
            return 'http://localhost:3000/api';
        }
        
        return '/api';
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
            
            return await response.json();
            
        } catch (error) {
            if (error.message.includes('fetch')) {
                window.notifications?.error('Нет связи с сервером');
            } else {
                window.notifications?.error('Ошибка API: ' + error.message);
            }
            
            throw error;
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
    
    // === ТЕСТОВЫЙ МЕТОД ===
    async testConnection() {
        try {
            const response = await fetch(this.baseUrl.replace('/api', ''));
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Создаем глобальный экземпляр API
window.api = new ApiClient();

// Проверяем соединение при загрузке (без уведомлений)
document.addEventListener('DOMContentLoaded', async () => {
    await window.api.testConnection();
});