// === УЛУЧШЕННАЯ СИСТЕМА УВЕДОМЛЕНИЙ ===
class NotificationSystem {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.counter = 0;
        this.maxNotifications = 5;
        this.defaultDuration = 5000;
        this.animationDuration = 500;
        
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
        // Добавляем стили для highlight эффекта
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes notificationSlideIn {
                    from {
                        transform: translateX(120%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes notificationSlideOut {
                    from {
                        transform: translateX(0) scale(1);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(120%) scale(0.9);
                        opacity: 0;
                    }
                }
                
                @keyframes notificationShake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
                    20%, 40%, 60%, 80% { transform: translateX(3px); }
                }
                
                @keyframes notificationPulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                    100% { transform: scale(1); }
                }
                
                .notification-highlight {
                    animation: notificationPulse 0.6s ease-in-out 2;
                }
                
                .notification-shake {
                    animation: notificationShake 0.6s ease-in-out;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    show(message, type = 'info', duration = this.defaultDuration, options = {}) {
        if (!this.container) {
            this.updateContainer();
        }
        
        if (!this.container) {
            console.warn('Контейнер уведомлений не найден');
            return null;
        }
        
        // Удаляем старые уведомления если их слишком много
        this.limitNotifications();
        
        const id = `notification-${++this.counter}`;
        const notification = this.createNotificationElement(id, message, type, duration, options);
        
        // Добавляем в DOM
        this.container.appendChild(notification);
        this.notifications.set(id, {
            element: notification,
            type: type,
            timestamp: Date.now(),
            duration: duration,
            options: options
        });
        
        // Анимация появления
        this.animateIn(notification);
        
        // Автоматическое удаление
        if (duration > 0) {
            this.scheduleRemoval(id, duration);
        }
        
        // Звуковое сопровождение
        this.playNotificationSound(type);
        
        return id;
    }
    
    createNotificationElement(id, message, type, duration, options) {
        const notification = document.createElement('div');
        notification.id = id;
        notification.className = `notification ${type}`;
        
        // Дополнительные классы
        if (options.className) {
            notification.classList.add(options.className);
        }
        
        const icon = this.getIcon(type);
        const hasProgress = duration > 0 && !options.hideProgress;
        
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${icon}</div>
                <div class="notification-text">${message}</div>
                <button class="notification-close" onclick="window.notifications?.hide('${id}')" title="Закрыть">
                    ×
                </button>
            </div>
            ${hasProgress ? `<div class="notification-progress" style="animation-duration: ${duration}ms;"></div>` : ''}
        `;
        
        // Дополнительные обработчики
        this.setupNotificationEvents(notification, id, options);
        
        return notification;
    }
    
    setupNotificationEvents(notification, id, options) {
        // Клик по уведомлению
        if (options.onClick) {
            notification.style.cursor = 'pointer';
            notification.addEventListener('click', (e) => {
                if (!e.target.classList.contains('notification-close')) {
                    options.onClick(id);
                }
            });
        }
        
        // Hover эффекты
        notification.addEventListener('mouseenter', () => {
            notification.style.transform = 'translateX(-5px) scale(1.02)';
            notification.style.boxShadow = '0 25px 70px rgba(0, 0, 0, 0.6)';
        });
        
        notification.addEventListener('mouseleave', () => {
            notification.style.transform = 'translateX(0) scale(1)';
            notification.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.5)';
        });
        
        // Двойной клик для выделения
        notification.addEventListener('dblclick', () => {
            this.highlightNotification(id);
        });
    }
    
    animateIn(notification) {
        notification.style.animation = `notificationSlideIn ${this.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        
        // Удаляем анимацию после завершения
        setTimeout(() => {
            notification.style.animation = '';
        }, this.animationDuration);
    }
    
    animateOut(notification, callback) {
        notification.style.animation = `notificationSlideOut ${this.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        
        setTimeout(() => {
            if (callback) callback();
        }, this.animationDuration);
    }
    
    hide(id) {
        const notificationData = this.notifications.get(id);
        if (!notificationData) return false;
        
        const notification = notificationData.element;
        
        this.animateOut(notification, () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            this.notifications.delete(id);
        });
        
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
            // Удаляем самое старое уведомление
            const oldestId = Array.from(this.notifications.keys())[0];
            this.hide(oldestId);
        }
    }
    
    // === СПЕЦИАЛЬНЫЕ МЕТОДЫ ===
    
    success(message, duration = 4000, options = {}) {
        return this.show(message, 'success', duration, options);
    }
    
    error(message, duration = 6000, options = {}) {
        return this.show(message, 'error', duration, options);
    }
    
    warning(message, duration = 5000, options = {}) {
        return this.show(message, 'warning', duration, options);
    }
    
    info(message, duration = 4000, options = {}) {
        return this.show(message, 'info', duration, options);
    }
    
    // Постоянное уведомление (не исчезает автоматически)
    persistent(message, type = 'info', options = {}) {
        return this.show(message, type, 0, options);
    }
    
    // Уведомление с действием
    action(message, actionText, actionCallback, type = 'info', duration = 8000) {
        const actionButton = `
            <button class="notification-action-btn" onclick="(${actionCallback.toString()})(); window.notifications?.hide('NOTIFICATION_ID');">
                ${actionText}
            </button>
        `;
        
        const messageWithAction = `
            <div class="notification-message-with-action">
                <div class="notification-main-text">${message}</div>
                <div class="notification-actions">${actionButton}</div>
            </div>
        `;
        
        const id = this.show(messageWithAction, type, duration, {
            className: 'notification-with-action'
        });
        
        // Заменяем NOTIFICATION_ID на реальный ID
        if (id) {
            const notification = document.getElementById(id);
            notification.innerHTML = notification.innerHTML.replace(/NOTIFICATION_ID/g, id);
        }
        
        return id;
    }
    
    // Уведомление с прогрессом
    progress(message, type = 'info') {
        const progressBar = `
            <div class="notification-progress-custom">
                <div class="notification-progress-bar" id="progress-bar-NOTIFICATION_ID" style="width: 0%;"></div>
            </div>
        `;
        
        const messageWithProgress = `
            <div class="notification-main-text">${message}</div>
            ${progressBar}
        `;
        
        const id = this.show(messageWithProgress, type, 0, {
            className: 'notification-with-progress',
            hideProgress: true
        });
        
        // Заменяем NOTIFICATION_ID на реальный ID
        if (id) {
            const notification = document.getElementById(id);
            notification.innerHTML = notification.innerHTML.replace(/NOTIFICATION_ID/g, id);
        }
        
        return {
            id: id,
            updateProgress: (percent) => {
                const progressBar = document.getElementById(`progress-bar-${id}`);
                if (progressBar) {
                    progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
                }
            },
            complete: () => {
                this.hide(id);
            }
        };
    }
    
    // Интерактивное уведомление с выбором
    confirm(message, onConfirm, onCancel, type = 'warning') {
        const buttons = `
            <div class="notification-confirm-buttons">
                <button class="notification-btn notification-btn-confirm" onclick="(${onConfirm.toString()})(); window.notifications?.hide('NOTIFICATION_ID');">
                    ✓ Да
                </button>
                <button class="notification-btn notification-btn-cancel" onclick="(${onCancel ? onCancel.toString() : '() => {}'})(); window.notifications?.hide('NOTIFICATION_ID');">
                    ✗ Нет
                </button>
            </div>
        `;
        
        const messageWithButtons = `
            <div class="notification-main-text">${message}</div>
            ${buttons}
        `;
        
        const id = this.show(messageWithButtons, type, 0, {
            className: 'notification-confirm'
        });
        
        // Заменяем NOTIFICATION_ID на реальный ID
        if (id) {
            const notification = document.getElementById(id);
            notification.innerHTML = notification.innerHTML.replace(/NOTIFICATION_ID/g, id);
        }
        
        return id;
    }
    
    // === ЭФФЕКТЫ ===
    
    highlightNotification(id) {
        const notificationData = this.notifications.get(id);
        if (!notificationData) return;
        
        const notification = notificationData.element;
        notification.classList.add('notification-highlight');
        
        setTimeout(() => {
            notification.classList.remove('notification-highlight');
        }, 1200);
    }
    
    shakeNotification(id) {
        const notificationData = this.notifications.get(id);
        if (!notificationData) return;
        
        const notification = notificationData.element;
        notification.classList.add('notification-shake');
        
        setTimeout(() => {
            notification.classList.remove('notification-shake');
        }, 600);
    }
    
    // === УТИЛИТЫ ===
    
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
    
    // Получить все активные уведомления
    getActive() {
        return Array.from(this.notifications.entries()).map(([id, data]) => ({
            id,
            type: data.type,
            timestamp: data.timestamp,
            element: data.element
        }));
    }
    
    // Очистить все уведомления определенного типа
    clearByType(type) {
        const toRemove = [];
        this.notifications.forEach((data, id) => {
            if (data.type === type) {
                toRemove.push(id);
            }
        });
        
        toRemove.forEach(id => this.hide(id));
    }
    
    // Установить максимальное количество уведомлений
    setMaxNotifications(max) {
        this.maxNotifications = Math.max(1, max);
    }
}

// === ДОПОЛНИТЕЛЬНЫЕ СТИЛИ ===
const additionalStyles = `
    .notification-with-action {
        min-width: 450px;
    }
    
    .notification-message-with-action {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .notification-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
    }
    
    .notification-action-btn {
        background: var(--accent-blue);
        border: none;
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 600;
        transition: all 0.2s ease;
    }
    
    .notification-action-btn:hover {
        background: #0056b3;
        transform: translateY(-1px);
    }
    
    .notification-with-progress {
        min-width: 400px;
    }
    
    .notification-progress-custom {
        margin-top: 1rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        height: 6px;
        overflow: hidden;
    }
    
    .notification-progress-bar {
        height: 100%;
        background: var(--accent-blue);
        transition: width 0.3s ease;
        border-radius: 4px;
    }
    
    .notification-confirm {
        min-width: 400px;
    }
    
    .notification-confirm-buttons {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
        margin-top: 1rem;
    }
    
    .notification-btn {
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 600;
        transition: all 0.2s ease;
    }
    
    .notification-btn-confirm {
        background: var(--accent-green);
        color: white;
    }
    
    .notification-btn-confirm:hover {
        background: #1e7e34;
        transform: translateY(-1px);
    }
    
    .notification-btn-cancel {
        background: var(--accent-red);
        color: white;
    }
    
    .notification-btn-cancel:hover {
        background: #c82333;
        transform: translateY(-1px);
    }
`;

// Добавляем дополнительные стили
if (!document.getElementById('notification-enhanced-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-enhanced-styles';
    style.textContent = additionalStyles;
    document.head.appendChild(style);
}

// === ГЛОБАЛЬНАЯ ИНИЦИАЛИЗАЦИЯ ===
window.notifications = new NotificationSystem();