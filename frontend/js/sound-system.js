// === ЗВУКОВАЯ СИСТЕМА ===
class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.masterVolume = 1.0;
        this.soundEnabled = true;
        this.sounds = new Map();
        this.backgroundMusic = null;
        this.backgroundMusicVolume = 0.3;
        this.categorySettings = {
            button: true,
            notification: true,
            interface: true,
            success: true,
            error: true,
            warning: true
        };
        this.currentSoundPack = 'default';
        this.soundPacks = {
            default: this.getDefaultSounds(),
            retro: this.getRetroSounds(),
            modern: this.getModernSounds(),
            minimal: this.getMinimalSounds()
        };
        
        this.init();
    }
    
    // Инициализация
    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            await this.loadSounds();
            this.setupEventListeners();
            console.log('Звуковая система инициализирована');
            
            // Уведомляем о готовности
            document.dispatchEvent(new CustomEvent('soundSystemReady'));
        } catch (error) {
            console.warn('Ошибка инициализации звуковой системы:', error);
        }
    }
    
    // Установка событий
    setupEventListeners() {
        // Разблокировка аудио контекста при первом взаимодействии
        const unlockAudio = () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
        };
        
        document.addEventListener('click', unlockAudio);
        document.addEventListener('touchstart', unlockAudio);
    }
    
    // Загрузка звуков
    async loadSounds() {
        const currentPack = this.soundPacks[this.currentSoundPack];
        
        for (const [name, config] of Object.entries(currentPack)) {
            try {
                const audioBuffer = await this.generateSound(config);
                this.sounds.set(name, audioBuffer);
            } catch (error) {
                console.warn(`Ошибка загрузки звука ${name}:`, error);
            }
        }
    }
    
    // Генерация звука
    async generateSound(config) {
        if (!this.audioContext) return null;
        
        const { duration, frequency, type, envelope } = config;
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            let sample = 0;
            
            switch (type) {
                case 'sine':
                    sample = Math.sin(2 * Math.PI * frequency * t);
                    break;
                case 'square':
                    sample = Math.sign(Math.sin(2 * Math.PI * frequency * t));
                    break;
                case 'triangle':
                    sample = 2 * Math.abs(2 * (frequency * t - Math.floor(frequency * t + 0.5))) - 1;
                    break;
                case 'sawtooth':
                    sample = 2 * (frequency * t - Math.floor(frequency * t + 0.5));
                    break;
                case 'noise':
                    sample = Math.random() * 2 - 1;
                    break;
                default:
                    sample = Math.sin(2 * Math.PI * frequency * t);
            }
            
            // Применяем огибающую
            const attack = envelope.attack * sampleRate;
            const decay = envelope.decay * sampleRate;
            const sustainStart = attack + decay;
            const release = envelope.release * sampleRate;
            const releaseStart = length - release;
            
            let amplitude = envelope.sustain;
            
            if (i < attack) {
                amplitude = (i / attack) * envelope.sustain;
            } else if (i < sustainStart) {
                amplitude = envelope.sustain + (envelope.sustain - envelope.sustain) * ((i - attack) / decay);
            } else if (i > releaseStart) {
                amplitude = envelope.sustain * (1 - (i - releaseStart) / release);
            }
            
            data[i] = sample * amplitude;
        }
        
        return buffer;
    }
    
    // Воспроизведение звука
    playSound(soundName, category = 'interface', volume = 1.0) {
        if (!this.soundEnabled || !this.categorySettings[category] || !this.audioContext) {
            return;
        }
        
        const audioBuffer = this.sounds.get(soundName);
        if (!audioBuffer) {
            console.warn(`Звук ${soundName} не найден`);
            return;
        }
        
        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = audioBuffer;
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            gainNode.gain.value = this.masterVolume * volume;
            source.start(0);
        } catch (error) {
            console.warn(`Ошибка воспроизведения звука ${soundName}:`, error);
        }
    }
    
    // === НАБОРЫ ЗВУКОВ ===
    
    getDefaultSounds() {
        return {
            button: {
                duration: 0.1,
                frequency: 800,
                type: 'sine',
                envelope: { attack: 0.01, decay: 0.02, sustain: 0.3, release: 0.07 }
            },
            success: {
                duration: 0.3,
                frequency: 523.25,
                type: 'sine',
                envelope: { attack: 0.02, decay: 0.1, sustain: 0.6, release: 0.18 }
            },
            error: {
                duration: 0.4,
                frequency: 220,
                type: 'square',
                envelope: { attack: 0.01, decay: 0.05, sustain: 0.8, release: 0.34 }
            },
            warning: {
                duration: 0.25,
                frequency: 440,
                type: 'triangle',
                envelope: { attack: 0.02, decay: 0.08, sustain: 0.5, release: 0.15 }
            },
            info: {
                duration: 0.2,
                frequency: 660,
                type: 'sine',
                envelope: { attack: 0.02, decay: 0.05, sustain: 0.4, release: 0.13 }
            },
            interface: {
                duration: 0.08,
                frequency: 1000,
                type: 'sine',
                envelope: { attack: 0.005, decay: 0.015, sustain: 0.2, release: 0.06 }
            }
        };
    }
    
    getRetroSounds() {
        return {
            button: {
                duration: 0.15,
                frequency: 400,
                type: 'square',
                envelope: { attack: 0.02, decay: 0.03, sustain: 0.4, release: 0.1 }
            },
            success: {
                duration: 0.5,
                frequency: 262,
                type: 'square',
                envelope: { attack: 0.03, decay: 0.15, sustain: 0.7, release: 0.32 }
            },
            error: {
                duration: 0.3,
                frequency: 150,
                type: 'sawtooth',
                envelope: { attack: 0.01, decay: 0.04, sustain: 0.9, release: 0.25 }
            },
            warning: {
                duration: 0.2,
                frequency: 350,
                type: 'square',
                envelope: { attack: 0.02, decay: 0.06, sustain: 0.6, release: 0.12 }
            },
            info: {
                duration: 0.18,
                frequency: 500,
                type: 'square',
                envelope: { attack: 0.02, decay: 0.04, sustain: 0.5, release: 0.12 }
            },
            interface: {
                duration: 0.1,
                frequency: 800,
                type: 'square',
                envelope: { attack: 0.01, decay: 0.02, sustain: 0.3, release: 0.07 }
            }
        };
    }
    
    getModernSounds() {
        return {
            button: {
                duration: 0.12,
                frequency: 1200,
                type: 'sine',
                envelope: { attack: 0.005, decay: 0.025, sustain: 0.2, release: 0.09 }
            },
            success: {
                duration: 0.4,
                frequency: 659.25,
                type: 'sine',
                envelope: { attack: 0.02, decay: 0.12, sustain: 0.5, release: 0.26 }
            },
            error: {
                duration: 0.35,
                frequency: 185,
                type: 'triangle',
                envelope: { attack: 0.01, decay: 0.06, sustain: 0.7, release: 0.28 }
            },
            warning: {
                duration: 0.3,
                frequency: 523,
                type: 'sine',
                envelope: { attack: 0.03, decay: 0.09, sustain: 0.4, release: 0.18 }
            },
            info: {
                duration: 0.15,
                frequency: 880,
                type: 'sine',
                envelope: { attack: 0.01, decay: 0.03, sustain: 0.3, release: 0.11 }
            },
            interface: {
                duration: 0.06,
                frequency: 1500,
                type: 'sine',
                envelope: { attack: 0.003, decay: 0.012, sustain: 0.15, release: 0.045 }
            }
        };
    }
    
    getMinimalSounds() {
        return {
            button: {
                duration: 0.05,
                frequency: 1000,
                type: 'sine',
                envelope: { attack: 0.002, decay: 0.008, sustain: 0.1, release: 0.04 }
            },
            success: {
                duration: 0.15,
                frequency: 600,
                type: 'sine',
                envelope: { attack: 0.01, decay: 0.04, sustain: 0.3, release: 0.1 }
            },
            error: {
                duration: 0.1,
                frequency: 300,
                type: 'sine',
                envelope: { attack: 0.005, decay: 0.02, sustain: 0.4, release: 0.075 }
            },
            warning: {
                duration: 0.08,
                frequency: 500,
                type: 'sine',
                envelope: { attack: 0.005, decay: 0.015, sustain: 0.2, release: 0.06 }
            },
            info: {
                duration: 0.06,
                frequency: 800,
                type: 'sine',
                envelope: { attack: 0.003, decay: 0.012, sustain: 0.15, release: 0.045 }
            },
            interface: {
                duration: 0.03,
                frequency: 1200,
                type: 'sine',
                envelope: { attack: 0.001, decay: 0.005, sustain: 0.05, release: 0.024 }
            }
        };
    }
    
    // === МЕТОДЫ ВОСПРОИЗВЕДЕНИЯ ===
    
    playButton() {
        this.playSound('button', 'button');
    }
    
    playSuccess() {
        this.playSound('success', 'success');
    }
    
    playError() {
        this.playSound('error', 'error');
    }
    
    playWarning() {
        this.playSound('warning', 'warning');
    }
    
    playInfo() {
        this.playSound('info', 'notification');
    }
    
    playInterface() {
        this.playSound('interface', 'interface');
    }
    
    // === УПРАВЛЕНИЕ НАСТРОЙКАМИ ===
    
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
    
    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
    }
    
    setCategoryEnabled(category, enabled) {
        if (this.categorySettings.hasOwnProperty(category)) {
            this.categorySettings[category] = enabled;
        }
    }
    
    async setSoundPack(packName) {
        if (this.soundPacks[packName]) {
            this.currentSoundPack = packName;
            await this.loadSounds();
        }
    }
    
    // === ФОНОВАЯ МУЗЫКА ===
    
    setBackgroundMusicVolume(volume) {
        this.backgroundMusicVolume = Math.max(0, Math.min(1, volume));
        if (this.backgroundMusic && this.backgroundMusic.gainNode) {
            this.backgroundMusic.gainNode.gain.value = this.backgroundMusicVolume * this.masterVolume;
        }
    }
    
    async startBackgroundMusic() {
        if (!this.audioContext || this.backgroundMusic) return;
        
        try {
            // Создаем простую фоновую мелодию
            const sequence = [523.25, 587.33, 659.25, 698.46]; // C, D, E, F
            let currentNote = 0;
            
            const playNote = () => {
                if (!this.soundEnabled) return;
                
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.value = sequence[currentNote];
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(this.backgroundMusicVolume * this.masterVolume * 0.1, this.audioContext.currentTime + 0.1);
                gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1.9);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 2);
                
                currentNote = (currentNote + 1) % sequence.length;
            };
            
            this.backgroundMusic = {
                interval: setInterval(playNote, 2000),
                gainNode: null // Для совместимости
            };
            
        } catch (error) {
            console.warn('Ошибка запуска фоновой музыки:', error);
        }
    }
    
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            if (this.backgroundMusic.interval) {
                clearInterval(this.backgroundMusic.interval);
            }
            this.backgroundMusic = null;
        }
    }
    
    // === УТИЛИТЫ ===
    
    isEnabled() {
        return this.soundEnabled;
    }
    
    getMasterVolume() {
        return this.masterVolume;
    }
    
    getCurrentSoundPack() {
        return this.currentSoundPack;
    }
    
    getAvailableSoundPacks() {
        return Object.keys(this.soundPacks);
    }
    
    // === СПЕЦИАЛЬНЫЕ МЕЛОДИИ ===
    
    // Запуск зацикленной мелодии для обновления
    startLoopingUpdateMelody() {
        if (!this.audioContext || !this.soundEnabled) return null;
        
        const sequence = [659.25, 698.46, 783.99, 880.00]; // E, F, G, A
        let currentNote = 0;
        
        const playNote = () => {
            if (!this.soundEnabled) return;
            
            try {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.value = sequence[currentNote];
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.15, this.audioContext.currentTime + 0.1);
                gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.8);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 1);
                
                currentNote = (currentNote + 1) % sequence.length;
            } catch (error) {
                console.warn('Ошибка воспроизведения обновительной мелодии:', error);
            }
        };
        
        // Первая нота сразу
        playNote();
        
        // Затем каждые 1.2 секунды
        const intervalId = setInterval(playNote, 1200);
        
        console.log('🎵 Обновительная мелодия запущена');
        return intervalId;
    }
    
    // Остановка зацикленной мелодии
    stopLoopingMelody(intervalId) {
        if (intervalId) {
            clearInterval(intervalId);
            console.log('🔇 Обновительная мелодия остановлена');
        }
    }
    
    // Короткая мелодия успеха
    playSuccessMelody() {
        if (!this.audioContext || !this.soundEnabled) return;
        
        const notes = [523.25, 659.25, 783.99]; // C, E, G
        let delay = 0;
        
        notes.forEach((freq, index) => {
            setTimeout(() => {
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.frequency.value = freq;
                    oscillator.type = 'sine';
                    
                    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.2, this.audioContext.currentTime + 0.05);
                    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);
                    
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.4);
                } catch (error) {
                    console.warn('Ошибка воспроизведения мелодии успеха:', error);
                }
            }, delay);
            delay += 200;
        });
    }
    
    // Мелодия ошибки
    playErrorMelody() {
        if (!this.audioContext || !this.soundEnabled) return;
        
        const notes = [392.00, 349.23, 311.13]; // G, F, Eb
        let delay = 0;
        
        notes.forEach((freq, index) => {
            setTimeout(() => {
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.frequency.value = freq;
                    oscillator.type = 'square';
                    
                    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.15, this.audioContext.currentTime + 0.05);
                    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.4);
                    
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.5);
                } catch (error) {
                    console.warn('Ошибка воспроизведения мелодии ошибки:', error);
                }
            }, delay);
            delay += 300;
        });
    }
    
    // Очистка ресурсов
    destroy() {
        this.stopBackgroundMusic();
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.sounds.clear();
        console.log('🔇 Звуковая система очищена');
    }
}

// Глобальная инициализация
window.soundSystem = new SoundSystem();