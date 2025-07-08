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
    }
    
    setupButtonSounds() {
        this.buttonSelectors.forEach(selector => {
            const buttons = document.querySelectorAll(selector);
            buttons.forEach(button => this.attachSoundToButton(button));
        });
    }
    
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (this.isButton(node)) {
                                this.attachSoundToButton(node);
                            }
                            
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
    
    isButton(element) {
        if (!element.tagName) return false;
        
        const tagName = element.tagName.toLowerCase();
        if (tagName === 'button') return true;
        
        return this.buttonSelectors.some(selector => {
            const cleanSelector = selector.replace('.', '');
            return element.classList.contains(cleanSelector);
        });
    }
    
    attachSoundToButton(button) {
        if (!button || button.hasAttribute('data-sound-attached')) return;
        
        button.setAttribute('data-sound-attached', 'true');
        const soundType = this.getSoundType(button);
        this.addButtonEventListeners(button, soundType);
    }
    
    getSoundType(button) {
        const classList = button.classList;
        
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
        
        return 'button';
    }
    
    addButtonEventListeners(button, soundType) {
        button.addEventListener('click', (e) => {
            this.playButtonSound(soundType, button);
        });
        
        if (!button.classList.contains('disabled')) {
            button.addEventListener('mouseenter', () => {
                this.playHoverSound(button);
            });
        }
        
        button.addEventListener('focus', () => {
            if (document.activeElement === button) {
                this.playFocusSound(button);
            }
        });
        
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                this.playButtonSound(soundType, button);
            }
        });
    }
    
    playButtonSound(soundType, button) {
        if (!window.soundSystem) return;
        
        if (button.classList.contains('disabled')) {
            window.soundSystem.playError();
            return;
        }
        
        if (button.classList.contains('modal-close')) {
            window.soundSystem.playInterface();
            return;
        }
        
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
    
    playHoverSound(button) {
        if (!window.soundSystem || !this.shouldPlayHoverSound(button)) return;
        
        setTimeout(() => {
            if (window.soundSystem.isEnabled()) {
                window.soundSystem.playSound('interface', 'interface', 0.3);
            }
        }, 50);
    }
    
    playFocusSound(button) {
        if (!window.soundSystem || !window.soundSystem.isEnabled()) return;
        
        window.soundSystem.playSound('interface', 'interface', 0.2);
    }
    
    shouldPlayHoverSound(button) {
        const noHoverSelectors = [
            'notification-close',
            'modal-close',
            'settings-tab'
        ];
        
        return !noHoverSelectors.some(selector => 
            button.classList.contains(selector)
        );
    }
    
    addSoundToButton(buttonElement, soundType = 'button') {
        if (buttonElement && !buttonElement.hasAttribute('data-sound-attached')) {
            this.attachSoundToButton(buttonElement);
        }
    }
    
    removeSoundFromButton(buttonElement) {
        if (buttonElement && buttonElement.hasAttribute('data-sound-attached')) {
            buttonElement.removeAttribute('data-sound-attached');
            
            const newButton = buttonElement.cloneNode(true);
            buttonElement.parentNode.replaceChild(newButton, buttonElement);
        }
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
        
        if (window.soundSettings) {
            window.soundSettings.setSetting('buttonSounds', enabled);
        }
    }
    
    isEnabled() {
        return window.soundSettings ? 
            window.soundSettings.getSetting('buttonSounds') : 
            true;
    }
    
    refreshBindings() {
        document.querySelectorAll('[data-sound-attached]').forEach(button => {
            button.removeAttribute('data-sound-attached');
        });
        
        this.setupButtonSounds();
    }
}

// Глобальная инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.buttonSounds = new ButtonSounds();
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.buttonSounds) {
            window.buttonSounds = new ButtonSounds();
        }
    });
} else {
    window.buttonSounds = new ButtonSounds();
}