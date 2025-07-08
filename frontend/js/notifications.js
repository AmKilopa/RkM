// === СИСТЕМА УВЕДОМЛЕНИЙ ===
class NotificationSystem {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.counter = 0;
        this.maxNotifications = 3;
        this.defaultDuration = 4000;
        this.animationDuration = 300;
        
        this.updateContainer();
        this.setupGlobalStyles();
    }
    
    updateContainer() {
        this.container = document.getElementById('notifications-container');
        if (!this.container) {
            this.createContainer();
        }
    }
    
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'notifications-container';
        this.container.className = 'notifications-container';
        document.body.appendChild(this.container);
    }
    
    setupGlobalStyles() {
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notifications-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    max-width: 400px;
                    pointer-events: none;
                }
                
                .notification {
                    background: linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(42, 42, 42, 0.95));
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 16px 20px;
                    color: #ffffff;
                    backdrop-filter: blur(20px);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                    transform: translateX(420px);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    pointer-events: all;
                    border-left: 4px solid #007bff;
                }
                
                .notification.show {
                    transform: translateX(0);
                }
                
                .notification.success {
                    border-left-color: #28a745;
                }
                
                .notification.error {
                    border-left-color: #dc3545;
                }
                
                .notification.warning {
                    border-left-color: #ffc107;
                }
                
                .notification.info {
                    border-left-color: #17a2b8;
                }
                
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    position: relative;
                }
                
                .notification-icon {
                    font-size: 20px;
                    flex-shrink: 0;
                }
                
                .notification-text {
                    flex: 1;
                    font-size: 14px;
                    line-height: 1.4;
                    font-weight: 500;
                    padding-right: 30px;
                }
                
                .notification-close {
                    position: absolute;
                    top: 50%;
                    right: 0;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.6);
                    cursor: pointer;
                    font-size: 18px;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s ease;
                    flex-shrink: 0;
                }
                
                .notification-close:hover {
                    color: #ffffff;
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .notification-progress {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 2px;
                    background: rgba(255, 255, 255, 0.3);
                    width: 100%;
                    transform-origin: right;
                    border-radius: 0 0 12px 12px;
                }
                
                @keyframes progressBar {
                    from { transform: scaleX(1); }
                    to { transform: scaleX(0); }
                }
                
                @media (max-width: 768px) {
                    .notifications-container {
                        right: 10px;
                        top: 10px;
                        max-width: calc(100vw - 20px);
                    }
                    
                    .notification {
                        transform: translateX(calc(100vw + 20px));
                    }
                    
                    .notification.show {
                        transform: translateX(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    show(message, type = 'info', duration = this.defaultDuration) {
        if (!this.container) {
            this.updateContainer();
        }
        
        if (!this.container) return null;
        
        this.limitNotifications();
        
        const id = `notification-${++this.counter}`;
        const notification = this.createNotificationElement(id, message, type, duration);
        
        this.container.appendChild(notification);
        this.notifications.set(id, {
            element: notification,
            type: type,
            timestamp: Date.now(),
            duration: duration
        });
        
        // Показываем уведомление
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        // Автоматическое удаление
        if (duration > 0) {
            this.scheduleRemoval(id, duration);
        }
        
        // Звук
        this.playNotificationSound(type);
        
        return id;
    }
    
    createNotificationElement(id, message, type, duration) {
        const notification = document.createElement('div');
        notification.id = id;
        notification.className = `notification ${type}`;
        
        const icon = this.getIcon(type);
        const hasProgress = duration > 0;
        
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${icon}</div>
                <div class="notification-text">${message}</div>
                <button class="notification-close" onclick="window.notifications?.hide('${id}')">×</button>
            </div>
            ${hasProgress ? `<div class="notification-progress" style="animation: progressBar ${duration}ms linear;"></div>` : ''}
        `;
        
        return notification;
    }
    
    hide(id) {
        const notificationData = this.notifications.get(id);
        if (!notificationData) return false;
        
        const notification = notificationData.element;
        notification.classList.remove('show');
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            this.notifications.delete(id);
        }, this.animationDuration);
        
        return true;
    }
    
    hideAll() {
        const ids = Array.from(this.notifications.keys());
        ids.forEach(id => this.hide(id));
    }
    
    scheduleRemoval(id, duration) {
        setTimeout(() => {
            this.hide(id);
        }, duration);
    }
    
    limitNotifications() {
        if (this.notifications.size >= this.maxNotifications) {
            const oldestId = Array.from(this.notifications.keys())[0];
            this.hide(oldestId);
        }
    }
    
    // Специальные методы
    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }
    
    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }
    
    warning(message, duration = 4000) {
        return this.show(message, 'warning', duration);
    }
    
    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }
    
    getIcon(type) {
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }
    
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
}

// Глобальная инициализация
window.notifications = new NotificationSystem();