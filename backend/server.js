// Главный скрипт
class App {
    constructor() {
        this.currentPage = 'home';
        this.updateCheckInterval = null;
        this.isUpdating = false;
        this.backendCheckInterval = null;
        this.init();
    }
    
    init() {
        console.log('🔧 Инициализация приложения');
        
        // Проверяем было ли недавнее обновление
        this.checkRecentUpdate();
        
        // Ждем инициализации API клиента
        if (!window.api) {
            console.log('⏳ Ожидаем инициализации API клиента...');
            setTimeout(() => this.init(), 100);
            return;
        }
        
        // Очищаем кеш браузера для GitHub API
        this.clearApiCache();
        
        this.setupEventListeners();
        this.updateBugReportLink();
        this.startUpdateMonitoring();
        this.checkBackendStatus();
    }
    
    // Проверка было ли недавнее обновление
    checkRecentUpdate() {
        try {
            const updateInfo = localStorage.getItem('rkm_update_detected');
            if (updateInfo) {
                const data = JSON.parse(updateInfo);
                const updateTime = new Date(data.timestamp);
                const now = new Date();
                const timeDiff = (now - updateTime) / 1000; // секунды
                
                console.log('🔍 Обнаружена информация о недавнем обновлении');
                console.log('⏰ Время обновления:', updateTime.toLocaleString());
                console.log('⏱️ Прошло времени:', Math.round(timeDiff), 'секунд');
                
                // Если обновление было менее 5 минут назад - проверяем backend более тщательно
                if (timeDiff < 300) { // 5 минут
                    console.log('🚨 Недавнее обновление! Переходим в режим ожидания backend');
                    this.isPostUpdateMode = true;
                    
                    // Очищаем флаг обновления
                    localStorage.removeItem('rkm_update_detected');
                    
                    // Сразу показываем страницу ожидания backend
                    this.showBackendWaitingPage(data.commit);
                    return;
                }
            }
        } catch (e) {
            console.log('⚠️ Ошибка проверки информации об обновлении:', e.message);
        }
        
        this.isPostUpdateMode = false;
    }
    
