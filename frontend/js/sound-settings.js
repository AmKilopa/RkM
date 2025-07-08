// === СИСТЕМА НАСТРОЕК ЗВУКА ===
class SoundSettings {
    constructor() {
        this.settings = {
            masterVolume: 0.6,
            soundEnabled: true,
            buttonSounds: true,
            notificationSounds: true,
            interfaceSounds: true,
            successSounds: true,
            errorSounds: true,
            warningSounds: true,
            soundPack: 'pleasant'
        };
        
        this.loadSettings();
        this.setupEventListeners();
    }
    
    loadSettings() {
        const saved = localStorage.getItem('rkm_sound_settings');
        if (saved) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            } catch (e) {
                // Игнорируем ошибки
            }
        }
    }
    
    saveSettings() {
        localStorage.setItem('rkm_sound_settings', JSON.stringify(this.settings));
        this.applySettings();
    }
    
    applySettings() {
        if (window.soundSystem) {
            window.soundSystem.setMasterVolume(this.settings.masterVolume);
            window.soundSystem.setSoundEnabled(this.settings.soundEnabled);
            
            window.soundSystem.setCategoryEnabled('button', this.settings.buttonSounds);
            window.soundSystem.setCategoryEnabled('notification', this.settings.notificationSounds);
            window.soundSystem.setCategoryEnabled('interface', this.settings.interfaceSounds);
            window.soundSystem.setCategoryEnabled('success', this.settings.successSounds);
            window.soundSystem.setCategoryEnabled('error', this.settings.errorSounds);
            window.soundSystem.setCategoryEnabled('warning', this.settings.warningSounds);
            
            window.soundSystem.setSoundPack(this.settings.soundPack);
        }
    }
    
    setupEventListeners() {
        document.addEventListener('soundSystemReady', () => {
            this.applySettings();
        });
    }
    
    setSetting(key, value) {
        if (this.settings.hasOwnProperty(key)) {
            this.settings[key] = value;
            this.saveSettings();
            return true;
        }
        return false;
    }
    
    getSetting(key) {
        return this.settings[key];
    }
    
    toggleSound() {
        this.settings.soundEnabled = !this.settings.soundEnabled;
        this.saveSettings();
        return this.settings.soundEnabled;
    }
    
    setMasterVolume(volume) {
        this.settings.masterVolume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    }
    
    resetToDefaults() {
        this.settings = {
            masterVolume: 0.6,
            soundEnabled: true,
            buttonSounds: true,
            notificationSounds: true,
            interfaceSounds: true,
            successSounds: true,
            errorSounds: true,
            warningSounds: true,
            soundPack: 'pleasant'
        };
        this.saveSettings();
    }
    
    createSoundSettingsUI() {
        return `
            <div class="settings-section" id="sound-settings">
                <h3 class="settings-section-title">🔊 Звуковые настройки</h3>
                
                <div class="setting-group">
                    <div class="setting-item">
                        <label class="setting-label">
                            <span>Включить звуки</span>
                            <div class="toggle-switch">
                                <input type="checkbox" id="sound-enabled" ${this.settings.soundEnabled ? 'checked' : ''}>
                                <span class="slider"></span>
                            </div>
                        </label>
                    </div>
                </div>
                
                <div class="setting-group">
                    <div class="setting-item">
                        <label class="setting-label">
                            <span>Общая громкость</span>
                            <div class="volume-control">
                                <input type="range" id="master-volume" min="0" max="100" 
                                       value="${this.settings.masterVolume * 100}" 
                                       class="volume-slider">
                                <span class="volume-value">${Math.round(this.settings.masterVolume * 100)}%</span>
                            </div>
                        </label>
                    </div>
                </div>
                
                <div class="setting-group">
                    <h4 class="setting-group-title">Типы звуков</h4>
                    
                    <div class="setting-item">
                        <label class="setting-label">
                            <span>Звуки кнопок</span>
                            <div class="toggle-switch">
                                <input type="checkbox" id="button-sounds" ${this.settings.buttonSounds ? 'checked' : ''}>
                                <span class="slider"></span>
                            </div>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <label class="setting-label">
                            <span>Звуки уведомлений</span>
                            <div class="toggle-switch">
                                <input type="checkbox" id="notification-sounds" ${this.settings.notificationSounds ? 'checked' : ''}>
                                <span class="slider"></span>
                            </div>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <label class="setting-label">
                            <span>Звуки интерфейса</span>
                            <div class="toggle-switch">
                                <input type="checkbox" id="interface-sounds" ${this.settings.interfaceSounds ? 'checked' : ''}>
                                <span class="slider"></span>
                            </div>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <label class="setting-label">
                            <span>Звуки успеха</span>
                            <div class="toggle-switch">
                                <input type="checkbox" id="success-sounds" ${this.settings.successSounds ? 'checked' : ''}>
                                <span class="slider"></span>
                            </div>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <label class="setting-label">
                            <span>Звуки ошибок</span>
                            <div class="toggle-switch">
                                <input type="checkbox" id="error-sounds" ${this.settings.errorSounds ? 'checked' : ''}>
                                <span class="slider"></span>
                            </div>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <label class="setting-label">
                            <span>Звуки предупреждений</span>
                            <div class="toggle-switch">
                                <input type="checkbox" id="warning-sounds" ${this.settings.warningSounds ? 'checked' : ''}>
                                <span class="slider"></span>
                            </div>
                        </label>
                    </div>
                </div>
                
                <div class="setting-group">
                    <div class="setting-item">
                        <label class="setting-label">
                            <span>Набор звуков</span>
                            <select id="sound-pack" class="setting-select">
                                <option value="pleasant" ${this.settings.soundPack === 'pleasant' ? 'selected' : ''}>Приятный</option>
                                <option value="soft" ${this.settings.soundPack === 'soft' ? 'selected' : ''}>Мягкий</option>
                                <option value="modern" ${this.settings.soundPack === 'modern' ? 'selected' : ''}>Современный</option>
                                <option value="professional" ${this.settings.soundPack === 'professional' ? 'selected' : ''}>Профессиональный</option>
                            </select>
                        </label>
                    </div>
                </div>
                
                <div class="setting-actions">
                    <button class="btn btn-primary" onclick="window.soundSettings.testAllSounds()">
                        🎵 Тест звуков
                    </button>
                    <button class="btn btn-secondary" onclick="window.soundSettings.resetToDefaults()">
                        🔄 Сбросить
                    </button>
                </div>
            </div>
        `;
    }
    
    bindSoundSettingsEvents() {
        const soundEnabled = document.getElementById('sound-enabled');
        if (soundEnabled) {
            soundEnabled.addEventListener('change', (e) => {
                this.setSetting('soundEnabled', e.target.checked);
            });
        }
        
        const masterVolume = document.getElementById('master-volume');
        if (masterVolume) {
            masterVolume.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                this.setSetting('masterVolume', volume);
                e.target.nextElementSibling.textContent = `${e.target.value}%`;
            });
        }
        
        const soundTypes = [
            'button-sounds', 'notification-sounds', 'interface-sounds',
            'success-sounds', 'error-sounds', 'warning-sounds'
        ];
        
        soundTypes.forEach(type => {
            const element = document.getElementById(type);
            if (element) {
                element.addEventListener('change', (e) => {
                    let settingKey = type.replace('-sounds', 'Sounds');
                    settingKey = settingKey.replace('-', '');
                    this.setSetting(settingKey, e.target.checked);
                });
            }
        });
        
        const soundPack = document.getElementById('sound-pack');
        if (soundPack) {
            soundPack.addEventListener('change', (e) => {
                this.setSetting('soundPack', e.target.value);
            });
        }
    }
    
    testAllSounds() {
        if (!window.soundSystem || !this.settings.soundEnabled) {
            window.notifications?.warning('Звуки отключены');
            return;
        }
        
        const sounds = [
            { name: 'Кнопка', method: 'playButton' },
            { name: 'Успех', method: 'playSuccess' },
            { name: 'Ошибка', method: 'playError' },
            { name: 'Предупреждение', method: 'playWarning' },
            { name: 'Информация', method: 'playInfo' },
            { name: 'Интерфейс', method: 'playInterface' }
        ];
        
        window.notifications?.info('Тестирование звуков...', 6000);
        
        sounds.forEach((sound, index) => {
            setTimeout(() => {
                if (window.soundSystem[sound.method]) {
                    window.soundSystem[sound.method]();
                }
            }, index * 700);
        });
    }
}

// Глобальная инициализация
window.soundSettings = new SoundSettings();