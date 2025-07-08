// === СИСТЕМА ЗВУКОВ КНОПОК ===
class ButtonSounds {
    constructor() {
        this.buttonSelectors = [
            '.main-btn',
            '.btn',
            '.bug-report-btn',
            '.back-btn',
            '.changelog-btn',
            '.settings-btn',
            '.modal-close',
            '.notification-close',
            '.notification-action-btn',
            '.notification-btn',
            '.settings-tab',
            '.filter-btn',
            '.refresh-btn',
            'button'
        ];
        
        this.init();
    }
    
    init() {
        this.setupButtonSounds();
        this.setupMutationObserver();
        console.log('Система звуков кнопок инициализирована');
    }
    
    // Настройка звуков для существующих кнопок
    setupButtonSounds() {
        this.buttonSelectors.forEach(selector => {
            const buttons = document.querySelectorAll(selector);
            buttons.forEach(button => this.attachSoundToButton(button));
        });
    }
    
    // Отслеживание новых кнопок
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Проверяем сам элемент
                            if (this.isButton(node)) {
                                this.attachSoundToButton(node);
                            }
                            
                            // Проверяем дочерние элементы
                            this.buttonSelectors.forEach(selector => {
                                const buttons = node.querySelectorAll ? node.querySelectorAll(selector) : [];
                                buttons.forEach(button => this.attachSoundToButton(button));
                            });
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Проверка, является ли элемент кнопкой
    isButton(element) {
        if (!element.tagName) return false;
        
        const tagName = element.tagName.toLowerCase();
        if (tagName === 'button') return true;
        
        return this.buttonSelectors.some(selector => {
            const cleanSelector = selector.replace('.', '');
            return element.classList.contains(cleanSelector);
        });
    }
    
    // Привязка звука к кнопке
    attachSoundToButton(button) {
        if (!button || button.hasAttribute('data-sound-attached')) return;
        
        // Помечаем кнопку как обработанную
        button.setAttribute('data-sound-attached', 'true');
        
        // Определяем тип звука
        const soundType = this.getSoundType(button);
        
        // Добавляем обработчики событий
        this.addButtonEventListeners(button, soundType);
    }
    
    // Определение типа звука для кнопки
    getSoundType(button) {
        const classList = button.classList;
        
        // Специальные кнопки
        if (classList.contains('btn-success') || 
            button.id === 'substitution-btn') {
            return 'success';
        }
        
        if (classList.contains('btn-danger') || 
            classList.contains('bug-report-btn') ||
            classList.contains('notification-btn-cancel')) {
            return 'error';
        }
        
        if (classList.contains('btn-warning') ||
            classList.contains('changelog-btn')) {
            return 'warning';
        }
        
        if (classList.contains('settings-btn') ||
            classList.contains('settings-tab')) {
            return 'interface';
        }
        
        if (classList.contains('main-btn')) {
            if (classList.contains('disabled')) {
                return 'error';
            }
            return 'button';
        }
        
        if (classList.contains('modal-close') ||
            classList.contains('notification-close') ||
            classList.contains('back-btn')) {
            return 'interface';
        }
        
        if (classList.contains('notification-action-btn') ||
            classList.contains('notification-btn-confirm')) {
            return 'success';
        }
        
        // По умолчанию
        return 'button';
    }
    
