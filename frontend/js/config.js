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
            production: '/api'
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
    },
    
    // Проверка существования репозитория
    async checkRepository() {
        try {
            const response = await fetch(`${this.github.apiUrl}/commits?per_page=1`);
            return response.status !== 404;
        } catch (error) {
            return false;
        }
    }
};