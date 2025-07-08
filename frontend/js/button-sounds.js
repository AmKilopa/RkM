// === ЗВУКИ ДЛЯ КНОПОК (ОЧИЩЕННАЯ ВЕРСИЯ) ===
class ButtonSounds {
    constructor() {
        this.init();
    }
    
    init() {
        // Ждем загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupButtonSounds());
        } else {
            this.setupButtonSounds();
        }
        
        // Наблюдаем за добавлением новых кнопок
        this.observeNewButtons();
    }
    
    setupButtonSounds() {
        // Добавляем звуки ко всем существующим кнопкам
        this.addSoundsToButtons();
        
        // Повторно проверяем каждые 2 секунды для динамически добавленных кнопок
        setInterval(() => {
            this.addSoundsToButtons();
        }, 2000);
    }
    
    addSoundsToButtons() {
        // Находим все кнопки без звуков
        const buttons = document.querySelectorAll('button:not([data-sound-added])');
        
        buttons.forEach(button => {
            this.addSoundToButton(button);
        });
    }
    
    addSoundToButton(button) {
        // Помечаем что звук добавлен
        button.setAttribute('data-sound-added', 'true');
        
        // Добавляем обработчик клика
        button.addEventListener('click', (e) => {
            // Воспроизводим звук
            this.playButtonSound(button);
            
            // Добавляем визуальную обратную связь
            this.addButtonFeedback(button);
        });
    }
    
    playButtonSound(button) {
        if (!window.soundSystem) return;
        
        // Определяем тип кнопки и воспроизводим соответствующий звук
        const classList = button.classList;
        
        if (classList.contains('main-btn')) {
            window.soundSystem.playButtonClick();
        } else if (classList.contains('bug-report-btn')) {
            window.soundSystem.playWarning();
        } else if (classList.contains('changelog-btn')) {
            window.soundSystem.playInfo();
        } else if (classList.contains('btn-success') || button.textContent.includes('✅')) {
            window.soundSystem.playSuccess();
        } else if (classList.contains('btn-danger') || button.textContent.includes('❌')) {
            window.soundSystem.playError();
        } else if (classList.contains('notification-close')) {
            // Тихий звук для закрытия
            window.soundSystem.playTone(400, 0.1, 'sine', 0.1);
        } else {
            // Обычный клик для всех остальных кнопок
            window.soundSystem.playButtonClick();
        }
    }
    
    addButtonFeedback(button) {
        // Добавляем класс для анимации
        button.classList.add('btn-sound-feedback');
        
        // Убираем класс через 200ms
        setTimeout(() => {
            button.classList.remove('btn-sound-feedback');
        }, 200);
    }
    
    observeNewButtons() {
        // Наблюдаем за изменениями в DOM
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Если добавлена кнопка
                            if (node.tagName === 'BUTTON' && !node.hasAttribute('data-sound-added')) {
                                this.addSoundToButton(node);
                            }
                            
                            // Если добавлен контейнер с кнопками
                            const newButtons = node.querySelectorAll?.('button:not([data-sound-added])');
                            newButtons?.forEach(button => {
                                this.addSoundToButton(button);
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
    
    // Специальные звуки для особых событий
    playSpecialSound(type) {
        if (!window.soundSystem) return;
        
        switch (type) {
            case 'page-change':
                window.soundSystem.playPageLoad();
                break;
            case 'auth-success':
                window.soundSystem.playSuccess();
                break;
            case 'auth-error':
                window.soundSystem.playError();
                break;
            case 'modal-open':
                window.soundSystem.playModal();
                break;
            default:
                window.soundSystem.playInfo();
        }
    }
}

// === ГЛОБАЛЬНАЯ ИНИЦИАЛИЗАЦИЯ ===
window.buttonSounds = new ButtonSounds();

// === СПЕЦИАЛЬНЫЕ ОБРАБОТЧИКИ ===
document.addEventListener('DOMContentLoaded', () => {
    // Звук при переходах между страницами
    const app = window.app;
    if (app) {
        const originalNavigateTo = app.navigateTo.bind(app);
        app.navigateTo = function(page) {
            window.buttonSounds?.playSpecialSound('page-change');
            return originalNavigateTo(page);
        };
    }
    
    // Звуки для специальных действий
    window.addEventListener('rkm-auth-success', () => {
        window.buttonSounds?.playSpecialSound('auth-success');
    });
    
    window.addEventListener('rkm-auth-error', () => {
        window.buttonSounds?.playSpecialSound('auth-error');
    });
});