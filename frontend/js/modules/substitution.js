// === МОДУЛЬ СОЗДАНИЯ ПОДМЕНЫ ===
class SubstitutionModule {
    constructor() {
        this.isAuthenticated = false;
        this.password = 'admin123';
    }
    
    show() {
        // Сначала проверяем авторизацию
        if (!this.isAuthenticated) {
            this.showAuthForm();
            return;
        }
        
        this.showSubstitutionForm();
    }
    
    showAuthForm() {
        const authPage = `
            <div class="page active" id="substitution-auth-page">
                <button class="back-btn">← Назад</button>
                <div class="form-container">
                    <h2 style="text-align: center; margin-bottom: 2rem; background: linear-gradient(45deg, #fff, var(--accent-blue)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">🔐 Авторизация</h2>
                    <p style="text-align: center; color: var(--text-muted); margin-bottom: 3rem;">
                        Для доступа к функции создания подмены требуется авторизация
                    </p>
                    <form id="auth-form">
                        <div class="form-group">
                            <label class="form-label">Пароль:</label>
                            <input type="password" id="auth-password" class="form-input" placeholder="Введите пароль" required>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%;">
                            🔓 Войти
                        </button>
                    </form>
                </div>
            </div>
        `;
        
        // Удаляем существующие страницы
        const pages = document.querySelectorAll('.page:not(#home-page)');
        pages.forEach(page => page.remove());
        
        // Добавляем страницу авторизации
        document.body.insertAdjacentHTML('beforeend', authPage);
        
        // Скрываем главную страницу
        document.getElementById('home-page').classList.remove('active');
        
        this.bindAuthEvents();
    }
    
