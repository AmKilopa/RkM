// === УЛУЧШЕННАЯ СИСТЕМА УВЕДОМЛЕНИЙ ===
class NotificationSystem {
    constructor() {
        this.container = document.getElementById('notifications-container');
        this.notifications = new Map();
        this.counter = 0;
    }
    
    show(message, type = 'info', duration = 5000) {
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
        
        // Звуковой сигнал (опционально)
        this.playNotificationSound(type);
        
        console.log(`📢 Уведомление [${type.toUpperCase()}]: ${message}`);
        
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
    
    // Звуковые сигналы (если браузер поддерживает)
    playNotificationSound(type) {
        try {
            // Создаем аудио контекст только если пользователь взаимодействовал со страницей
            if (typeof AudioContext !== 'undefined' && this.hasUserInteracted) {
                // Простые звуковые сигналы для разных типов
                const frequencies = {
                    success: 800,
                    error: 300,
                    warning: 600,
                    info: 500
                };
                
                this.beep(frequencies[type] || 500, 150);
            }
        } catch (error) {
            // Игнорируем ошибки аудио
        }
    }
    
    beep(frequency, duration) {
        try {
            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
        } catch (error) {
            // Игнорируем ошибки аудио
        }
    }
    
    // Отслеживаем взаимодействие пользователя для аудио
    initUserInteraction() {
        const handler = () => {
            this.hasUserInteracted = true;
            document.removeEventListener('click', handler);
            document.removeEventListener('keydown', handler);
        };
        
        document.addEventListener('click', handler);
        document.addEventListener('keydown', handler);
    }
}

// Инициализация системы уведомлений
window.notifications = new NotificationSystem();

// Инициализируем отслеживание взаимодействий для аудио
document.addEventListener('DOMContentLoaded', () => {
    window.notifications.initUserInteraction();
    
    // Тестовое уведомление при загрузке
    setTimeout(() => {
        window.notifications.success('Система уведомлений готова к работе!', 3000);
    }, 1000);
});