    // Страница ожидания backend после обновления
    showBackendWaitingPage(commit) {
        console.log('⏳ Показываем страницу ожидания backend после обновления');
        
        const config = window.RkMConfig?.github;
        const helpUrl = config ? config.getIssueUrl('helpBackend') : 'https://github.com/AmKilopa/RkM/issues/new?title=HBR';
        
        const commitMessage = commit.commit?.message || commit.message || 'Недавнее обновление';
        const authorName = commit.commit?.author?.name || commit.author?.name || 'Разработчик';
        const shortSha = (commit.sha || commit.id || 'unknown').substring(0, 7);
        
        document.body.innerHTML = `
            <button onclick="window.open('${config ? config.getIssueUrl('home') : '#'}', '_blank')" class="bug-report-btn">🐛 Нашёл баг</button>
            <button onclick="window.changelogModule?.show()" class="changelog-btn">📋 Логи обновлений</button>
            
            <div id="notifications-container" class="notifications-container"></div>
            <div id="modal-overlay" class="modal-overlay"></div>
            
            <div class="status-page backend-waiting-page">
                <div class="main-container">
                    <div class="status-icon pulsing">⚡</div>
                    <h1 class="main-title">🚀 Запуск сервера</h1>
                    <p class="waiting-message">Backend перезапускается после обновления...</p>
                    
                    <div class="commit-info">
                        <h3>🆕 Последнее обновление:</h3>
                        <div class="commit-message">${commitMessage}</div>
                        <div class="commit-details">
                            <span class="commit-author">👤 ${authorName}</span>
                        </div>
                        <div class="commit-sha">#${shortSha}</div>
                    </div>
                    
                    <div class="backend-status">
                        <div class="loading-spinner"></div>
                        <p class="loading-text" id="backend-status-text">Проверяем статус сервера...</p>
                        <p style="font-size: 0.9rem; color: #888; margin-top: 0.5rem;">Backend: https://rkm-9vui.onrender.com</p>
                    </div>
                    
                    <div class="waiting-info">
                        <p>🔄 Автопроверка каждые 5 секунд</p>
                        <p style="font-size: 0.9rem; color: #666;">Обычно запуск занимает 1-3 минуты</p>
                    </div>
                    
                    <div class="status-indicator">
                        <div class="pulse-dot waiting" id="status-dot"></div>
                        <span id="status-text">Ожидание запуска...</span>
                    </div>
                    
                    <div class="buttons-container" style="margin-top: 20px;">
                        <button onclick="window.location.reload()" class="main-btn secondary">
                            🔄 Обновить вручную
                        </button>
                        <button onclick="window.open('${helpUrl}', '_blank')" class="main-btn secondary">
                            📝 Сообщить о проблеме
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        this.reinitializeModules();
        this.startBackendWaitingCheck();
    }
    
    // Запуск проверки backend каждые 5 секунд
    startBackendWaitingCheck() {
        console.log('🔄 Запускаем интенсивную проверку backend каждые 5 секунд');
        
        let checkCount = 0;
        const maxChecks = 72; // 6 минут максимум (72 * 5 секунд)
        
        // Очищаем предыдущий интервал если есть
        if (this.backendCheckInterval) {
            clearInterval(this.backendCheckInterval);
        }
        
        // Первая проверка сразу
        this.checkBackendForWaiting(checkCount, maxChecks);
        
        // Затем каждые 5 секунд
        this.backendCheckInterval = setInterval(() => {
            checkCount++;
            this.checkBackendForWaiting(checkCount, maxChecks);
        }, 5000);
    }
    
    // Проверка backend в режиме ожидания
    async checkBackendForWaiting(checkCount, maxChecks) {
        console.log(`🔍 Проверка backend #${checkCount + 1}/${maxChecks}`);
        
        const statusText = document.getElementById('backend-status-text');
        const statusDot = document.getElementById('status-dot');
        const statusIndicator = document.getElementById('status-text');
        
        if (statusText) {
            statusText.textContent = `Проверка #${checkCount + 1} из ${maxChecks}...`;
        }
        
        try {
            const connected = await window.api.testConnection();
            
            if (connected) {
                console.log('✅ Backend запущен! Переходим к нормальной работе');
                
                // Обновляем статус
                if (statusText) statusText.textContent = 'Сервер запущен! Загружаем интерфейс...';
                if (statusDot) {
                    statusDot.className = 'pulse-dot online';
                }
                if (statusIndicator) statusIndicator.textContent = 'Сервер работает';
                
                // Показываем уведомление об успехе
                if (window.notifications) {
                    window.notifications.show('✅ Сервер запущен! Загружаем интерфейс...', 'success', 3000);
                }
                
                // Звуковое уведомление об успехе
                if (window.soundSystem) {
                    window.soundSystem.playSuccess();
                }
                
                // Очищаем интервал
                if (this.backendCheckInterval) {
                    clearInterval(this.backendCheckInterval);
                    this.backendCheckInterval = null;
                }
                
                // Через 2 секунды перезагружаем страницу для нормальной работы
                setTimeout(() => {
                    console.log('🔄 Перезагружаем страницу для нормальной работы');
                    window.location.reload();
                }, 2000);
                
                return;
            }
            
        } catch (error) {
            console.log(`❌ Проверка #${checkCount + 1} не удалась:`, error.message);
        }
        
        // Backend еще не готов
        console.log(`⏳ Backend еще не готов. Попытка ${checkCount + 1} из ${maxChecks}`);
        
        if (statusDot) {
            statusDot.className = 'pulse-dot waiting';
        }
        
        // Если достигли максимума проверок
        if (checkCount >= maxChecks - 1) {
            console.log('⚠️ Превышено максимальное время ожидания backend');
            
            if (statusText) statusText.textContent = 'Время ожидания истекло. Возможны проблемы с сервером.';
            if (statusDot) {
                statusDot.className = 'pulse-dot offline';
            }
            if (statusIndicator) statusIndicator.textContent = 'Проблемы с сервером';
            
            // Очищаем интервал
            if (this.backendCheckInterval) {
                clearInterval(this.backendCheckInterval);
                this.backendCheckInterval = null;
            }
            
            // Показываем уведомление о проблеме
            if (window.notifications) {
                window.notifications.show('⚠️ Сервер не отвечает. Попробуйте обновить страницу или обратитесь за помощью.', 'error', 0);
            }
            
            // Переходим к обычной offline странице
            setTimeout(() => {
                this.showOfflinePage();
            }, 3000);
        }
    }
    