    // Добавление обработчиков событий
    addButtonEventListeners(button, soundType) {
        // Основной клик
        button.addEventListener('click', (e) => {
            this.playButtonSound(soundType, button);
        });
        
        // Hover эффекты (только для не отключенных кнопок)
        if (!button.classList.contains('disabled')) {
            button.addEventListener('mouseenter', () => {
                this.playHoverSound(button);
            });
        }
        
        // Фокус с клавиатуры
        button.addEventListener('focus', () => {
            if (document.activeElement === button) {
                this.playFocusSound(button);
            }
        });
        
        // Enter/Space на кнопке
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                this.playButtonSound(soundType, button);
            }
        });
    }
    
    // Воспроизведение звука кнопки
    playButtonSound(soundType, button) {
        if (!window.soundSystem) return;
        
        // Проверяем, не отключена ли кнопка
        if (button.classList.contains('disabled')) {
            window.soundSystem.playError();
            return;
        }
        
        // Специальная обработка для модальных окон
        if (button.classList.contains('modal-close')) {
            window.soundSystem.playInterface();
            return;
        }
        
        // Воспроизводим соответствующий звук
        switch (soundType) {
            case 'success':
                window.soundSystem.playSuccess();
                break;
            case 'error':
                window.soundSystem.playError();
                break;
            case 'warning':
                window.soundSystem.playWarning();
                break;
            case 'interface':
                window.soundSystem.playInterface();
                break;
            case 'button':
            default:
                window.soundSystem.playButton();
                break;
        }
    }
    
    // Звук при наведении
    playHoverSound(button) {
        if (!window.soundSystem || !this.shouldPlayHoverSound(button)) return;
        
        // Тихий звук интерфейса для hover
        setTimeout(() => {
            if (window.soundSystem.isEnabled()) {
                window.soundSystem.playSound('interface', 'interface', 0.3);
            }
        }, 50);
    }
    
    // Звук при фокусе
    playFocusSound(button) {
        if (!window.soundSystem || !window.soundSystem.isEnabled()) return;
        
        // Очень тихий звук для фокуса
        window.soundSystem.playSound('interface', 'interface', 0.2);
    }
    
    // Проверка, нужно ли воспроизводить hover звук
    shouldPlayHoverSound(button) {
        // Не играем hover звуки для некоторых элементов
        const noHoverSelectors = [
            'notification-close',
            'modal-close',
            'settings-tab'
        ];
        
        return !noHoverSelectors.some(selector => 
            button.classList.contains(selector)
        );
    }
    
    // Добавление звука к конкретной кнопке (публичный метод)
    addSoundToButton(buttonElement, soundType = 'button') {
        if (buttonElement && !buttonElement.hasAttribute('data-sound-attached')) {
            this.attachSoundToButton(buttonElement);
        }
    }
    
    // Удаление звука с кнопки
    removeSoundFromButton(buttonElement) {
        if (buttonElement && buttonElement.hasAttribute('data-sound-attached')) {
            buttonElement.removeAttribute('data-sound-attached');
            
            // Клонируем элемент для удаления всех обработчиков
            const newButton = buttonElement.cloneNode(true);
            buttonElement.parentNode.replaceChild(newButton, buttonElement);
        }
    }
    
    // Включение/выключение звуков кнопок
    setEnabled(enabled) {
        this.enabled = enabled;
        
        if (window.soundSettings) {
            window.soundSettings.setSetting('buttonSounds', enabled);
        }
    }
    
    // Получение состояния
    isEnabled() {
        return window.soundSettings ? 
            window.soundSettings.getSetting('buttonSounds') : 
            true;
    }
    
    // Тестирование всех звуков кнопок
    testButtonSounds() {
        const sounds = ['button', 'success', 'error', 'warning', 'interface'];
        let delay = 0;
        
        sounds.forEach(sound => {
            setTimeout(() => {
                if (window.soundSystem) {
                    switch (sound) {
                        case 'success':
                            window.soundSystem.playSuccess();
                            break;
                        case 'error':
                            window.soundSystem.playError();
                            break;
                        case 'warning':
                            window.soundSystem.playWarning();
                            break;
                        case 'interface':
                            window.soundSystem.playInterface();
                            break;
                        default:
                            window.soundSystem.playButton();
                    }
                    console.log(`Тест звука кнопки: ${sound}`);
                }
            }, delay);
            delay += 500;
        });
    }
    
    // Обновление привязок (для динамически созданных кнопок)
    refreshBindings() {
        // Удаляем старые привязки
        document.querySelectorAll('[data-sound-attached]').forEach(button => {
            button.removeAttribute('data-sound-attached');
        });
        
        // Перенастраиваем звуки
        this.setupButtonSounds();
    }
}

// Глобальная инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.buttonSounds = new ButtonSounds();
});

// Инициализация для случаев, когда DOMContentLoaded уже произошел
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.buttonSounds) {
            window.buttonSounds = new ButtonSounds();
        }
    });
} else {
    window.buttonSounds = new ButtonSounds();
}