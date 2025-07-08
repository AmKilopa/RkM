// === СИСТЕМА НАСТРОЕК ===
class Settings {
    constructor() {
        this.currentSection = 'sound';
        this.developerPassword = null;
        this.isDeveloperUnlocked = false;
        this.sections = {
            'sound': {
                title: '🔊 Звук',
                icon: '🎵',
                active: true
            },
            'interface': {
                title: '🖥️ Интерфейс',
                icon: '🎨',
                active: true
            },
            'performance': {
                title: '⚡ Производительность',
                icon: '⚡',
                active: true
            },
            'developer': {
                title: '🔧 Разработчик',
                icon: '👨‍💻',
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
                    return;
                }
            }
        } catch (error) {
            // Файл не найден или ошибка чтения
        }
        this.developerPassword = null;
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
        // Проверяем что окно не открыто уже
        if (document.querySelector('.settings-modal')) {
            return;
        }
        
        const modal = this.createSettingsModal();
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.classList.add('active');
            
            // Обработчик клика по оверлею для закрытия
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeSettings();
                }
            });
            
            // Обработчик ESC для закрытия
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    this.closeSettings();
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);
        }, 10);
        
        this.bindSettingsEvents();
        
        if (window.soundSystem) {
            window.soundSystem.playInterface();
        }
    }
    
    closeSettings() {
        const settingsModals = document.querySelectorAll('.settings-modal');
        settingsModals.forEach(modal => {
            modal.remove();
        });
        document.body.style.overflow = '';
    }
    
    createSettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay settings-modal';
        modal.innerHTML = `
            <div class="modal">
                <div class="settings-header">
                    <h2 class="modal-title">⚙️ Настройки</h2>
                    <button class="modal-close" onclick="window.settings.closeSettings();">×</button>
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
                if (key === 'developer') {
                    // Показываем кнопку разработчика только если есть пароль в .env
                    if (!this.developerPassword) {
                        return; // Пропускаем кнопку если нет пароля
                    }
                    
                    if (!this.isDeveloperUnlocked) {
                        html += `
                            <button class="settings-tab developer-locked" 
                                    data-section="${key}"
                                    title="Требуется авторизация">
                                <span class="tab-icon">🔒</span>
                                <span class="tab-text">${section.title}</span>
                            </button>
                        `;
                    } else {
                        html += `
                            <button class="settings-tab developer-unlocked ${key === this.currentSection ? 'active' : ''}" 
                                    data-section="${key}">
                                <span class="tab-icon">🔓</span>
                                <span class="tab-text">${section.title}</span>
                            </button>
                        `;
                    }
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
                return this.isDeveloperUnlocked ? this.createDeveloperSettings() : this.createPlaceholder('Доступ запрещён');
            default:
                return this.createPlaceholder('Раздел не найден');
        }
    }
    
    createInterfaceSettings() {
        return `
            <div class="settings-section" id="interface-settings">
                <h3 class="settings-section-title">🖥️ Настройки интерфейса</h3>
                
                <div class="setting-group">
                    <h4 class="setting-group-title">Внешний вид</h4>
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
                    <h4 class="setting-group-title">Уведомления</h4>
                    <div class="setting-item">
                        <label class="setting-label">
                            <span>Системные уведомления</span>
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
                    <h4 class="setting-group-title">Оптимизация</h4>
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
    
    createDeveloperSettings() {
        return `
            <div class="settings-section" id="developer-settings">
                <h3 class="settings-section-title">🔧 Панель разработчика</h3>
                
                <div class="setting-group">
                    <h4 class="setting-group-title">🧪 Инструменты тестирования</h4>
                    <div class="setting-item">
                        <div class="setting-label">
                            <span>Тест системы обновлений</span>
                            <button class="btn btn-warning" onclick="window.app.testUpdateSystem()">
                                🔄 Тестировать
                            </button>
                        </div>
                        <div class="setting-description">
                            Запускает имитацию обновления для проверки системы
                        </div>
                    </div>
                    
                    <div class="setting-item">
                        <div class="setting-label">
                            <span>Информация о системе</span>
                            <button class="btn btn-info" onclick="window.settings.showSystemInfo()">
                                ℹ️ Показать
                            </button>
                        </div>
                        <div class="setting-description">
                            Отображает техническую информацию о браузере и системе
                        </div>
                    </div>
                </div>
                
                <div class="setting-group">
                    <h4 class="setting-group-title">🗑️ Управление данными</h4>
                    <div class="setting-item">
                        <div class="setting-label">
                            <span>Очистить кэш приложения</span>
                            <button class="btn btn-secondary" onclick="window.settings.clearCache()">
                                🧹 Очистить кэш
                            </button>
                        </div>
                        <div class="setting-description">
                            Удаляет временные файлы и кэш браузера
                        </div>
                    </div>
                    
                    <div class="setting-item">
                        <div class="setting-label">
                            <span>Сброс всех настроек</span>
                            <button class="btn btn-danger" onclick="window.settings.resetAllSettings()">
                                🔥 Полный сброс
                            </button>
                        </div>
                        <div class="setting-description">
                            Удаляет ВСЕ данные приложения и возвращает настройки по умолчанию
                        </div>
                    </div>
                </div>
                
                <div class="setting-group">
                    <h4 class="setting-group-title">🔒 Безопасность</h4>
                    <div class="setting-item">
                        <div class="setting-label">
                            <span>Выйти из режима разработчика</span>
                            <button class="btn btn-secondary" onclick="window.settings.lockDeveloper()">
                                🔒 Выйти
                            </button>
                        </div>
                        <div class="setting-description">
                            Заблокировать доступ к инструментам разработчика
                        </div>
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
        // Обработчики вкладок
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                
                if (section === 'developer' && !this.isDeveloperUnlocked) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.promptDeveloperPassword();
                    return;
                }
                
                this.switchSection(section);
            });
        });
        
        // Звуковые настройки
        if (window.soundSettings) {
            window.soundSettings.bindSoundSettingsEvents();
        }
        
        // Общие настройки
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
    
    promptDeveloperPassword() {
        // Создаем модальное окно для ввода пароля
        const passwordModal = `
            <div class="modal password-modal" style="z-index: 10000;">
                <div class="modal-header">
                    <h3 class="modal-title">🔐 Авторизация разработчика</h3>
                    <button onclick="window.modals.hide()" class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-container">
                        <div class="form-group">
                            <label class="form-label">Пароль</label>
                            <input type="password" 
                                   id="modal-developer-password" 
                                   class="form-input" 
                                   placeholder="Введите пароль разработчика"
                                   autocomplete="off"
                                   autofocus>
                        </div>
                        
                        <div class="form-group" style="display: flex; gap: 1rem; justify-content: center;">
                            <button class="btn btn-primary" onclick="window.settings.checkModalPassword()">
                                🔓 Войти
                            </button>
                            <button class="btn btn-secondary" onclick="window.modals.hide()">
                                ❌ Отмена
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        window.modals.show(passwordModal);
        
        // Обработчик Enter
        setTimeout(() => {
            const input = document.getElementById('modal-developer-password');
            if (input) {
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        this.checkModalPassword();
                    }
                });
            }
        }, 100);
    }
    
    checkModalPassword() {
        const input = document.getElementById('modal-developer-password');
        if (input && input.value === this.developerPassword) {
            this.isDeveloperUnlocked = true;
            window.modals.hide();
            
            // Обновляем сайдбар
            const sidebar = document.querySelector('.settings-sidebar');
            if (sidebar) {
                sidebar.innerHTML = this.createSettingsSidebar();
                this.bindSettingsEvents();
            }
            
            this.switchSection('developer');
            
            window.notifications?.success('🎉 Доступ разработчика получен!');
            if (window.soundSystem) {
                window.soundSystem.playSuccess();
            }
        } else {
            window.notifications?.error('❌ Неверный пароль');
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
            this.bindSettingsEvents();
        }
        
        window.notifications?.info('🔒 Доступ разработчика заблокирован');
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
    
    clearCache() {
        if (confirm('Очистить кэш приложения?')) {
            sessionStorage.clear();
            window.notifications?.success('🧹 Кэш очищен');
        }
    }
    
    resetAllSettings() {
        if (confirm('Это удалит ВСЕ настройки и данные приложения!\n\nПродолжить?')) {
            localStorage.clear();
            sessionStorage.clear();
            window.notifications?.warning('🔥 Все данные удалены');
            setTimeout(() => window.location.reload(), 1500);
        }
    }
    
    showSystemInfo() {
        const info = {
            'User Agent': navigator.userAgent,
            'Платформа': navigator.platform,
            'Язык': navigator.language,
            'Cookies': navigator.cookieEnabled ? 'Включены' : 'Отключены',
            'Онлайн': navigator.onLine ? 'Да' : 'Нет',
            'Экран': `${screen.width}x${screen.height}`,
            'Viewport': `${window.innerWidth}x${window.innerHeight}`,
            'LocalStorage': window.localStorage ? 'Доступно' : 'Недоступно',
            'SessionStorage': window.sessionStorage ? 'Доступно' : 'Недоступно'
        };
        
        const content = Object.entries(info)
            .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
            .join('<br>');
            
        window.notifications?.info(`<div style="text-align: left; font-size: 0.9rem;">${content}</div>`, 10000);
    }
}

// Глобальная инициализация
window.settings = new Settings();