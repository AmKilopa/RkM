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
        setTimeout(() => {
            notification.classList.add('show');
            this.createSoundWave();
        }, 100);
        
        // Воспроизводим звук
        this.playNotificationSound(type);
        
        // Обработчик закрытия
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.onclick = () => this.hide(id);
        
        // Автоскрытие
        if (duration > 0) {
            setTimeout(() => this.hide(id), duration);
        }
        
        return id;
    }
    
    // Воспроизведение звука для уведомления
    playNotificationSound(type) {
        if (!window.soundSystem) return;
        
        switch (type) {
            case 'success':
                window.soundSystem.playSuccess();
                break;
            case 'error':
                window.soundSystem.playError();
                break;
            case 'warning':
                window.soundSystem.playWarning();
                break;
            case 'info':
            default:
                window.soundSystem.playInfo();
                break;
        }
    }
    
    // Создание визуального эффекта звуковой волны
    createSoundWave() {
        if (!window.soundSystem?.isEnabled()) return;
        
        const wave = document.createElement('div');
        wave.className = 'sound-wave';
        document.body.appendChild(wave);
        
        setTimeout(() => {
            wave.remove();
        }, 600);
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