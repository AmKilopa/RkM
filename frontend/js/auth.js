// === СИСТЕМА АВТОРИЗАЦИИ ===
// Базовый модуль авторизации для RkM

class AuthSystem {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
    }
    
    // Проверка авторизации
    checkAuth() {
        const stored = localStorage.getItem('rkm_auth');
        this.isAuthenticated = stored === 'authenticated';
        return this.isAuthenticated;
    }
    
    // Выход из системы
    logout() {
        localStorage.removeItem('rkm_auth');
        this.isAuthenticated = false;
        this.currentUser = null;
        window.location.reload();
    }
    
    // Получить статус авторизации
    getAuthStatus() {
        return {
            authenticated: this.isAuthenticated,
            user: this.currentUser
        };
    }
}

// Глобальный экземпляр
window.authSystem = new AuthSystem();