    // Очистка кеша API для предотвращения проблем
    clearApiCache() {
        try {
            // Очищаем sessionStorage от старых данных
            const keysToRemove = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && key.includes('github') || key && key.includes('api')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => sessionStorage.removeItem(key));
            
            console.log('🧹 Кеш API очищен');
        } catch (e) {
            console.log('⚠️ Не удалось очистить кеш:', e.message);
        }
    }
    
    setupEventListeners() {
        document.getElementById('inventory-btn')?.addEventListener('click', () => {
            if (!this.isDisabled('inventory-btn')) {
                this.navigateTo('inventory');
            }
        });
        
        document.getElementById('friend-error-btn')?.addEventListener('click', () => {
            if (!this.isDisabled('friend-error-btn')) {
                this.navigateTo('friend-error');
            }
        });
        
        document.getElementById('substitution-btn')?.addEventListener('click', () => {
            this.navigateTo('substitution');
        });
        
        document.getElementById('changelog-btn')?.addEventListener('click', () => {
            this.showChangelog();
        });
    }
    
    isDisabled(buttonId) {
        return document.getElementById(buttonId)?.classList.contains('disabled');
    }
    
    navigateTo(page) {
        this.currentPage = page;
        this.updateBugReportLink();
        
        if (page === 'substitution') {
            window.substitutionModule.show();
        }
    }
    
    updateBugReportLink() {
        const bugBtn = document.getElementById('bug-report-btn');
        if (!bugBtn) return;
        
        const config = window.RkMConfig?.github;
        if (!config) return;
        
        const links = {
            'home': config.getIssueUrl('home'),
            'inventory': config.getIssueUrl('inventory'),
            'friend-error': config.getIssueUrl('friendError'),
            'substitution': config.getIssueUrl('substitution')
        };
        
        bugBtn.onclick = () => window.open(links[this.currentPage], '_blank');
    }
    
    showHomePage() {
        const pages = document.querySelectorAll('.page:not(#home-page)');
        pages.forEach(page => page.remove());
        
        const homePage = document.getElementById('home-page');
        if (homePage) {
            homePage.classList.add('active');
        }
        
        this.currentPage = 'home';
        this.updateBugReportLink();
    }
    
    showChangelog() {
        if (window.changelogModule) {
            window.changelogModule.show();
        } else {
            window.notifications?.error('Модуль логов недоступен');
        }
    }
    
    startUpdateMonitoring() {
        console.log('🔧 Инициализация мониторинга обновлений');
        console.log('🔗 Backend URL:', window.api?.baseUrl || 'не определен');
        
        // Очищаем localStorage от старых данных для предотвращения проблем
        try {
            const oldCommit = localStorage.getItem('rkm_last_commit');
            console.log('🔄 Запуск мониторинга через backend, последний коммит:', oldCommit ? oldCommit.substring(0, 7) : 'none');
        } catch (e) {
            console.log('⚠️ Проблемы с localStorage, используем временное хранение');
        }
        
        // Проверяем обновления каждые 30 секунд (для быстрой реакции на webhook)
        this.updateCheckInterval = setInterval(() => {
            this.checkForUpdates();
        }, 30000); // 30 секунд
        
        // Первая проверка через 5 секунд
        setTimeout(() => {
            this.checkForUpdates();
        }, 5000);
        
        console.log('⏰ Мониторинг настроен: проверка через backend каждые 30 секунд, первая через 5 секунд');
    }
    
    async checkForUpdates() {
        if (this.isUpdating) {
            console.log('🔄 Уже в процессе обновления, пропускаем проверку');
            return;
        }
        
        console.log('🔍 Проверяем обновления через backend...');
        console.log('🕐 Время проверки:', new Date().toLocaleTimeString());
        
        try {
            // Проверяем обновления через backend
            const result = await window.api.checkForUpdates();
            
            console.log('📊 Полный ответ backend:', JSON.stringify(result, null, 2));
            
            if (result && result.success && result.hasUpdate) {
                console.log('🆕 BACKEND СООБЩАЕТ О НОВОМ ОБНОВЛЕНИИ!');
                console.log('📝 Данные коммита:', result.latestCommit);
                console.log('🔔 Источник:', result.source);
                
                // Сохраняем информацию о том что обновление обнаружено
                try {
                    localStorage.setItem('rkm_update_detected', JSON.stringify({
                        timestamp: new Date().toISOString(),
                        commit: result.latestCommit
                    }));
                } catch (e) {
                    console.log('⚠️ Не удалось сохранить информацию об обновлении');
                }
                
                this.handleNewUpdate(result.latestCommit);
                return;
            } else if (result && result.success) {
                console.log('✅ Новых обновлений нет');
                console.log('📝 Текущий коммит:', result.latestCommit?.sha?.substring(0, 7) || 'unknown');
                console.log('🔔 Источник:', result.source);
            } else {
                console.log('⚠️ Backend не смог проверить обновления:', result?.error || 'unknown error');
            }
            
        } catch (error) {
            console.log('❌ Ошибка проверки обновлений через backend:', error.message);
            
            // Если API эндпоинт не найден (404), используем fallback на GitHub
            if (error.message.includes('404')) {
                console.log('🔄 API эндпоинт не найден, переходим на проверку GitHub напрямую');
                await this.checkForUpdatesGitHub();
                return;
            }
            
            // При других ошибках backend увеличиваем интервал проверки
            if (this.updateCheckInterval) {
                clearInterval(this.updateCheckInterval);
            }
            
            console.log('🔄 Перезапуск мониторинга через 15 минут из-за ошибки backend');
            this.updateCheckInterval = setInterval(() => {
                this.checkForUpdates();
            }, 900000); // 15 минут при ошибках
        }
    }
    
    // Fallback проверка через GitHub (если API не реализован)
    async checkForUpdatesGitHub() {
        console.log('🔍 Fallback: проверяем GitHub напрямую...');
        
        const config = window.RkMConfig?.github;
        if (!config) {
            console.log('❌ Конфигурация GitHub не найдена');
            return;
        }
        
        try {
            const timestamp = Date.now();
            const randomParam = Math.random().toString(36).substring(7);
            const url = `${config.apiUrl}/commits?per_page=1&_t=${timestamp}&_r=${randomParam}`;
            
            console.log('📡 Fallback запрос к GitHub API:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                cache: 'no-store'
            });
            
            console.log(`📊 GitHub API ответ: ${response.status} ${response.statusText}`);
            
            if (response.status === 403) {
                console.log('⚠️ GitHub rate limit, останавливаем fallback проверки');
                return;
            }
            
            if (response.status === 404) {
                console.log('❌ GitHub репозиторий не найден');
                return;
            }
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            const commits = await response.json();
            
            if (commits && commits[0]) {
                const latestCommit = commits[0];
                console.log('📌 Последний коммит (GitHub):', latestCommit.sha.substring(0, 7));
                
                let storedCommit = null;
                try {
                    storedCommit = localStorage.getItem('rkm_last_commit');
                } catch (e) {
                    storedCommit = sessionStorage.getItem('rkm_last_commit');
                }
                
                console.log('💾 Сохраненный коммит:', storedCommit ? storedCommit.substring(0, 7) : 'none');
                
                if (storedCommit && storedCommit !== latestCommit.sha) {
                    console.log('🆕 НАЙДЕН НОВЫЙ КОММИТ! (через GitHub fallback)');
                    this.handleNewUpdate(latestCommit);
                    return;
                } else if (!storedCommit) {
                    try {
                        localStorage.setItem('rkm_last_commit', latestCommit.sha);
                    } catch (e) {
                        sessionStorage.setItem('rkm_last_commit', latestCommit.sha);
                    }
                    console.log('📋 Первый запуск - сохранен коммит (GitHub)');
                } else {
                    console.log('✅ Новых коммитов нет (GitHub)');
                }
            }
            
        } catch (error) {
            console.log('❌ Ошибка fallback проверки GitHub:', error.message);
        }
    }
    
    handleNewUpdate(commit) {
        console.log('🚀 НАЧИНАЕМ ПРОЦЕДУРУ ОБНОВЛЕНИЯ (данные от backend)');
        console.log('📝 Коммит:', commit.sha?.substring(0, 7) || 'unknown', '-', commit.commit?.message || commit.message || 'no message');
        
        this.isUpdating = true;
        
        // Полностью останавливаем мониторинг
        if (this.updateCheckInterval) {
            clearInterval(this.updateCheckInterval);
            this.updateCheckInterval = null;
            console.log('⏹️ Мониторинг остановлен');
        }
        
        console.log('⏰ Показываем 5-секундное предупреждение...');
        
        this.showUpdateWarning(() => {
            console.log('✅ Предупреждение завершено, показываем страницу обновления');
            this.showUpdatePage(commit);
        });
    }
    
    showUpdateWarning(callback) {
        console.log('⚠️ Показываем предупреждение об обновлении');
        
        let countdown = 5;
        
        const notificationId = window.notifications?.show(
            this.createCountdownHTML(countdown),
            'warning',
            0 // Не исчезает автоматически
        );
        
        console.log('📢 ID уведомления:', notificationId);
        
        // Звуковое предупреждение
        if (window.soundSystem) {
            console.log('🔊 Воспроизводим звук предупреждения');
            window.soundSystem.playWarning();
        }
        
        // Обновляем таймер каждую секунду
        const timer = setInterval(() => {
            countdown--;
            console.log('⏰ Обратный отсчет:', countdown);
            
            const notification = document.getElementById(notificationId);
            if (notification) {
                const textEl = notification.querySelector('.notification-text');
                if (textEl) {
                    textEl.innerHTML = this.createCountdownHTML(countdown);
                }
            } else {
                console.log('⚠️ Уведомление не найдено в DOM');
            }
            
            if (countdown <= 0) {
                clearInterval(timer);
                console.log('⏰ Обратный отсчет завершен');
                
                // Скрываем уведомление
                if (notificationId) {
                    window.notifications?.hide(notificationId);
                    console.log('🗑️ Уведомление скрыто');
                }
                
                // Выполняем callback
                console.log('▶️ Выполняем callback');
                callback();
            }
        }, 1000);
    }
    
    createCountdownHTML(seconds) {
        return `
            <div style="text-align: center; font-size: 1.1rem;">
                <div style="font-weight: bold; margin-bottom: 8px;">🔄 Обновление сайта</div>
                <div style="color: #ccc; margin-bottom: 8px;">Сайт будет перезапущен через:</div>
                <div style="font-size: 2rem; color: #ffc107; font-weight: bold; margin: 8px 0;">${seconds}</div>
                <div style="color: #888; font-size: 0.9rem;">Подготовьтесь к перезагрузке страницы</div>
            </div>
        `;
    }
    
    showUpdatePage(commit) {
        console.log('📄 Создаем страницу обновления (данные от backend)');
        
        // Сохраняем новый коммит
        const commitSha = commit.sha || commit.id || 'unknown';
        try {
            localStorage.setItem('rkm_last_commit', commitSha);
            console.log('💾 Новый коммит сохранен в localStorage');
        } catch (e) {
            sessionStorage.setItem('rkm_last_commit', commitSha);
            console.log('💾 Новый коммит сохранен в sessionStorage (fallback)');
        }
        
        // ВАЖНО: Сохраняем информацию об обновлении для проверки после перезагрузки
        try {
            const updateInfo = {
                timestamp: new Date().toISOString(),
                commit: {
                    sha: commitSha,
                    message: commit.commit?.message || commit.message || 'Обновление получено от backend',
                    author: {
                        name: commit.commit?.author?.name || commit.author?.name || 'Backend',
                        date: commit.commit?.author?.date || commit.author?.date || new Date().toISOString()
                    }
                }
            };
            
            localStorage.setItem('rkm_update_detected', JSON.stringify(updateInfo));
            console.log('💾 Информация об обновлении сохранена для проверки после перезагрузки');
        } catch (e) {
            console.log('⚠️ Не удалось сохранить информацию об обновлении');
        }
        
        // Обработка данных коммита от backend
        const commitMessage = commit.commit?.message || commit.message || 'Обновление получено от backend';
        const authorName = commit.commit?.author?.name || commit.author?.name || 'Backend';
        const authorDate = commit.commit?.author?.date || commit.author?.date || new Date().toISOString();
        const shortSha = commitSha.substring(0, 7);
        
        document.body.innerHTML = `
            <button onclick="window.open('https://github.com/AmKilopa/RkM/issues/new?title=HPR', '_blank')" class="bug-report-btn">🐛 Нашёл баг</button>
            <button onclick="window.changelogModule?.show()" class="changelog-btn">📋 Логи обновлений</button>
            
            <div id="notifications-container" class="notifications-container"></div>
            <div id="modal-overlay" class="modal-overlay"></div>
            
            <div class="status-page update-page">
                <div class="main-container">
                    <div class="status-icon rotating">🔄</div>
                    <h1 class="main-title">Обновление сайта</h1>
                    <p class="update-message">🎵 Применяем последние изменения...</p>
                    
                    <div class="commit-info">
                        <h3>🆕 Последний коммит:</h3>
                        <div class="commit-message">${commitMessage}</div>
                        <div class="commit-details">
                            <span class="commit-author">👤 ${authorName}</span>
                            <span class="commit-date">📅 ${new Date(authorDate).toLocaleString('ru')}</span>
                        </div>
                        <div class="commit-sha">#${shortSha}</div>
                    </div>
                    
                    <div class="loading-section">
                        <div class="loading-spinner"></div>
                        <p class="loading-text">Воспроизводим мелодию обновления...</p>
                        <p style="font-size: 0.9rem; color: #888; margin-top: 0.5rem;">Обновление получено через backend</p>
                        <p style="font-size: 0.8rem; color: #666; margin-top: 0.5rem;">После перезагрузки будет проверен статус backend</p>
                    </div>
                    
                    <div class="auto-refresh">
                        🎵 Сайт автоматически перезагрузится через <span id="countdown">30</span> секунд
                    </div>
                </div>
            </div>
        `;
        
        console.log('🔄 Переинициализируем модули');
        this.reinitializeModules();
        
        // СРАЗУ запускаем зацикленную мелодию
        let melodyIntervalId = null;
        if (window.soundSystem) {
            console.log('🎵 Запускаем зацикленную мелодию обновления');
            melodyIntervalId = window.soundSystem.startLoopingUpdateMelody();
        } else {
            console.log('⚠️ Система звуков недоступна');
        }
        
        // Запускаем 30-секундный таймер
        console.log('⏲️ Запускаем 30-секундный таймер перезагрузки');
        this.startSimpleCountdown(30, melodyIntervalId);
    }
    
    // Тестовая функция для проверки системы обновления
    testUpdateSystem() {
        console.log('🧪 ТЕСТИРОВАНИЕ СИСТЕМЫ ОБНОВЛЕНИЯ (через backend)');
        
        const fakeCommit = {
            sha: 'test1234567890abcdef',
            commit: {
                message: 'Тестовое обновление для проверки системы через backend',
                author: {
                    name: 'Backend Test',
                    date: new Date().toISOString()
                }
            }
        };
        
        this.handleNewUpdate(fakeCommit);
    }
    
    startSimpleCountdown(seconds, melodyIntervalId = null) {
        let remaining = seconds;
        const countdownEl = document.getElementById('countdown');
        
        const timer = setInterval(() => {
            remaining--;
            if (countdownEl) {
                countdownEl.textContent = remaining;
            }
            
            if (remaining <= 0) {
                clearInterval(timer);
                
                if (melodyIntervalId && window.soundSystem) {
                    window.soundSystem.stopLoopingMelody(melodyIntervalId);
                }
                
                console.log('⏰ Время ожидания истекло, перезагружаем страницу');
                window.location.reload();
            }
        }, 1000);
    }
    
    async checkBackendStatus() {
        // Пропускаем проверку если мы в режиме ожидания после обновления
        if (this.isPostUpdateMode) {
            console.log('⏳ Режим ожидания backend после обновления - пропускаем стандартную проверку');
            return;
        }
        
        console.log('🏥 Проверяем статус backend:', window.api?.baseUrl || 'URL не определен');
        
        try {
            const connected = await window.api.testConnection();
            if (!connected) {
                console.log('❌ Backend недоступен, показываем offline страницу');
                this.showOfflinePage();
            } else {
                console.log('✅ Backend доступен и работает');
            }
        } catch (error) {
            console.log('❌ Ошибка при проверке backend:', error.message);
            this.showOfflinePage();
        }
    }
    
    showOfflinePage() {
        const config = window.RkMConfig?.github;
        const helpUrl = config ? config.getIssueUrl('helpBackend') : 'https://github.com/AmKilopa/RkM/issues/new?title=HBR';
        
        console.log('📴 Показываем offline страницу (backend недоступен)');
        
        document.body.innerHTML = `
            <button onclick="window.open('${config ? config.getIssueUrl('home') : '#'}', '_blank')" class="bug-report-btn">🐛 Нашёл баг</button>
            <button onclick="window.changelogModule?.show()" class="changelog-btn">📋 Логи обновлений</button>
            
            <div id="notifications-container" class="notifications-container"></div>
            <div id="modal-overlay" class="modal-overlay"></div>
            
            <div class="status-page offline-page">
                <div class="main-container">
                    <h1 class="main-title">📡 Сервер недоступен</h1>
                    <p class="offline-message">Backend сервер не отвечает</p>
                    
                    <div class="offline-content">
                        <div class="offline-info">
                            <p>Backend: https://rkm-9vui.onrender.com</p>
                            <p>Если сайт долго не работает, вы можете подать просьбу</p>
                        </div>
                        
                        <div class="buttons-container">
                            <button onclick="window.location.reload()" class="main-btn">
                                🔄 Попробовать снова
                            </button>
                            <button onclick="window.open('${helpUrl}', '_blank')" class="main-btn">
                                📝 Подать просьбу
                            </button>
                        </div>
                    </div>
                    
                    <div class="status-indicator">
                        <div class="pulse-dot offline"></div>
                        <span>Автопроверка каждые 10 секунд</span>
                    </div>
                </div>
            </div>
        `;
        
        this.reinitializeModules();
        
        // Проверяем каждые 10 секунд в обычном offline режиме
        setInterval(async () => {
            console.log('🔄 Автопроверка backend...');
            const connected = await window.api.testConnection();
            if (connected) {
                console.log('✅ Backend восстановлен, перезагружаем страницу');
                window.location.reload();
            }
        }, 10000);
    }
    
    reinitializeModules() {
        if (window.notifications) {
            window.notifications.updateContainer();
        }
        if (window.modals) {
            window.modals.setupEventListeners();
        }
        if (window.buttonSounds) {
            window.buttonSounds.addSoundsToButtons();
        }
    }
    
    // Очистка интервалов при уничтожении
    destroy() {
        if (this.updateCheckInterval) {
            clearInterval(this.updateCheckInterval);
            this.updateCheckInterval = null;
        }
        if (this.backendCheckInterval) {
            clearInterval(this.backendCheckInterval);
            this.backendCheckInterval = null;
        }
    }
}