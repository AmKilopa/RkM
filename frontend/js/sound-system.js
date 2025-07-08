// === СИСТЕМА ПРИЯТНЫХ ЗВУКОВ (ОЧИЩЕННАЯ) ===
class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.masterVolume = 0.3;
        this.enabled = true;
        this.hasUserInteracted = false;
        this.initializationAttempts = 0;
        this.maxInitAttempts = 3;
        
        this.init();
    }
    
    init() {
        this.waitForUserInteraction();
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
    
    async initAudioContext() {
        try {
            this.initializationAttempts++;
            
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // ВАЖНО: Возобновляем контекст если он suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
        } catch (error) {
            this.enabled = false;
            
            // Повторная попытка через 2 секунды
            if (this.initializationAttempts < this.maxInitAttempts) {
                setTimeout(() => {
                    this.initAudioContext();
                }, 2000);
            }
        }
    }
    
    // ИСПРАВЛЕННАЯ проверка готовности
    async ensureAudioReady() {
        if (!this.hasUserInteracted) {
            return false;
        }
        
        if (!this.audioContext) {
            return false;
        }
        
        // Проверяем и возобновляем контекст если нужно
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (error) {
                return false;
            }
        }
        
        return this.audioContext.state === 'running';
    }
    
    loadSettings() {
        try {
            const volume = localStorage.getItem('rkm_sound_volume');
            const enabled = localStorage.getItem('rkm_sound_enabled');
            
            if (volume !== null) {
                this.masterVolume = parseFloat(volume);
            }
            
            if (enabled !== null) {
                this.enabled = enabled === 'true';
            }
        } catch (error) {
            // Игнорируем ошибки загрузки настроек
        }
    }
    
    saveSettings() {
        try {
            localStorage.setItem('rkm_sound_volume', this.masterVolume.toString());
            localStorage.setItem('rkm_sound_enabled', this.enabled.toString());
        } catch (error) {
            // Игнорируем ошибки сохранения настроек
        }
    }
    
    // === ОСНОВНЫЕ ЗВУКИ ===
    async playSuccess() {
        if (!(await this.ensureAudioReady())) return;
        this.playChord([523.25, 659.25, 783.99], 0.4, 'sine');
    }
    
    async playError() {
        if (!(await this.ensureAudioReady())) return;
        this.playTone(220, 0.3, 'sine', 0.6);
    }
    
    async playInfo() {
        if (!(await this.ensureAudioReady())) return;
        this.playTone(440, 0.25, 'sine', 0.3);
    }
    
    async playWarning() {
        if (!(await this.ensureAudioReady())) return;
        this.playTone(523.25, 0.15, 'sine', 0.2);
        setTimeout(() => {
            this.playTone(659.25, 0.15, 'sine', 0.2);
        }, 150);
    }
    
    // === ИСПРАВЛЕННАЯ МЕЛОДИЯ ОБНОВЛЕНИЯ ===
    async playUpdateMelody() {
        if (!(await this.ensureAudioReady())) {
            return 0;
        }
        
        const noteFreqs = {
            G4: 392.00,
            A4: 440.00,
            B4: 493.88,
            C5: 523.25,
            D5: 587.33
        };
        
        const melody = [
            { note: 'D5', duration: 0.3 },
            { note: 'D5', duration: 0.3 },
            { note: 'C5', duration: 0.45 },
            { note: 'B4', duration: 0.3 },
            { note: 'C5', duration: 0.45 },
            { note: 'A4', duration: 0.54 },
            { note: 'A4', duration: 0.3 },
            { note: 'D5', duration: 0.3 },
            { note: 'D5', duration: 0.3 },
            { note: 'C5', duration: 0.45 },
            { note: 'B4', duration: 0.3 },
            { note: 'D5', duration: 0.45 },
            { note: 'D5', duration: 0.3 },
            { note: 'C5', duration: 0.45 },
            { note: 'B4', duration: 0.3 },
            { note: 'C5', duration: 0.45 },
            { note: 'A4', duration: 0.45 },
            { note: 'B4', duration: 0.45 },
            { note: 'G4', duration: 0.67 },
            { note: 'A4', duration: 0.90 }
        ];
        
        let currentTime = 0;
        
        melody.forEach((noteData, index) => {
            setTimeout(() => {
                try {
                    const frequency = noteFreqs[noteData.note];
                    this.playTone(frequency, noteData.duration, 'sine', 0.2);
                } catch (error) {
                    // Игнорируем ошибки отдельных нот
                }
            }, currentTime * 1000);
            
            currentTime += noteData.duration + 0.04;
        });
        
        return currentTime * 1000;
    }
    
    // === ИСПРАВЛЕННАЯ ЗАЦИКЛЕННАЯ МЕЛОДИЯ ===
    async startLoopingUpdateMelody() {
        // Проверяем готовность аудио
        if (!(await this.ensureAudioReady())) {
            // Пытаемся инициализировать заново
            await this.initAudioContext();
            
            if (!(await this.ensureAudioReady())) {
                return null;
            }
        }
        
        // Воспроизводим первый раз
        const melodyDuration = await this.playUpdateMelody();
        
        if (melodyDuration === 0) {
            return null;
        }
        
        const totalCycleDuration = melodyDuration + 1000;
        
        let cycleCount = 1;
        const intervalId = setInterval(async () => {
            cycleCount++;
            
            // Проверяем готовность перед каждым воспроизведением
            if (await this.ensureAudioReady()) {
                await this.playUpdateMelody();
            } else {
                clearInterval(intervalId);
            }
        }, totalCycleDuration);
        
        return intervalId;
    }
    
    stopLoopingMelody(intervalId) {
        if (intervalId) {
            clearInterval(intervalId);
        }
    }
    
    // === ВСПОМОГАТЕЛЬНЫЕ ЗВУКИ ===
    async playPageLoad() {
        if (!(await this.ensureAudioReady())) return;
        
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, 0.2, 'sine', 0.15);
            }, index * 100);
        });
    }
    
    async playButtonClick() {
        if (!(await this.ensureAudioReady())) return;
        this.playTone(800, 0.08, 'sine', 0.1);
    }
    
    async playModal() {
        if (!(await this.ensureAudioReady())) return;
        this.playTone(523.25, 0.2, 'sine', 0.15);
        setTimeout(() => {
            this.playTone(659.25, 0.15, 'sine', 0.1);
        }, 100);
    }
    
    // === БАЗОВЫЕ ФУНКЦИИ ===
    playTone(frequency, duration, waveType = 'sine', volume = 0.2) {
        if (!this.audioContext || this.audioContext.state !== 'running') {
            return;
        }
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = waveType;
            
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
            // Игнорируем ошибки воспроизведения
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
    
    // === ДИАГНОСТИКА (только для разработчиков) ===
    getStatus() {
        return {
            enabled: this.enabled,
            hasUserInteracted: this.hasUserInteracted,
            audioContextState: this.audioContext?.state || 'не создан',
            volume: this.masterVolume,
            initAttempts: this.initializationAttempts
        };
    }
}

// === ГЛОБАЛЬНАЯ ИНИЦИАЛИЗАЦИЯ ===
window.soundSystem = new SoundSystem();

// === АВТОЗАПУСК ЗВУКА ЗАГРУЗКИ ===
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
        await window.soundSystem.playPageLoad();
    }, 1000);
    
    // Добавляем консольные команды только для разработчиков
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.testSound = async () => {
            console.log('🧪 Тестирование звуковой системы');
            console.log('📊 Статус:', window.soundSystem.getStatus());
            await window.soundSystem.playUpdateMelody();
        };
        
        window.testMelodyLoop = async () => {
            console.log('🧪 Тестирование зацикленной мелодии');
            const id = await window.soundSystem.startLoopingUpdateMelody();
            
            // Останавливаем через 10 секунд
            setTimeout(() => {
                window.soundSystem.stopLoopingMelody(id);
            }, 10000);
        };
    }
});