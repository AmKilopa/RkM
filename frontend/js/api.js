// === API КЛИЕНТ ===
class ApiClient {
    constructor() {
        // Определяем URL backend автоматически
        this.baseUrl = this.getBackendUrl();
        console.log('🔗 API подключается к:', this.baseUrl);
    }
    
    getBackendUrl() {
        // Если запущен через file:// (двойной клик), используем localhost
        if (window.location.protocol === 'file:') {
            return 'http://localhost:3000/api';
        }
        
        // Если запущен через live-server или другой сервер
        const currentHost = window.location.host;
        if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
            return 'http://localhost:3000/api';
        }
        
        // Для продакшена (Netlify)
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
            console.log(`📡 API запрос: ${config.method || 'GET'} ${url}`);
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ API ответ получен:', data);
            return data;
            
        } catch (error) {
            console.error('❌ API ошибка:', error);
            
            // Показываем пользователю понятную ошибку
            if (error.message.includes('fetch')) {
                window.notifications?.show('Нет связи с сервером. Убедитесь что backend запущен на порту 3000', 'error');
            } else {
                window.notifications?.show('Ошибка API: ' + error.message, 'error');
            }
            
            throw error;
        }
    }
    
    // === МЕТОДЫ ДЛЯ ПОДМЕНЫ ===
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
            if (response.ok) {
                console.log('✅ Соединение с backend установлено');
                return true;
            }
        } catch (error) {
            console.error('❌ Backend недоступен:', error);
            return false;
        }
        return false;
    }
}

// Создаем глобальный экземпляр API
window.api = new ApiClient();

// Тестируем соединение при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔄 Проверяем соединение с backend...');
    const connected = await window.api.testConnection();
    
    if (!connected) {
        setTimeout(() => {
            window.notifications?.show(
                'Внимание: Backend сервер недоступен. Запустите: npm start в папке backend', 
                'warning', 
                10000
            );
        }, 2000);
    } else {
        console.log('✅ Frontend готов к работе!');
    }
});