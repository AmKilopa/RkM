// === СИСТЕМА ПРИЯТНЫХ ЗВУКОВ ===
class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.masterVolume = 0.3; // Умеренная громкость
        this.enabled = true;
        this.hasUserInteracted = false;
        
        this.init();
    }
    
    init() {
        // Ждем первое взаимодействие пользователя
        this.waitForUserInteraction();
        
        // Загружаем настройки из localStorage
        this.loadSettings();
    }
    
    waitForUserInteraction() {
        const handler = () => {
            this.hasUserInteracted = true;
            this.initAudioContext();
            document.removeEventListener('click', handler);
            document.removeEventListener('keydown', handler);
            document.removeEventListener('touchstart', handler);
        };
        
        document.addEventListener('click', handler);
        document.addEventListener('keydown', handler);
        document.addEventListener('touchstart', handler);
    }
    
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.log('🔊 Web Audio API не поддерживается');
            this.enabled = false;
        }
    }
    
    loadSettings() {
        const volume = localStorage.getItem('rkm_sound_volume');
        const enabled = localStorage.getItem('rkm_sound_enabled');
        
        if (volume !== null) {
            this.masterVolume = parseFloat(volume);
        }
        
        if (enabled !== null) {
            this.enabled = enabled === 'true';
        }
    }
    
    saveSettings() {
        localStorage.setItem('rkm_sound_volume', this.masterVolume.toString());
        localStorage.setItem('rkm_sound_enabled', this.enabled.toString());
    }
    
    // === ОСНОВНЫЕ ЗВУКИ ===
    playSuccess() {
        if (!this.shouldPlay()) return;
        
        // Приятный восходящий аккорд
        this.playChord([523.25, 659.25, 783.99], 0.4, 'sine'); // C5, E5, G5
    }
    
    playError() {
        if (!this.shouldPlay()) return;
        
        // Мягкий низкий тон, не резкий
        this.playTone(220, 0.3, 'sine', 0.6); // A3
    }
    
    playInfo() {
        if (!this.shouldPlay()) return;
        
        // Нейтральный приятный тон
        this.playTone(440, 0.25, 'sine', 0.3); // A4
    }
    
    playWarning() {
        if (!this.shouldPlay()) return;
        
        // Два быстрых тона - внимание, но не агрессивно
        this.playTone(523.25, 0.15, 'sine', 0.2); // C5
        setTimeout(() => {
            this.playTone(659.25, 0.15, 'sine', 0.2); // E5
        }, 150);
    }
    
    // === СПЕЦИАЛЬНЫЕ ЗВУКИ ===
    playPageLoad() {
        if (!this.shouldPlay()) return;
        
        // Мягкая восходящая арпеджио
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        notes.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, 0.2, 'sine', 0.15);
            }, index * 100);
        });
    }
    
    playButtonClick() {
        if (!this.shouldPlay()) return;
        
        // Короткий приятный клик
        this.playTone(800, 0.08, 'sine', 0.1);
    }
    
    playModal() {
        if (!this.shouldPlay()) return;
        
        // Мягкий звук появления модального окна
        this.playTone(523.25, 0.2, 'sine', 0.15);
        setTimeout(() => {
            this.playTone(659.25, 0.15, 'sine', 0.1);
        }, 100);
    }
    
    // === БАЗОВЫЕ ФУНКЦИИ ===
    shouldPlay() {
        return this.enabled && this.hasUserInteracted && this.audioContext && this.masterVolume > 0;
    }
    
    playTone(frequency, duration, waveType = 'sine', volume = 0.2) {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = waveType;
            
            // Плавное нарастание и затухание
            const now = this.audioContext.currentTime;
            const fadeIn = 0.01;
            const fadeOut = 0.05;
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(volume * this.masterVolume, now + fadeIn);
            gainNode.gain.setValueAtTime(volume * this.masterVolume, now + duration - fadeOut);
            gainNode.gain.linearRampToValueAtTime(0, now + duration);
            
            oscillator.start(now);
            oscillator.stop(now + duration);
            
        } catch (error) {
            // Игнорируем ошибки аудио
        }
    }
    
    playChord(frequencies, duration, waveType = 'sine', volume = 0.15) {
        frequencies.forEach(freq => {
            this.playTone(freq, duration, waveType, volume / frequencies.length);
        });
    }
    
    // === НАСТРОЙКИ ===
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    }
    
    getVolume() {
        return this.masterVolume;
    }
    
    toggle() {
        this.enabled = !this.enabled;
        this.saveSettings();
        return this.enabled;
    }
    
    isEnabled() {
        return this.enabled;
    }
}

// === ГЛОБАЛЬНАЯ ИНИЦИАЛИЗАЦИЯ ===
window.soundSystem = new SoundSystem();

// === АВТОЗАПУСК ЗВУКА ЗАГРУЗКИ ===
document.addEventListener('DOMContentLoaded', () => {
    // Воспроизводим звук загрузки страницы
    setTimeout(() => {
        window.soundSystem.playPageLoad();
    }, 1000);
});