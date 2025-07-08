// === ЗВУКОВАЯ СИСТЕМА ===
class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.masterVolume = 0.6;
        this.soundEnabled = true;
        this.sounds = new Map();
        this.isInitialized = false;
        this.categorySettings = {
            button: true,
            notification: true,
            interface: true,
            success: true,
            error: true,
            warning: true
        };
        this.currentSoundPack = 'pleasant';
        this.soundPacks = {
            pleasant: this.getPleasantSounds(),
            soft: this.getSoftSounds(),
            modern: this.getModernSounds(),
            professional: this.getProfessionalSounds()
        };
        
        this.setupEventListeners();
    }
    
    async init() {
        if (this.isInitialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Проверяем состояние AudioContext
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            await this.loadSounds();
            this.isInitialized = true;
            
            document.dispatchEvent(new CustomEvent('soundSystemReady'));
        } catch (error) {
            // Ждем пользовательского взаимодействия
        }
    }
    
    setupEventListeners() {
        const initSound = async () => {
            if (!this.isInitialized) {
                await this.init();
            }
        };
        
        // Инициализируем звук при первом взаимодействии
        document.addEventListener('click', initSound, { once: true });
        document.addEventListener('keydown', initSound, { once: true });
        document.addEventListener('touchstart', initSound, { once: true });
    }
    
    async loadSounds() {
        const currentPack = this.soundPacks[this.currentSoundPack];
        
        for (const [name, config] of Object.entries(currentPack)) {
            try {
                const audioBuffer = await this.generateSound(config);
                this.sounds.set(name, audioBuffer);
            } catch (error) {
                // Игнорируем ошибки
            }
        }
    }
    
    async generateSound(config) {
        if (!this.audioContext) return null;
        
        const { duration, frequency, type, envelope, volume = 1.0 } = config;
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
                case 'soft':
                    sample = Math.sin(2 * Math.PI * frequency * t) * Math.sin(Math.PI * t / duration);
                    break;
                case 'bell':
                    sample = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 3);
                    break;
                case 'warm':
                    sample = (Math.sin(2 * Math.PI * frequency * t) + 
                             Math.sin(2 * Math.PI * frequency * 2 * t) * 0.3) * 0.7;
                    break;
                case 'gentle':
                    sample = Math.sin(2 * Math.PI * frequency * t) * 
                            (1 - Math.pow(t / duration, 2));
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
                amplitude = envelope.sustain;
            } else if (i > releaseStart) {
                amplitude = envelope.sustain * (1 - (i - releaseStart) / release);
            }
            
            data[i] = sample * amplitude * volume;
        }
        
        return buffer;
    }
    
    async playSound(soundName, category = 'interface', volume = 1.0) {
        // Инициализируем при первом воспроизведении
        if (!this.isInitialized) {
            await this.init();
        }
        
        if (!this.soundEnabled || !this.categorySettings[category] || !this.audioContext || !this.isInitialized) {
            return;
        }
        
        const audioBuffer = this.sounds.get(soundName);
        if (!audioBuffer) {
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
            // Игнорируем ошибки воспроизведения
        }
    }
    
    // === ПРИЯТНЫЕ ЗВУКИ (ПО УМОЛЧАНИЮ) ===
    getPleasantSounds() {
        return {
            button: {
                duration: 0.15,
                frequency: 660,
                type: 'bell',
                volume: 0.4,
                envelope: { attack: 0.01, decay: 0.04, sustain: 0.3, release: 0.1 }
            },
            success: {
                duration: 0.4,
                frequency: 523.25,
                type: 'warm',
                volume: 0.5,
                envelope: { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.28 }
            },
            error: {
                duration: 0.2,
                frequency: 220,
                type: 'gentle',
                volume: 0.3,
                envelope: { attack: 0.02, decay: 0.05, sustain: 0.4, release: 0.13 }
            },
            warning: {
                duration: 0.22,
                frequency: 440,
                type: 'soft',
                volume: 0.4,
                envelope: { attack: 0.02, decay: 0.06, sustain: 0.4, release: 0.14 }
            },
            info: {
                duration: 0.18,
                frequency: 698.46,
                type: 'bell',
                volume: 0.35,
                envelope: { attack: 0.015, decay: 0.04, sustain: 0.3, release: 0.125 }
            },
            interface: {
                duration: 0.08,
                frequency: 880,
                type: 'soft',
                volume: 0.25,
                envelope: { attack: 0.005, decay: 0.015, sustain: 0.2, release: 0.06 }
            }
        };
    }
    
    getSoftSounds() {
        return {
            button: {
                duration: 0.2,
                frequency: 500,
                type: 'gentle',
                volume: 0.3,
                envelope: { attack: 0.03, decay: 0.05, sustain: 0.25, release: 0.12 }
            },
            success: {
                duration: 0.5,
                frequency: 440,
                type: 'warm',
                volume: 0.4,
                envelope: { attack: 0.04, decay: 0.15, sustain: 0.3, release: 0.31 }
            },
            error: {
                duration: 0.25,
                frequency: 196,
                type: 'gentle',
                volume: 0.25,
                envelope: { attack: 0.03, decay: 0.07, sustain: 0.35, release: 0.15 }
            },
            warning: {
                duration: 0.3,
                frequency: 370,
                type: 'soft',
                volume: 0.35,
                envelope: { attack: 0.03, decay: 0.08, sustain: 0.35, release: 0.19 }
            },
            info: {
                duration: 0.2,
                frequency: 587.33,
                type: 'gentle',
                volume: 0.3,
                envelope: { attack: 0.02, decay: 0.05, sustain: 0.25, release: 0.13 }
            },
            interface: {
                duration: 0.1,
                frequency: 740,
                type: 'soft',
                volume: 0.2,
                envelope: { attack: 0.01, decay: 0.02, sustain: 0.15, release: 0.07 }
            }
        };
    }
    
    getModernSounds() {
        return {
            button: {
                duration: 0.12,
                frequency: 800,
                type: 'bell',
                volume: 0.35,
                envelope: { attack: 0.008, decay: 0.025, sustain: 0.25, release: 0.087 }
            },
            success: {
                duration: 0.35,
                frequency: 659.25,
                type: 'warm',
                volume: 0.45,
                envelope: { attack: 0.02, decay: 0.08, sustain: 0.35, release: 0.25 }
            },
            error: {
                duration: 0.18,
                frequency: 185,
                type: 'gentle',
                volume: 0.3,
                envelope: { attack: 0.02, decay: 0.04, sustain: 0.4, release: 0.12 }
            },
            warning: {
                duration: 0.2,
                frequency: 523,
                type: 'bell',
                volume: 0.38,
                envelope: { attack: 0.02, decay: 0.05, sustain: 0.3, release: 0.13 }
            },
            info: {
                duration: 0.15,
                frequency: 880,
                type: 'soft',
                volume: 0.32,
                envelope: { attack: 0.012, decay: 0.03, sustain: 0.25, release: 0.108 }
            },
            interface: {
                duration: 0.06,
                frequency: 1000,
                type: 'bell',
                volume: 0.22,
                envelope: { attack: 0.004, delay: 0.012, sustain: 0.18, release: 0.044 }
            }
        };
    }
    
    getProfessionalSounds() {
        return {
            button: {
                duration: 0.1,
                frequency: 700,
                type: 'sine',
                volume: 0.35,
                envelope: { attack: 0.006, decay: 0.02, sustain: 0.25, release: 0.074 }
            },
            success: {
                duration: 0.3,
                frequency: 587.33,
                type: 'warm',
                volume: 0.4,
                envelope: { attack: 0.02, decay: 0.07, sustain: 0.35, release: 0.21 }
            },
            error: {
                duration: 0.16,
                frequency: 196,
                type: 'gentle',
                volume: 0.28,
                envelope: { attack: 0.015, decay: 0.035, sustain: 0.35, release: 0.11 }
            },
            warning: {
                duration: 0.18,
                frequency: 466.16,
                type: 'soft',
                volume: 0.33,
                envelope: { attack: 0.015, decay: 0.04, sustain: 0.3, release: 0.125 }
            },
            info: {
                duration: 0.14,
                frequency: 698.46,
                type: 'bell',
                volume: 0.3,
                envelope: { attack: 0.01, decay: 0.025, sustain: 0.22, release: 0.105 }
            },
            interface: {
                duration: 0.05,
                frequency: 830,
                type: 'sine',
                volume: 0.18,
                envelope: { attack: 0.003, decay: 0.01, sustain: 0.15, release: 0.037 }
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
            if (this.isInitialized) {
                await this.loadSounds();
            }
        }
    }
    
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
    
    destroy() {
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.sounds.clear();
        this.isInitialized = false;
    }
}

// Глобальная инициализация
window.soundSystem = new SoundSystem();