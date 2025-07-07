// === МОДУЛЬ FRIEND ERROR ===
// В разработке

class FriendErrorModule {
    constructor() {
        this.isEnabled = false;
    }
    
    show() {
        window.notifications?.info('Модуль Friend Error находится в разработке');
    }
    
    generateScreenshot(steamId) {
        return Promise.resolve({
            success: false,
            error: 'Модуль в разработке'
        });
    }
}

// Глобальный экземпляр
window.friendErrorModule = new FriendErrorModule();