// === СИСТЕМА НАСТРОЕК ===
class Settings {
    constructor() {
        this.currentSection = 'sound';
        this.sections = {
            'sound': {
                title: '🔊 Звук',
                icon: '🔊',
                active: true
            },
            'theme': {
                title: '🎨 Тема',
                icon: '🎨',
                active: true
            },
            'interface': {
                title: '🖥️ Интерфейс',
                icon: '🖥️',
                active: true
            },
            'performance': {
                title: '⚡ Производительность',
                icon: '⚡',
                active: true
            },
            'advanced': {
                title: '🔧 Дополнительно',
                icon: '🔧',
                active: true
            }
        };
        
        this.settings = {
            theme: 'dark',
            language: 'ru',
            animations: true,
            autoSave: true,
            notifications: true,
            compactMode: false,
            showTooltips: true,
            autoUpdate: true,
            debugMode: false,
            performanceMode: false
        };
        
        this.loadSettings();
        this.setupEventListeners();
    }
    
    // Загрузка настроек
    loadSettings() {
        const saved = localStorage.getItem('rkm_settings');
        if (saved) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            } catch (e) {
                console.warn('Ошибка загрузки настроек:', e);
            }
        }
    }
    
    // Сохранение настроек
    saveSettings() {
        localStorage.setItem('rkm_settings', JSON.stringify(this.settings));
        this.applySettings();
    }
    
    // Применение настроек
    applySettings() {
        // Применяем тему
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        
        // Применяем анимации
        if (!this.settings.animations) {
            document.body.classList.add('no-animations');
        } else {
            document.body.classList.remove('no-animations');
        }
        
        // Компактный режим
        if (this.settings.compactMode) {
            document.body.classList.add('compact-mode');
        } else {
            document.body.classList.remove('compact-mode');
        }
        
        // Режим производительности
        if (this.settings.performanceMode) {
            document.body.classList.add('performance-mode');
        } else {
            document.body.classList.remove('performance-mode');
        }
        
        console.log('Настройки применены:', this.settings);
    }
    
    // Установка событий
    setupEventListeners() {
        // Кнопка настроек
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.openSettings();
            });
        }
        
        // Клавиатурные сочетания
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === ',') {
                e.preventDefault();
                this.openSettings();
            }
        });
    }
    
    // Открытие окна настроек
    openSettings() {
        const modal = this.createSettingsModal();
        document.body.appendChild(modal);
        
        // Показываем модальное окно
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        // Привязываем события
        this.bindSettingsEvents();
        
        // Воспроизводим звук
        if (window.soundSystem) {
            window.soundSystem.playInterface();
        }
    }
    
    // Создание модального окна настроек
    createSettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay settings-modal';
        modal.innerHTML = `
            <div class="modal settings-modal-content">
                <div class="settings-header">
                    <h2 class="modal-title">⚙️ Настройки</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                
                <div class="settings-container">
                    <div class="settings-sidebar">
                        ${this.createSettingsSidebar()}
                    </div>
                    
                    <div class="settings-content">
                        ${this.createSettingsContent()}
                    </div>
                </div>
                
                <div class="settings-footer">
                    <button class="btn btn-secondary" onclick="window.settings.resetAllSettings()">
                        🔄 Сбросить всё
                    </button>
                    <button class="btn btn-success" onclick="window.settings.exportSettings()">
                        📤 Экспорт
                    </button>
                    <button class="btn btn-primary" onclick="window.settings.importSettings()">
                        📥 Импорт
                    </button>
                </div>
            </div>
        `;
        
        return modal;
    }
    
    // Создание боковой панели разделов
    createSettingsSidebar() {
        let html = '<div class="settings-tabs">';
        
        Object.entries(this.sections).forEach(([key, section]) => {
            if (section.active) {
                html += `
                    <button class="settings-tab ${key === this.currentSection ? 'active' : ''}" 
                            data-section="${key}">
                        <span class="tab-icon">${section.icon}</span>
                        <span class="tab-text">${section.title}</span>
                    </button>
                `;
            }
        });
        
        html += '</div>';
        return html;
    }
    
    // Создание контента настроек
    createSettingsContent() {
        switch (this.currentSection) {
            case 'sound':
                return window.soundSettings ? window.soundSettings.createSoundSettingsUI() : this.createPlaceholder('Звуковые настройки загружаются...');
            case 'theme':
                return this.createThemeSettings();
            case 'interface':
                return this.createInterfaceSettings();
            case 'performance':
                return this.createPerformanceSettings();
            case 'advanced':
                return this.createAdvancedSettings();
            default:
                return this.createPlaceholder('Раздел не найден');
        }
    }
    
    // Настройки темы
    createThemeSettings() {
        return `
            <div class="settings-section" id="theme-settings">
                <h3 class="settings-section-title">🎨 Настройки темы</h3>
                
                <div class="setting-group">
                    <div class="setting-item">
                        <label class="setting-label">
                            <span>Тема оформления</span>
                            <select id="theme-select" class="setting-select">
                                <option value="dark" ${this.settings.theme === 'dark' ? 'selected' : ''}>Тёмная</option>
                                <option value="light" ${this.settings.theme === 'light' ? 'selected' : ''}>Светлая</option>
                                <option value="auto" ${this.settings.theme === 'auto' ? 'selected' : ''}>Автоматическая</option>
                                <option value="blue" ${this.settings.theme === 'blue' ? 'selected' : ''}>Синяя</option>
                                <option value="green" ${this.settings.theme === 'green' ? 'selected' : ''}>Зелёная</option>
                            </select>
                        </label>
                    </div>
                </div>
                
                <div class="setting-group">
                    <h4 class="setting-group-title">Предпросмотр тем</h4>
                    <div class="theme-preview-grid">
                        <div class="theme-preview ${this.settings.theme === 'dark' ? 'active' : ''}" data-theme="dark">
                            <div class="preview-header dark-theme"></div>
                            <div class="preview-content dark-theme"></div>
                            <span>Тёмная</span>
                        </div>
                        <div class="theme-preview ${this.settings.theme === 'light' ? 'active' : ''}" data-theme="light">
                            <div class="preview-header light-theme"></div>
                            <div class="preview-content light-theme"></div>
                            <span>Светлая</span>
                        </div>
                        <div class="theme-preview ${this.settings.theme === 'blue' ? 'active' : ''}" data-theme="blue">
                            <div class="preview-header blue-theme"></div>
                            <div class="preview-content blue-theme"></div>
                            <span>Синяя</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Настройки интерфейса
    createInterfaceSettings() {
        return `
            <div class="settings-section" id="interface-settings">
                <h3 class="settings-section-title">🖥️ Настройки интерфейса</h3>
                
                <div class="setting-group">
                    <div class="setting-item">
                        <label class="setting-label">
                            <span>Язык интерфейса</span>
                            <select id="language-select" class="setting-select">
                                <option value="ru" ${this.settings.language === 'ru' ? 'selected' : ''}>Русский</option>
                                <option value="en" ${this.settings.language === 'en' ? 'selected' : ''}>English</option>
                            </select>
                        </label>
                    </div>
                </div>
                
                <div class="setting-group">
                    <div class="setting-item">
                        <label class="setting-label">
                            <span>Анимации</span>
                            <div class="toggle-switch">
                                <input type="checkbox" id="animations-enabled" ${this.settings.animations ? 'checked' : ''}>
                                <span class="slider"></span>
                            </div>
                        </label>
                    </div>
                </div>
                
                <div class="setting-item">
                    <label class="setting-label">
                        <span>Компактный режим</span>
                        <div class="toggle-switch">
                            <input type="checkbox" id="compact-mode" ${this.settings.compactMode ? 'checked' : ''}>
                            <span class="slider"></span>
                        </div>
                    </label>
                </div>
                
                <div class="setting-item">
                    <label class="setting-label">
                        <span>Показывать подсказки</span>
                        <div class="toggle-switch">
                            <input type="checkbox" id="show-tooltips" ${this.settings.showTooltips ? 'checked' : ''}>
                            <span class="slider"></span>
                        </div>
                    </label>
                </div>
                
                <div class="setting-item">
                    <label class="setting-label">
                        <span>Уведомления</span>
                        <div class="toggle-switch">
                            <input type="checkbox" id="notifications-enabled" ${this.settings.notifications ? 'checked' : ''}>
                            <span class="slider"></span>
                        </div>
                    </label>
                </div>
            </div>
        `;
    }
    
    // Настройки производительности
    createPerformanceSettings() {
        return `
            <div class="settings-section" id="performance-settings">
                <h3 class="settings-section-title">⚡ Настройки производительности</h3>
                
                <div class="setting-group">
                    <div class="setting-item">
                        <label class="setting-label">
                            <span>Режим производительности</span>
                            <div class="toggle-switch">
                                <input type="checkbox" id="performance-mode" ${this.settings.performanceMode ? 'checked' : ''}>
                                <span class="slider"></span>
                            </div>
                        </label>
                        <p class="setting-description">Отключает некоторые визуальные эффекты для улучшения производительности</p>
                    </div>
                </div>
                
                <div class="setting-item">
                    <label class="setting-label">
                        <span>Автосохранение</span>
                        <div class="toggle-switch">
                            <input type="checkbox" id="auto-save" ${this.settings.autoSave ? 'checked' : ''}>
                            <span class="slider"></span>
                        </div>
                    </label>
                </div>
                
                <div class="setting-item">
                    <label class="setting-label">
                        <span>Автообновления</span>
                        <div class="toggle-switch">
                            <input type="checkbox" id="auto-update" ${this.settings.autoUpdate ? 'checked' : ''}>
                            <span class="slider"></span>
                        </div>
                    </label>
                </div>
            </div>
        `;
    }
    
    // Дополнительные настройки
    createAdvancedSettings() {
        return `
            <div class="settings-section" id="advanced-settings">
                <h3 class="settings-section-title">🔧 Дополнительные настройки</h3>
                
                <div class="setting-group">
                    <div class="setting-item">
                        <label class="setting-label">
                            <span>Режим разработчика</span>
                            <div class="toggle-switch">
                                <input type="checkbox" id="debug-mode" ${this.settings.debugMode ? 'checked' : ''}>
                                <span class="slider"></span>
                            </div>
                        </label>
                        <p class="setting-description">Включает дополнительную информацию для отладки</p>
                    </div>
                </div>
                
                <div class="setting-actions">
                    <button class="btn btn-danger" onclick="window.settings.clearAllData()">
                        🗑️ Очистить данные
                    </button>
                    <button class="btn btn-warning" onclick="window.settings.showSystemInfo()">
                        ℹ️ Информация о системе
                    </button>
                </div>
            </div>
        `;
    }
    
    // Заглушка для разделов
    createPlaceholder(text) {
        return `
            <div class="settings-placeholder">
                <div class="placeholder-icon">⚙️</div>
                <div class="placeholder-text">${text}</div>
            </div>
        `;
    }
    
    // Привязка событий настроек
    bindSettingsEvents() {
        // Переключение разделов
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });
        
        // Звуковые настройки
        if (window.soundSettings) {
            window.soundSettings.bindSoundSettingsEvents();
        }
        
        // Остальные настройки
        this.bindGeneralSettings();
    }
    
    // Привязка общих настроек
    bindGeneralSettings() {
        // Тема
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.setSetting('theme', e.target.value);
            });
        }
        
        // Язык
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.setSetting('language', e.target.value);
            });
        }
        
        // Чекбоксы
        const checkboxes = [
            'animations-enabled', 'compact-mode', 'show-tooltips', 
            'notifications-enabled', 'performance-mode', 'auto-save', 
            'auto-update', 'debug-mode'
        ];
        
        checkboxes.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', (e) => {
                    const settingKey = id.replace('-enabled', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    this.setSetting(settingKey, e.target.checked);
                });
            }
        });
        
        // Предпросмотр тем
        document.querySelectorAll('.theme-preview').forEach(preview => {
            preview.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                this.setSetting('theme', theme);
                this.updateThemePreview(theme);
            });
        });
    }
    
    // Переключение раздела
    switchSection(section) {
        this.currentSection = section;
        
        // Обновляем активную вкладку
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
        
        // Обновляем контент
        const content = document.querySelector('.settings-content');
        if (content) {
            content.innerHTML = this.createSettingsContent();
            this.bindSettingsEvents();
        }
    }
    
    // Методы управления настройками
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
    
    // Сброс всех настроек
    resetAllSettings() {
        if (confirm('Вы уверены, что хотите сбросить все настройки?')) {
            localStorage.removeItem('rkm_settings');
            localStorage.removeItem('rkm_sound_settings');
            window.location.reload();
        }
    }
    
    // Экспорт настроек
    exportSettings() {
        const data = {
            settings: this.settings,
            soundSettings: window.soundSettings ? window.soundSettings.settings : {},
            timestamp: Date.now(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rkm-settings.json';
        a.click();
        URL.revokeObjectURL(url);
        
        window.notifications?.success('Настройки экспортированы');
    }
    
    // Импорт настроек
    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        
                        if (data.settings) {
                            this.settings = { ...this.settings, ...data.settings };
                            this.saveSettings();
                        }
                        
                        if (data.soundSettings && window.soundSettings) {
                            window.soundSettings.settings = { ...window.soundSettings.settings, ...data.soundSettings };
                            window.soundSettings.saveSettings();
                        }
                        
                        window.notifications?.success('Настройки импортированы');
                        setTimeout(() => window.location.reload(), 1000);
                    } catch (error) {
                        window.notifications?.error('Ошибка импорта настроек');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
    
    // Очистка всех данных
    clearAllData() {
        if (confirm('Это удалит ВСЕ данные приложения. Продолжить?')) {
            localStorage.clear();
            window.notifications?.warning('Все данные очищены');
            setTimeout(() => window.location.reload(), 1000);
        }
    }
    
    // Информация о системе
    showSystemInfo() {
        const info = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screen: `${screen.width}x${screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            localStorage: !!window.localStorage,
            sessionStorage: !!window.sessionStorage
        };
        
        const content = Object.entries(info)
            .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
            .join('<br>');
            
        window.notifications?.info(`<div style="text-align: left;">${content}</div>`, 10000);
    }
}

// Глобальная инициализация
window.settings = new Settings();