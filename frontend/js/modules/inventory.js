// === МОДУЛЬ ИНВЕНТАРЯ ===
// В разработке

class InventoryModule {
    constructor() {
        this.isEnabled = false;
    }
    
    show() {
        window.notifications?.info('Модуль инвентаря находится в разработке');
    }
    
    checkInventory(steamId) {
        return Promise.resolve({
            success: false,
            error: 'Модуль в разработке'
        });
    }
}

// Глобальный экземпляр
window.inventoryModule = new InventoryModule();