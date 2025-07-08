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
        
        console.log('✅ Система уведомлений инициализирована');
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
        // Добавляем стили для анимаций и эффектов
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes notificationSlideIn {
                    from {
                        transform: translateX(120%);
                        opacity: 0;
                        scale: 0.8;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                        scale: 1;
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
                    0% { transform: scale(1); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); }
                    50% { transform: scale(1.02); box-shadow: 0 25px 70px rgba(0, 0, 0, 0.6); }
                    100% { transform: scale(1); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); }
                }
                
                @keyframes notificationGlow {
                    0%, 100% { filter: brightness(1) saturate(1); }
                    50% { filter: brightness(1.1) saturate(1.2); }
                }
                
                .notification-highlight {
                    animation: notificationPulse 0.6s ease-in-out 2, notificationGlow 0.6s ease-in-out 2;
                }
                
                .notification-shake {
                    animation: notificationShake 0.6s ease-in-out;
                }
                
                .notification-entrance {
                    animation: notificationSlideIn ${this.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1);
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
            notification.style.boxShadow = '0 25px 70px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 255, 255, 0.1)';
            
            // Легкий звук при hover
            if (window.soundSystem) {
                setTimeout(() => {
                    window.soundSystem.playSound('interface', 'interface', 0.2);
                }, 50);
            }
        });
        
        notification.addEventListener('mouseleave', () => {
            notification.style.transform = 'translateX(0) scale(1)';
            notification.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
        });
        
        // Двойной клик для выделения
        notification.addEventListener('dblclick', () => {
            this.highlightNotification(id);
        });
        
        // Правый клик для дополнительных действий
        notification.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showNotificationContextMenu(id, e.clientX, e.clientY);
        });
    }
    
    animateIn(notification) {
        notification.classList.add('notification-entrance');
        
        // Удаляем класс анимации после завершения
        setTimeout(() => {
            notification.classList.remove('notification-entrance');
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
                    
                    // Изменяем цвет в зависимости от прогресса
                    if (percent < 30) {
                        progressBar.style.background = 'var(--accent-red)';
                    } else if (percent < 70) {
                        progressBar.style.background = 'var(--accent-yellow)';
                    } else {
                        progressBar.style.background = 'var(--accent-green)';
                    }
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
        
        if (window.soundSystem) {
            window.soundSystem.playInterface();
        }
        
        setTimeout(() => {
            notification.classList.remove('notification-highlight');
        }, 1200);
    }
    
    shakeNotification(id) {
        const notificationData = this.notifications.get(id);
        if (!notificationData) return;
        
        const notification = notificationData.element;
        notification.classList.add('notification-shake');
        
        if (window.soundSystem) {
            window.soundSystem.playError();
        }
        
        setTimeout(() => {
            notification.classList.remove('notification-shake');
        }, 600);
    }
    
    // Контекстное меню для уведомления
    showNotificationContextMenu(id, x, y) {
        const existingMenu = document.querySelector('.notification-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        const menu = document.createElement('div');
        menu.className = 'notification-context-menu';
        menu.style.position = 'fixed';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.style.zIndex = '10000';
        menu.innerHTML = `
            <div class="context-menu-item" onclick="window.notifications.highlightNotification('${id}'); this.parentElement.remove();">
                ✨ Выделить
            </div>
            <div class="context-menu-item" onclick="window.notifications.shakeNotification('${id}'); this.parentElement.remove();">
                📳 Встряхнуть
            </div>
            <div class="context-menu-item" onclick="window.notifications.hide('${id}'); this.parentElement.remove();">
                🗑️ Закрыть
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // Закрытие меню при клике вне его
        setTimeout(() => {
            document.addEventListener('click', function closeMenu() {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            });
        }, 10);
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
    
    // Статистика уведомлений
    getStats() {
        const stats = {
            total: this.notifications.size,
            byType: {},
            oldest: null,
            newest: null
        };
        
        this.notifications.forEach((data) => {
            stats.byType[data.type] = (stats.byType[data.type] || 0) + 1;
            
            if (!stats.oldest || data.timestamp < stats.oldest) {
                stats.oldest = data.timestamp;
            }
            
            if (!stats.newest || data.timestamp > stats.newest) {
                stats.newest = data.timestamp;
            }
        });
        
        return stats;
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
        background: linear-gradient(145deg, var(--accent-blue), #0056b3);
        border: none;
        color: white;
        padding: 6px 12px;
        border-radius: var(--border-radius-md);
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 600;
        transition: all var(--transition-normal);
        box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
    }
    
    .notification-action-btn:hover {
        background: linear-gradient(145deg, #0056b3, #004085);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
    }
    
    .notification-with-progress {
        min-width: 400px;
    }
    
    .notification-progress-custom {
        margin-top: 1rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: var(--border-radius-sm);
        height: 6px;
        overflow: hidden;
        box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
    }
    
    .notification-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, var(--accent-blue), #0056b3);
        transition: width 0.3s ease, background 0.3s ease;
        border-radius: var(--border-radius-sm);
        box-shadow: 0 0 10px rgba(0, 123, 255, 0.5);
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
        border-radius: var(--border-radius-md);
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 600;
        transition: all var(--transition-normal);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    .notification-btn-confirm {
        background: linear-gradient(145deg, var(--accent-green), #1e7e34);
        color: white;
    }
    
    .notification-btn-confirm:hover {
        background: linear-gradient(145deg, #1e7e34, #155724);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
    }
    
    .notification-btn-cancel {
        background: linear-gradient(145deg, var(--accent-red), #c82333);
        color: white;
    }
    
    .notification-btn-cancel:hover {
        background: linear-gradient(145deg, #c82333, #a71e2a);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
    }
    
    .notification-context-menu {
        background: var(--gradient-primary);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        padding: 0.5rem 0;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(20px);
        min-width: 150px;
    }
    
    .context-menu-item {
        padding: 0.5rem 1rem;
        cursor: pointer;
        color: var(--text-primary);
        transition: all var(--transition-normal);
        font-size: 0.9rem;
    }
    
    .context-menu-item:hover {
        background: rgba(255, 255, 255, 0.1);
        color: var(--accent-blue);
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