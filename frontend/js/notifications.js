// === СИСТЕМА УВЕДОМЛЕНИЙ ===
class NotificationSystem {
    constructor() {
        this.container = document.getElementById('notifications-container');
        this.notifications = new Map();
        this.counter = 0;
    }
    
    // Обновить контейнер при смене DOM
    updateContainer() {
        this.container = document.getElementById('notifications-container');
    }
    
    show(message, type = 'info', duration = 5000) {
        // Обновляем контейнер на случай если DOM изменился
        this.updateContainer();
        
        if (!this.container) {
            return null;
        }
        
        const id = `notification-${++this.counter}`;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.id = id;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon"></div>
                <div class="notification-text">${message}</div>
            </div>
            <button class="notification-close">&times;</button>
            <div class="notification-progress"></div>
        `;
        
        this.container.appendChild(notification);
        this.notifications.set(id, notification);
        
        // Показать уведомление с анимацией
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Обработчик закрытия
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.onclick = () => this.hide(id);
        
        // Автоскрытие
        if (duration > 0) {
            setTimeout(() => this.hide(id), duration);
        }
        
        return id;
    }
    
    hide(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        notification.classList.remove('show');
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
            this.notifications.delete(id);
        }, 400);
    }
    
    // Специальные методы для разных типов
    success(message, duration = 4000) {
        return this.show(message, 'success', duration);
    }
    
    error(message, duration = 6000) {
        return this.show(message, 'error', duration);
    }
    
    info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }
    
    warning(message, duration = 5000) {
        return this.show(message, 'warning', duration);
    }
    
    // Постоянное уведомление (не исчезает автоматически)
    persistent(message, type = 'info') {
        return this.show(message, type, 0);
    }
    
    // Очистить все уведомления
    clear() {
        this.notifications.forEach((notification, id) => {
            this.hide(id);
        });
    }
}

// Инициализация системы уведомлений
window.notifications = new NotificationSystem();