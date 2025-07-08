// === СИСТЕМА НАСТРОЕК ===
class Settings {
    constructor() {
        this.currentSection = 'sound';
        this.developerPassword = null;
        this.isDeveloperUnlocked = false;
        this.sections = {
            'sound': {
                title: '🔊 Звук',
                icon: '🔊',
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
            'developer': {
                title: '🔧 Разработчик',
                icon: '🔧',
                active: true,
                requiresPassword: true
            }
        };
        
        this.settings = {
            animations: true,
            autoSave: true,
            notifications: true,
            compactMode: false,
            showTooltips: true,
            autoUpdate: true,
            performanceMode: false
        };
        
        this.loadSettings();
        this.loadDeveloperPassword();
        this.setupEventListeners();
    }
    
    async loadDeveloperPassword() {
        try {
            const response = await fetch('js/.env');
            const envText = await response.text();
            const lines = envText.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('DEVELOPER_PASSWORD=')) {
                    this.developerPassword = line.split('=')[1].trim();
                    break;
                }
            }
        } catch (error) {
            this.developerPassword = 'dev2024rkm';
        }
    }
    
    loadSettings() {
        const saved = localStorage.getItem('rkm_settings');
        if (saved) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            } catch (e) {
                // Игнорируем ошибки
            }
        }
    }
    
    saveSettings() {
        localStorage.setItem('rkm_settings', JSON.stringify(this.settings));
        this.applySettings();
    }
    
    applySettings() {
        if (!this.settings.animations) {
            document.body.classList.add('no-animations');
        } else {
            document.body.classList.remove('no-animations');
        }
        
        if (this.settings.compactMode) {
            document.body.classList.add('compact-mode');
        } else {
            document.body.classList.remove('compact-mode');
        }
        
        if (this.settings.performanceMode) {
            document.body.classList.add('performance-mode');
        } else {
            document.body.classList.remove('performance-mode');
        }
    }
    
    setupEventListeners() {
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.openSettings();
            });
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === ',') {
                e.preventDefault();
                this.openSettings();
            }
        });
    }
    
    openSettings() {
        const modal = this.createSettingsModal();
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        this.bindSettingsEvents();
        
        if (window.soundSystem) {
            window.soundSystem.playInterface();
        }
    }
    
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
            </div>
        `;
        
        return modal;
    }
    
    createSettingsSidebar() {
        let html = '<div class="settings-tabs">';
        
        Object.entries(this.sections).forEach(([key, section]) => {
            if (section.active) {
                if (key === 'developer' && !this.isDeveloperUnlocked) {
                    html += `
                        <button class="settings-tab developer-locked" 
                                data-section="${key}">
                            <span class="tab-icon">🔒</span>
                            <span class="tab-text">${section.title}</span>
                        </button>
                    `;
                } else {
                    html += `
                        <button class="settings-tab ${key === this.currentSection ? 'active' : ''}" 
                                data-section="${key}">
                            <span class="tab-icon">${section.icon}</span>
                            <span class="tab-text">${section.title}</span>
                        </button>
                    `;
                }
            }
        });
        
        html += '</div>';
        return html;
    }
    
    createSettingsContent() {
        switch (this.currentSection) {
            case 'sound':
                return window.soundSettings ? window.soundSettings.createSoundSettingsUI() : this.createPlaceholder('Звуковые настройки загружаются...');
            case 'interface':
                return this.createInterfaceSettings();
            case 'performance':
                return this.createPerformanceSettings();
            case 'developer':
                return this.isDeveloperUnlocked ? this.createDeveloperSettings() : this.createDeveloperLogin();
            default:
                return this.createPlaceholder('Раздел не найден');
        }
    }
    
    createInterfaceSettings() {
        return `
            <div class="settings-section" id="interface-settings">
                <h3 class="settings-section-title">🖥️ Настройки интерфейса</h3>
                
                <div class="setting-group">
                    <div class="setting-item">
                        <label class="setting-label">
                            <span>Анимации</span>
                            <div class="toggle-switch">
                                <input type="checkbox" id="animations-enabled" ${this.settings.animations ? 'checked' : ''}>
                                <span class="slider"></span>
                            </div>
                        </label>
                        <p class="setting-description">Включает плавные анимации и переходы</p>
                    </div>
                </div>
                
                <div class="setting-group">
                    <div class="setting-item">
                        <label class="setting-label">
                            <span>Компактный режим</span>
                            <div class="toggle-switch">
                                <input type="checkbox" id="compact-mode" ${this.settings.compactMode ? 'checked' : ''}>
                                <span class="slider"></span>
                            </div>
                        </label>
                        <p class="setting-description">Уменьшает отступы и размеры элементов интерфейса</p>
                    </div>
                </div>
                
                <div class="setting-group">
                    <div class="setting-item">
                        <label class="setting-label">
                            <span>Показывать подсказки</span>
                            <div class="toggle-switch">
                                <input type="checkbox" id="show-tooltips" ${this.settings.showTooltips ? 'checked' : ''}>
                                <span class="slider"></span>
                            </div>
                        </label>
                        <p class="setting-description">Отображает всплывающие подсказки при наведении</p>
                    </div>
                </div>
                
                <div class="setting-group">
                    <div class="setting-item">
                        <label class="setting-label">
                            <span>Уведомления</span>
                            <div class="toggle-switch">
                                <input type="checkbox" id="notifications-enabled" ${this.settings.notifications ? 'checked' : ''}>
                                <span class="slider"></span>
                            </div>
                        </label>
                        <p class="setting-description">Включает системные уведомления</p>
                    </div>
                </div>
            </div>
        `;
    }
    
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
                
                <div class="setting-group">
                    <div class="setting-item">
                        <label class="setting-label">
                            <span>Автосохранение</span>
                            <div class="toggle-switch">
                                <input type="checkbox" id="auto-save" ${this.settings.autoSave ? 'checked' : ''}>
                                <span class="slider"></span>
                            </div>
                        </label>
                        <p class="setting-description">Автоматически сохраняет настройки при изменении</p>
                    </div>
                </div>
                
                <div class="setting-group">
                    <div class="setting-item">
                        <label class="setting-label">
                            <span>Автообновления</span>
                            <div class="toggle-switch">
                                <input type="checkbox" id="auto-update" ${this.settings.autoUpdate ? 'checked' : ''}>
                                <span class="slider"></span>
                            </div>
                        </label>
                        <p class="setting-description">Автоматически проверяет и применяет обновления</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    createDeveloperLogin() {
        return `
            <div class="settings-section" id="developer-login">
                <h3 class="settings-section-title">🔒 Доступ разработчика</h3>
                
                <div class="setting-group">
                    <div class="developer-login-form">
                        <p style="color: var(--text-muted); margin-bottom: 1.5rem; text-align: center;">
                            Для доступа к настройкам разработчика введите пароль
                        </p>
                        
                        <div class="setting-item">
                            <label class="setting-label">
                                <span>Пароль</span>
                                <input type="password" id="developer-password" class="setting-input" placeholder="Введите пароль разработчика">
                            </label>
                        </div>
                        
                        <div class="setting-actions">
                            <button class="btn btn-primary" onclick="window.settings.unlockDeveloper()">
                                🔓 Войти
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    createDeveloperSettings() {
        return `
            <div class="settings-section" id="developer-settings">
                <h3 class="settings-section-title">🔧 Настройки разработчика</h3>
                
                <div class="setting-group">
                    <h4 class="setting-group-title">Инструменты разработчика</h4>
                    <p style="color: var(--text-warning); margin-bottom: 1rem;">
                        ⚠️ Эти настройки предназначены только для разработчиков
                    </p>
                </div>
                
                <div class="setting-group">
                    <div class="setting-actions">
                        <button class="btn btn-secondary" onclick="window.app.testUpdateSystem()">
                            🧪 Тест обновления
                        </button>
                        <button class="btn btn-info" onclick="window.settings.showSystemInfo()">
                            ℹ️ Информация о системе
                        </button>
                        <button class="btn btn-warning" onclick="window.settings.clearAllData()">
                            🗑️ Очистить данные
                        </button>
                        <button class="btn btn-danger" onclick="window.settings.lockDeveloper()">
                            🔒 Выйти
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    createPlaceholder(text) {
        return `
            <div class="settings-placeholder">
                <div class="placeholder-icon">⚙️</div>
                <div class="placeholder-text">${text}</div>
            </div>
        `;
    }
    
    bindSettingsEvents() {
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                
                if (section === 'developer' && !this.isDeveloperUnlocked) {
                    return;
                }
                
                this.switchSection(section);
            });
        });
        
        if (window.soundSettings) {
            window.soundSettings.bindSoundSettingsEvents();
        }
        
        this.bindGeneralSettings();
    }
    
    bindGeneralSettings() {
        const checkboxes = [
            'animations-enabled', 'compact-mode', 'show-tooltips', 
            'notifications-enabled', 'performance-mode', 'auto-save', 'auto-update'
        ];
        
        checkboxes.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', (e) => {
                    let settingKey = id.replace('-enabled', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    this.setSetting(settingKey, e.target.checked);
                });
            }
        });
        
        const passwordInput = document.getElementById('developer-password');
        if (passwordInput) {
            passwordInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.unlockDeveloper();
                }
            });
        }
    }
    
    switchSection(section) {
        this.currentSection = section;
        
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const targetTab = document.querySelector(`[data-section="${section}"]`);
        if (targetTab && !targetTab.classList.contains('developer-locked')) {
            targetTab.classList.add('active');
        }
        
        const content = document.querySelector('.settings-content');
        if (content) {
            content.innerHTML = this.createSettingsContent();
            this.bindSettingsEvents();
        }
    }
    
    unlockDeveloper() {
        const passwordInput = document.getElementById('developer-password');
        if (passwordInput && passwordInput.value === this.developerPassword) {
            this.isDeveloperUnlocked = true;
            
            const sidebar = document.querySelector('.settings-sidebar');
            if (sidebar) {
                sidebar.innerHTML = this.createSettingsSidebar();
            }
            
            this.switchSection('developer');
            
            window.notifications?.success('Доступ разработчика получен');
            if (window.soundSystem) {
                window.soundSystem.playSuccess();
            }
        } else {
            window.notifications?.error('Неверный пароль');
            if (window.soundSystem) {
                window.soundSystem.playError();
            }
        }
    }
    
    lockDeveloper() {
        this.isDeveloperUnlocked = false;
        this.switchSection('sound');
        
        const sidebar = document.querySelector('.settings-sidebar');
        if (sidebar) {
            sidebar.innerHTML = this.createSettingsSidebar();
        }
        
        window.notifications?.info('Доступ разработчика заблокирован');
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
    
    clearAllData() {
        if (confirm('Это удалит ВСЕ данные приложения. Продолжить?')) {
            localStorage.clear();
            window.notifications?.warning('Все данные очищены');
            setTimeout(() => window.location.reload(), 1000);
        }
    }
    
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