    bindAuthEvents() {
        const authForm = document.getElementById('auth-form');
        if (authForm) {
            authForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAuth();
            });
        }
    }
    
    async handleAuth() {
        const passwordInput = document.getElementById('auth-password');
        const password = passwordInput.value;
        
        if (password === this.password) {
            this.isAuthenticated = true;
            window.notifications?.success('Авторизация успешна');
            
            if (window.soundSystem) {
                window.soundSystem.playSuccess();
            }
            
            // Задержка для показа уведомления
            setTimeout(() => {
                this.showSubstitutionForm();
            }, 500);
        } else {
            window.notifications?.error('Неверный пароль');
            
            if (window.soundSystem) {
                window.soundSystem.playError();
            }
            
            // Анимация ошибки
            passwordInput.style.borderColor = 'var(--accent-red)';
            passwordInput.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.25)';
            
            setTimeout(() => {
                passwordInput.style.borderColor = '';
                passwordInput.style.boxShadow = '';
                passwordInput.value = '';
                passwordInput.focus();
            }, 1000);
        }
    }
    
    showSubstitutionForm() {
        const substitutionPage = `
            <div class="page active" id="substitution-page">
                <button class="back-btn">← Назад</button>
                <div class="form-container">
                    <h2 style="text-align: center; margin-bottom: 2rem; background: linear-gradient(45deg, #fff, var(--accent-green)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">🔒 Создание подмены</h2>
                    <p style="text-align: center; color: var(--text-muted); margin-bottom: 3rem;">
                        Заполните форму для создания подмены Steam профиля
                    </p>
                    <form id="substitution-form">
                        <div class="form-group">
                            <label class="form-label">Steam ID пользователя:</label>
                            <input type="text" id="steam-id" class="form-input" placeholder="76561198000000000" required>
                            <small style="color: var(--text-muted); margin-top: 0.5rem; display: block;">
                                Введите 17-значный Steam ID профиля
                            </small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Новый никнейм:</label>
                            <input type="text" id="nickname" class="form-input" placeholder="Введите новый никнейм" required>
                            <small style="color: var(--text-muted); margin-top: 0.5rem; display: block;">
                                Никнейм который будет отображаться вместо оригинального
                            </small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Ссылка на новый аватар (опционально):</label>
                            <input type="url" id="avatar-url" class="form-input" placeholder="https://example.com/avatar.jpg">
                            <small style="color: var(--text-muted); margin-top: 0.5rem; display: block;">
                                Если не указано, будет использован случайный аватар
                            </small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Уровень Steam (опционально):</label>
                            <input type="number" id="steam-level" class="form-input" placeholder="Например: 25" min="0" max="5000">
                            <small style="color: var(--text-muted); margin-top: 0.5rem; display: block;">
                                Уровень который будет отображаться в профиле
                            </small>
                        </div>
                        <button type="submit" class="btn btn-success" style="width: 100%;">
                            ✨ Создать подмену
                        </button>
                    </form>
                </div>
            </div>
        `;
        
        // Удаляем существующие страницы
        const pages = document.querySelectorAll('.page:not(#home-page)');
        pages.forEach(page => page.remove());
        
        // Добавляем страницу подмены
        document.body.insertAdjacentHTML('beforeend', substitutionPage);
        
        // Скрываем главную страницу
        document.getElementById('home-page').classList.remove('active');
        
        this.bindSubstitutionEvents();
    }
    
    bindSubstitutionEvents() {
        const substitutionForm = document.getElementById('substitution-form');
        if (substitutionForm) {
            substitutionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubstitution();
            });
        }
        
        // Валидация Steam ID в реальном времени
        const steamIdInput = document.getElementById('steam-id');
        if (steamIdInput) {
            steamIdInput.addEventListener('input', (e) => {
                this.validateSteamId(e.target);
            });
        }
    }
    
    validateSteamId(input) {
        const value = input.value;
        const isValid = /^765611980\d{8}$/.test(value) && value.length === 17;
        
        if (value.length > 0) {
            if (isValid) {
                input.style.borderColor = 'var(--accent-green)';
                input.style.boxShadow = '0 0 0 3px rgba(40, 167, 69, 0.25)';
            } else {
                input.style.borderColor = 'var(--accent-red)';
                input.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.25)';
            }
        } else {
            input.style.borderColor = '';
            input.style.boxShadow = '';
        }
    }
    
    async handleSubstitution() {
        const steamId = document.getElementById('steam-id').value;
        const nickname = document.getElementById('nickname').value;
        const avatarUrl = document.getElementById('avatar-url').value;
        const steamLevel = document.getElementById('steam-level').value;
        
        // Валидация Steam ID
        if (!/^765611980\d{8}$/.test(steamId)) {
            window.notifications?.error('Неверный формат Steam ID');
            return;
        }
        
        // Показываем индикатор загрузки
        const submitBtn = document.querySelector('#substitution-form button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '⏳ Создаем подмену...';
        submitBtn.disabled = true;
        
        try {
            // Имитация API запроса
            await this.simulateSubstitutionCreation({
                steamId,
                nickname,
                avatarUrl,
                steamLevel: steamLevel ? parseInt(steamLevel) : null
            });
            
            window.notifications?.success('Подмена успешно создана!');
            
            if (window.soundSystem) {
                window.soundSystem.playSuccess();
            }
            
            // Очищаем форму
            document.getElementById('substitution-form').reset();
            
            // Показываем результат
            this.showResult({
                steamId,
                nickname,
                avatarUrl,
                steamLevel
            });
            
        } catch (error) {
            window.notifications?.error('Ошибка создания подмены: ' + error.message);
            
            if (window.soundSystem) {
                window.soundSystem.playError();
            }
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
    
    async simulateSubstitutionCreation(data) {
        // Имитация API запроса с задержкой
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Имитация случайной ошибки (10% вероятность)
                if (Math.random() < 0.1) {
                    reject(new Error('Сервер временно недоступен'));
                } else {
                    resolve({
                        success: true,
                        id: Math.random().toString(36).substring(7),
                        createdAt: new Date().toISOString()
                    });
                }
            }, 2000);
        });
    }
    
    showResult(data) {
        const resultModal = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">✅ Подмена создана</h3>
                    <button onclick="window.modals.hide()" class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 2rem;">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">🎉</div>
                        <p style="color: var(--text-secondary); margin-bottom: 2rem;">
                            Подмена успешно создана и готова к использованию
                        </p>
                    </div>
                    
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 1.5rem; border-radius: var(--border-radius-lg); margin-bottom: 2rem;">
                        <h4 style="color: var(--accent-green); margin-bottom: 1rem;">📋 Детали подмены:</h4>
                        <div style="display: grid; gap: 0.5rem;">
                            <div><strong>Steam ID:</strong> <code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px;">${data.steamId}</code></div>
                            <div><strong>Никнейм:</strong> ${data.nickname}</div>
                            ${data.avatarUrl ? `<div><strong>Аватар:</strong> <a href="${data.avatarUrl}" target="_blank" style="color: var(--accent-blue);">Ссылка</a></div>` : ''}
                            ${data.steamLevel ? `<div><strong>Уровень:</strong> ${data.steamLevel}</div>` : ''}
                            <div><strong>Создано:</strong> ${new Date().toLocaleString('ru')}</div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; justify-content: center;">
                        <button onclick="window.modals.hide()" class="btn btn-primary">
                            👍 Отлично
                        </button>
                        <button onclick="window.substitutionModule.showSubstitutionForm(); window.modals.hide();" class="btn btn-secondary">
                            ➕ Создать еще
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        window.modals.show(resultModal);
    }
}

// Глобальная инициализация
window.substitutionModule = new SubstitutionModule();