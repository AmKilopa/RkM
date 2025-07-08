// === ГЛАВНЫЙ СКРИПТ ПРИЛОЖЕНИЯ ===
class App {
    constructor() {
        this.currentPage = 'home';
        this.updateCheckInterval = null;
        this.isUpdating = false;
        this.init();
    }
    
    init() {
        if (!window.api) {
            setTimeout(() => this.init(), 100);
            return;
        }
        
        this.showUpdateNotification();
        this.clearApiCache();
        this.setupEventListeners();
        this.updateBugReportLink();
        this.startUpdateMonitoring();
        this.checkBackendStatus();
    }
    
    showUpdateNotification() {
        try {
            const updateInfo = localStorage.getItem('rkm_update_detected');
            if (updateInfo) {
                localStorage.removeItem('rkm_update_detected');
                
                setTimeout(() => {
                    if (window.notifications) {
                        window.notifications.success('✅ Сайт успешно обновлён!', 5000);
                    } else {
                        // Если система уведомлений не загружена, загружаем её
                        const script = document.createElement('script');
                        script.src = 'js/notifications.js';
                        script.onload = () => {
                            if (window.notifications) {
                                window.notifications.success('✅ Сайт успешно обновлён!', 5000);
                            }
                        };
                        document.head.appendChild(script);
                    }
                }, 1000);
            }
        } catch (e) {
            // Игнорируем ошибки localStorage
        }
    }
    
    clearApiCache() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && (key.includes('github') || key.includes('api'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => sessionStorage.removeItem(key));
        } catch (e) {
            // Игнорируем ошибки
        }
    }
    
    setupEventListeners() {
        document.getElementById('inventory-btn')?.addEventListener('click', () => {
            if (!this.isDisabled('inventory-btn')) {
                this.navigateTo('inventory');
            } else {
                this.showDisabledFeatureMessage('inventory');
            }
        });
        
        document.getElementById('friend-error-btn')?.addEventListener('click', () => {
            if (!this.isDisabled('friend-error-btn')) {
                this.navigateTo('friend-error');
            } else {
                this.showDisabledFeatureMessage('friend-error');
            }
        });
        
        document.getElementById('substitution-btn')?.addEventListener('click', () => {
            this.navigateTo('substitution');
        });
        
        document.getElementById('changelog-btn')?.addEventListener('click', () => {
            this.showChangelog();
        });

        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.showSettings();
        });
        
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('back-btn')) {
                this.showHomePage();
            }
        });
        
        document.addEventListener('keydown', (e) => {            
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.checkForUpdates();
            }
        });
    }
    
    isDisabled(buttonId) {
        return document.getElementById(buttonId)?.classList.contains('disabled');
    }
    
    navigateTo(page) {
        this.currentPage = page;
        this.updateBugReportLink();
        
        if (window.soundSystem) {
            window.soundSystem.playInterface();
        }
        
        switch (page) {
            case 'substitution':
                if (window.substitutionModule) {
                    window.substitutionModule.show();
                } else {
                    this.loadModule('substitution');
                }
                break;
            case 'inventory':
                if (window.inventoryModule) {
                    window.inventoryModule.show();
                } else {
                    this.loadModule('inventory');
                }
                break;
            case 'friend-error':
                if (window.friendErrorModule) {
                    window.friendErrorModule.show();
                } else {
                    this.loadModule('friend-error');
                }
                break;
        }
    }
    
    async loadModule(moduleName) {
        try {
            const script = document.createElement('script');
            script.src = `js/modules/${moduleName}.js`;
            script.onload = () => {
                this.navigateTo(moduleName);
            };
            script.onerror = () => {
                window.notifications?.error(`Ошибка загрузки модуля ${moduleName}`);
            };
            document.head.appendChild(script);
        } catch (error) {
            window.notifications?.error(`Ошибка загрузки модуля ${moduleName}`);
        }
    }
    
    showDisabledFeatureMessage(feature) {
        const messages = {
            'inventory': 'Функция "Узнать стоимость инвентаря" находится в разработке',
            'friend-error': 'Функция "Friend ошибка" находится в разработке'
        };
        
        window.notifications?.warning(messages[feature] || 'Функция в разработке');
        
        if (window.soundSystem) {
            window.soundSystem.playWarning();
        }
    }

    showSettings() {
        if (document.querySelector('.settings-modal')) {
            return;
        }
        
        if (window.settings) {
            window.settings.openSettings();
        } else {
            window.notifications?.error('Модуль настроек недоступен');
        }
        
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
        
        bugBtn.onclick = () => {
            window.open(links[this.currentPage], '_blank');
            if (window.soundSystem) {
                window.soundSystem.playInterface();
            }
        };
    }
    
    showHomePage() {
        const pages = document.querySelectorAll('.page:not(#home-page)');
        pages.forEach(page => {
            page.style.opacity = '0';
            page.style.transform = 'translateY(-20px)';
            setTimeout(() => page.remove(), 300);
        });
        
        const homePage = document.getElementById('home-page');
        if (homePage) {
            homePage.classList.add('active');
            homePage.style.opacity = '1';
            homePage.style.transform = 'translateY(0)';
        }
        
        this.currentPage = 'home';
        this.updateBugReportLink();
        
        if (window.soundSystem) {
            window.soundSystem.playInterface();
        }
    }
    
    showChangelog() {
        if (window.changelogModule) {
            window.changelogModule.show();
        } else {
            window.notifications?.error('Модуль логов недоступен');
        }
        
        if (window.soundSystem) {
            window.soundSystem.playInterface();
        }
    }
    
    startUpdateMonitoring() {
        const checkInterval = window.RkMConfig?.intervals?.updateCheck || 30000;
        this.updateCheckInterval = setInterval(() => {
            this.checkForUpdates();
        }, checkInterval);
        
        setTimeout(() => {
            this.checkForUpdates();
        }, 2000);
    }
    
    async checkForUpdates() {
        if (this.isUpdating) return;
        
        try {
            const result = await window.api.checkForUpdates();
            
            if (result && result.success && result.hasUpdate) {
                console.log('☑️ Обновление получено');
                
                try {
                    localStorage.setItem('rkm_update_detected', JSON.stringify({
                        timestamp: new Date().toISOString(),
                        commit: result.latestCommit
                    }));
                } catch (e) {
                    // Игнорируем ошибки localStorage
                }
                
                this.handleNewUpdate(result.latestCommit);
                return;
            }
            
        } catch (error) {
            if (error.message.includes('404')) {
                await this.checkForUpdatesGitHub();
                return;
            }
            
            if (this.updateCheckInterval) {
                clearInterval(this.updateCheckInterval);
            }
            
            this.updateCheckInterval = setInterval(() => {
                this.checkForUpdates();
            }, 900000);
        }
    }
    
    async checkForUpdatesGitHub() {
        const config = window.RkMConfig?.github;
        if (!config) return;
        
        try {
            const timestamp = Date.now();
            const randomParam = Math.random().toString(36).substring(7);
            const url = `${config.apiUrl}/commits?per_page=1&_t=${timestamp}&_r=${randomParam}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.status === 403 || response.status === 404 || !response.ok) {
                return;
            }
            
            const commits = await response.json();
            
            if (commits && commits[0]) {
                const latestCommit = commits[0];
                
                // Отладочная информация
                console.log('GitHub API коммит:', {
                    sha: latestCommit.sha,
                    commit_author_name: latestCommit.commit?.author?.name,
                    author_login: latestCommit.author?.login,
                    author_avatar: latestCommit.author?.avatar_url,
                    message: latestCommit.commit?.message
                });
                
                let storedCommit = null;
                try {
                    storedCommit = localStorage.getItem('rkm_last_commit');
                } catch (e) {
                    storedCommit = sessionStorage.getItem('rkm_last_commit');
                }
                
                if (storedCommit && storedCommit !== latestCommit.sha) {
                    console.log('☑️ Обновление получено');
                    
                    try {
                        localStorage.setItem('rkm_update_detected', JSON.stringify({
                            timestamp: new Date().toISOString(),
                            commit: latestCommit.sha,
                            message: latestCommit.commit.message,
                            author: latestCommit.author?.login || latestCommit.commit.author.name
                        }));
                    } catch (e) {
                        sessionStorage.setItem('rkm_update_detected', JSON.stringify({
                            timestamp: new Date().toISOString(),
                            commit: latestCommit.sha,
                            message: latestCommit.commit.message,
                            author: latestCommit.author?.login || latestCommit.commit.author.name
                        }));
                    }
                    
                    this.handleNewUpdate(latestCommit);
                    return;
                } else if (!storedCommit) {
                    try {
                        localStorage.setItem('rkm_last_commit', latestCommit.sha);
                    } catch (e) {
                        sessionStorage.setItem('rkm_last_commit', latestCommit.sha);
                    }
                }
            }
            
        } catch (error) {
            // Тихо игнорируем ошибки
        }
    }
    
    handleNewUpdate(commit) {
        this.isUpdating = true;
        
        if (this.updateCheckInterval) {
            clearInterval(this.updateCheckInterval);
            this.updateCheckInterval = null;
        }
        
        // Отладочная информация о получаемом коммите
        console.log('Обрабатываем обновление, тип коммита:', typeof commit, commit);
        
        this.showUpdatePage(commit);
    }
    
    showUpdatePage(commit) {
        const commitSha = commit.sha || commit.id || 'unknown';
        try {
            localStorage.setItem('rkm_last_commit', commitSha);
        } catch (e) {
            sessionStorage.setItem('rkm_last_commit', commitSha);
        }
        
        // Правильное извлечение данных коммита
        const commitMessage = commit.commit?.message || commit.message || 'Обновление получено';
        const authorName = commit.commit?.author?.name || commit.author?.username || commit.author?.login || 'Разработчик';
        const authorDate = commit.commit?.author?.date || commit.author?.date || new Date().toISOString();
        
        // Безопасное получение аватарки
        let authorAvatar = 'https://github.com/identicons/app.png'; // Запасной вариант
        if (commit.author?.avatar_url) {
            authorAvatar = commit.author.avatar_url;
        } else if (commit.committer?.avatar_url) {
            authorAvatar = commit.committer.avatar_url;
        }
        
        const shortSha = commitSha.substring(0, 7);
        
        // Показываем уведомление об обновлении
        setTimeout(() => {
            if (window.notifications) {
                window.notifications.warning('🔄 Найдено обновление! Сайт будет перезагружен через 5 секунд', 6000);
            } else {
                // Простое уведомление через alert если система уведомлений недоступна
                console.log('🔔 Система уведомлений недоступна, используем консоль');
                console.log('🔄 Найдено обновление! Сайт будет перезагружен через 5 секунд');
            }
        }, 500);
        
        // Отладочная информация
        console.log('Данные коммита:', {
            'Полный объект': commit,
            'SHA': commitSha,
            'Сообщение': commitMessage,
            'Автор (итоговый)': authorName,
            'Аватарка': authorAvatar,
            'Дата': authorDate,
            'commit.commit.author.name': commit.commit?.author?.name,
            'commit.author.login': commit.author?.login,
            'commit.author.username': commit.author?.username
        });
        
        document.body.innerHTML = `
            <div id="notifications-container" class="notifications-container"></div>
            <div id="modal-overlay" class="modal-overlay"></div>
            
            <div class="update-page">
                <div class="update-background">
                    <div class="animated-circle"></div>
                    <div class="floating-particles"></div>
                </div>
                
                <div class="update-container">
                    <div class="update-icon-wrapper">
                        <div class="rotating-ring"></div>
                        <div class="update-icon">🔄</div>
                    </div>
                    
                    <h1 class="update-title">Обновление сайта</h1>
                    <p class="update-subtitle">Применяем последние изменения...</p>
                    
                    <div class="commit-card">
                        <div class="commit-header">
                            <div class="commit-badge">#${shortSha}</div>
                            <div class="commit-time">${new Date(authorDate).toLocaleString('ru')}</div>
                        </div>
                        
                        <div class="commit-content">
                            <div class="commit-message">${commitMessage}</div>
                            
                            <div class="commit-author">
                                <img src="${authorAvatar}" alt="${authorName}" class="author-avatar" onerror="this.src='https://github.com/identicons/app.png'">
                                <span class="author-name">${authorName}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="progress-section">
                        <div class="progress-bar">
                            <div class="progress-fill"></div>
                        </div>
                        <div class="progress-text">Подготовка к перезагрузке...</div>
                    </div>
                    
                    <div class="countdown-wrapper">
                        <span class="countdown-text">Автоматическая перезагрузка через</span>
                        <span class="countdown-number" id="countdown">5</span>
                        <span class="countdown-unit">секунд</span>
                    </div>
                </div>
            </div>
            
            <style>
                .update-page {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d1421 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    overflow: hidden;
                    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif;
                }
                
                .update-background {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    z-index: -1;
                }
                
                .animated-circle {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 600px;
                    height: 600px;
                    border-radius: 50%;
                    background: radial-gradient(circle at center, 
                        rgba(0, 123, 255, 0.15) 0%, 
                        rgba(40, 167, 69, 0.1) 40%, 
                        transparent 70%);
                    animation: pulseGlow 4s ease-in-out infinite;
                }
                
                @keyframes pulseGlow {
                    0%, 100% { 
                        transform: translate(-50%, -50%) scale(1); 
                        opacity: 0.6; 
                    }
                    50% { 
                        transform: translate(-50%, -50%) scale(1.1); 
                        opacity: 1; 
                    }
                }
                
                .floating-particles {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    background: 
                        radial-gradient(2px 2px at 20px 30px, rgba(0, 123, 255, 0.3), transparent),
                        radial-gradient(2px 2px at 40px 70px, rgba(40, 167, 69, 0.3), transparent),
                        radial-gradient(1px 1px at 90px 40px, rgba(255, 193, 7, 0.3), transparent),
                        radial-gradient(1px 1px at 130px 80px, rgba(220, 53, 69, 0.3), transparent);
                    background-repeat: repeat;
                    background-size: 200px 200px;
                    animation: float 20s linear infinite;
                }
                
                @keyframes float {
                    from { transform: translate3d(0, 0, 0); }
                    to { transform: translate3d(-200px, -200px, 0); }
                }
                
                .update-container {
                    text-align: center;
                    max-width: 600px;
                    padding: 3rem;
                    background: rgba(26, 26, 26, 0.8);
                    border-radius: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px);
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                }
                
                .update-icon-wrapper {
                    position: relative;
                    width: 120px;
                    height: 120px;
                    margin: 0 auto 2rem;
                }
                
                .rotating-ring {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    border: 3px solid transparent;
                    border-top: 3px solid #007bff;
                    border-right: 3px solid #28a745;
                    border-radius: 50%;
                    animation: spin 2s linear infinite;
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .update-icon {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 3rem;
                    animation: bounce 1.5s ease-in-out infinite;
                }
                
                @keyframes bounce {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); }
                    50% { transform: translate(-50%, -50%) scale(1.1); }
                }
                
                .update-title {
                    font-size: 2.5rem;
                    font-weight: 300;
                    color: #ffffff;
                    margin-bottom: 1rem;
                    background: linear-gradient(45deg, #007bff, #28a745);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .update-subtitle {
                    font-size: 1.2rem;
                    color: #ccc;
                    margin-bottom: 3rem;
                }
                
                .commit-card {
                    background: rgba(42, 42, 42, 0.8);
                    border-radius: 16px;
                    padding: 2rem;
                    margin: 2rem 0;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    text-align: left;
                }
                
                .commit-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                
                .commit-badge {
                    background: linear-gradient(45deg, #ffc107, #e0a800);
                    color: #000;
                    padding: 6px 14px;
                    border-radius: 20px;
                    font-family: 'Courier New', monospace;
                    font-weight: bold;
                    font-size: 0.9rem;
                }
                
                .commit-time {
                    color: #888;
                    font-size: 0.9rem;
                }
                
                .commit-content {
                    text-align: left;
                }
                
                .commit-message {
                    color: #ffffff;
                    font-size: 1.1rem;
                    line-height: 1.5;
                    margin-bottom: 1rem;
                    word-wrap: break-word;
                }
                
                .commit-author {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: #ccc;
                    font-size: 0.95rem;
                }
                
                .author-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    object-fit: cover;
                }
                
                .author-name {
                    font-weight: 500;
                }
                
                .progress-section {
                    margin: 2rem 0;
                }
                
                .progress-bar {
                    width: 100%;
                    height: 6px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                    overflow: hidden;
                    margin-bottom: 1rem;
                }
                
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #007bff, #28a745);
                    border-radius: 3px;
                    animation: fillProgress 5s linear;
                }
                
                @keyframes fillProgress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                
                .progress-text {
                    color: #ccc;
                    font-size: 1rem;
                }
                
                .countdown-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    font-size: 1.1rem;
                    color: #ccc;
                    flex-wrap: wrap;
                }
                
                .countdown-number {
                    background: linear-gradient(45deg, #007bff, #28a745);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 12px;
                    font-weight: bold;
                    font-size: 1.3rem;
                    min-width: 50px;
                    text-align: center;
                    animation: countdownPulse 1s ease-in-out infinite;
                }
                
                @keyframes countdownPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                @media (max-width: 768px) {
                    .update-container {
                        margin: 1rem;
                        padding: 2rem;
                    }
                    
                    .update-title {
                        font-size: 2rem;
                    }
                    
                    .update-icon-wrapper {
                        width: 100px;
                        height: 100px;
                    }
                    
                    .update-icon {
                        font-size: 2.5rem;
                    }
                    
                    .commit-card {
                        padding: 1.5rem;
                    }
                    
                    .commit-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 0.75rem;
                    }
                    
                    .countdown-wrapper {
                        font-size: 1rem;
                        text-align: center;
                        gap: 0.3rem;
                    }
                    
                    .author-avatar {
                        width: 28px;
                        height: 28px;
                    }
                }
                
                @media (max-width: 480px) {
                    .update-container {
                        padding: 1.5rem;
                    }
                    
                    .update-title {
                        font-size: 1.8rem;
                    }
                    
                    .commit-message {
                        font-size: 1rem;
                    }
                    
                    .author-avatar {
                        width: 28px;
                        height: 28px;
                    }
                    
                    .commit-author {
                        gap: 0.5rem;
                    }
                }
            </style>
        `;
        
        this.reinitializeModules();
        this.startSimpleCountdown(5);
    }
    
    startSimpleCountdown(seconds) {
        let remaining = seconds;
        const countdownEl = document.getElementById('countdown');
        
        const timer = setInterval(() => {
            remaining--;
            if (countdownEl) {
                countdownEl.textContent = remaining;
            }
            
            if (remaining <= 0) {
                clearInterval(timer);
                window.location.reload();
            }
        }, 1000);
    }
    
    async checkBackendStatus() {
        try {
            const connected = await window.api.testConnection();
            if (!connected) {
                console.log('🔴 Backend недоступен');
                await this.analyzeBackendIssue();
            }
        } catch (error) {
            console.log('🔴 Backend недоступен');
            await this.analyzeBackendIssue();
        }
    }
    
    async analyzeBackendIssue() {
        try {
            const recentCommit = await this.checkRecentCommits();
            
            if (recentCommit) {
                this.showBackendUpdatingPage(recentCommit);
            } else {
                this.showBackendOfflinePage();
            }
        } catch (error) {
            this.showBackendOfflinePage();
        }
    }
    
    async checkRecentCommits() {
        const config = window.RkMConfig?.github;
        if (!config) return null;
        
        try {
            const response = await fetch(`${config.apiUrl}/commits?per_page=10`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) return null;
            
            const commits = await response.json();
            const now = new Date();
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
            
            for (const commit of commits) {
                const commitDate = new Date(commit.commit.author.date);
                if (commitDate > fiveMinutesAgo) {
                    return commit;
                }
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }
    
    showBackendUpdatingPage(commit) {
        const config = window.RkMConfig?.github;
        const helpUrl = config ? config.getIssueUrl('helpBackend') : 'https://github.com/AmKilopa/RkM/issues/new?title=HBR';
        
        const commitMessage = commit.commit?.message || commit.message || 'Обновление получено';
        const authorName = commit.commit?.author?.name || commit.author?.username || commit.author?.login || 'Разработчик';
        const commitDate = new Date(commit.commit?.author?.date || commit.author?.date || new Date()).toLocaleString('ru');
        
        // Безопасное получение аватарки
        let authorAvatar = 'https://github.com/identicons/app.png';
        if (commit.author?.avatar_url) {
            authorAvatar = commit.author.avatar_url;
        } else if (commit.committer?.avatar_url) {
            authorAvatar = commit.committer.avatar_url;
        }
        
        const shortSha = commit.sha.substring(0, 7);
        
        // Отладочная информация для backend updating
        console.log('Backend updating данные:', {
            commit: commit,
            authorName: authorName,
            authorAvatar: authorAvatar,
            message: commitMessage
        });
        
        document.body.innerHTML = `
            <div id="notifications-container" class="notifications-container"></div>
            <div id="modal-overlay" class="modal-overlay"></div>
            
            <div class="offline-page">
                <div class="offline-container">
                    <div class="status-icon updating">
                        <div class="icon-ring"></div>
                        <span class="icon-emoji">🔄</span>
                    </div>
                    
                    <h1 class="offline-title">Сервер обновляется</h1>
                    <p class="offline-subtitle">Backend применяет последние изменения</p>
                    
                    <div class="info-card">
                        <div class="card-header">
                            <span class="header-icon">🆕</span>
                            <span class="header-text">Последний коммит:</span>
                        </div>
                        
                        <div class="commit-info">
                            <div class="commit-badge">#${shortSha}</div>
                            <div class="commit-message">${commitMessage}</div>
                            <div class="commit-details">
                                <div class="detail-item">
                                    <img src="${authorAvatar}" alt="${authorName}" class="author-avatar-small" onerror="this.src='https://github.com/identicons/app.png'">
                                    <span>${authorName}</span>
                                </div>
                                <span class="detail-item">📅 ${commitDate}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="status-grid">
                        <div class="status-item">
                            <span class="status-icon">⏱️</span>
                            <span class="status-text">Ожидаемое время: 2-5 минут</span>
                        </div>
                        <div class="status-item">
                            <span class="status-icon">🔄</span>
                            <span class="status-text">Автопроверка каждые 10 секунд</span>
                        </div>
                    </div>
                    
                    <div class="action-buttons">
                        <button onclick="window.location.reload()" class="action-btn primary">
                            🔄 Проверить снова
                        </button>
                        <button onclick="window.open('${helpUrl}', '_blank')" class="action-btn secondary">
                            📝 Сообщить о проблеме
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        this.addOfflineStyles();
        this.reinitializeModules();
        this.startBackendRetryLoop();
    }
    
    showBackendOfflinePage() {
        const config = window.RkMConfig?.github;
        const helpUrl = config ? config.getIssueUrl('helpBackend') : 'https://github.com/AmKilopa/RkM/issues/new?title=HBR';
        
        document.body.innerHTML = `
            <div id="notifications-container" class="notifications-container"></div>
            <div id="modal-overlay" class="modal-overlay"></div>
            
            <div class="offline-page">
                <div class="offline-container">
                    <div class="status-icon offline">
                        <div class="icon-ring error"></div>
                        <span class="icon-emoji">📡</span>
                    </div>
                    
                    <h1 class="offline-title error">Сервер недоступен</h1>
                    <p class="offline-subtitle">Backend временно отключен</p>
                    
                    <div class="info-card error">
                        <div class="card-header">
                            <span class="header-icon">⚠️</span>
                            <span class="header-text">Информация о проблеме</span>
                        </div>
                        
                        <div class="error-content">
                            <p class="error-description">
                                Backend сервер не отвечает на запросы. Возможные причины: 
                                техническое обслуживание, перезагрузка сервера или временные неполадки.
                            </p>
                            
                            <div class="error-details">
                                <div class="detail-row">
                                    <span class="detail-icon">🔍</span>
                                    <span class="detail-text">Автопроверка каждые 10 секунд</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-icon">⏰</span>
                                    <span class="detail-text">Обычно восстанавливается в течение 5-10 минут</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="action-buttons">
                        <button onclick="window.location.reload()" class="action-btn primary">
                            🔄 Попробовать снова
                        </button>
                        <button onclick="window.open('${helpUrl}', '_blank')" class="action-btn secondary">
                            📝 Сообщить о проблеме
                        </button>
                    </div>
                    
                    <div class="connection-status">
                        <div class="status-indicator">
                            <div class="status-dot"></div>
                            <span class="status-label">Соединение отсутствует</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.addOfflineStyles();
        this.reinitializeModules();
        this.startBackendRetryLoop();
    }
    
    addOfflineStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .offline-page {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #1a0d0d 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif;
            }
            
            .offline-container {
                text-align: center;
                max-width: 600px;
                padding: 3rem;
                background: rgba(26, 26, 26, 0.9);
                border-radius: 24px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(20px);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
            }
            
            .status-icon {
                position: relative;
                width: 100px;
                height: 100px;
                margin: 0 auto 2rem;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .status-icon.updating {
                background: rgba(0, 123, 255, 0.1);
            }
            
            .status-icon.offline {
                background: rgba(220, 53, 69, 0.1);
            }
            
            .icon-ring {
                position: absolute;
                top: -3px;
                left: -3px;
                width: calc(100% + 6px);
                height: calc(100% + 6px);
                border: 3px solid transparent;
                border-radius: 50%;
                border-top: 3px solid #007bff;
                animation: spin 2s linear infinite;
            }
            
            .icon-ring.error {
                border-top: 3px solid #dc3545;
                animation: none;
            }
            
            .icon-emoji {
                font-size: 2.5rem;
                z-index: 1;
            }
            
            .offline-title {
                font-size: 2.2rem;
                font-weight: 300;
                color: #007bff;
                margin-bottom: 1rem;
            }
            
            .offline-title.error {
                color: #dc3545;
            }
            
            .offline-subtitle {
                font-size: 1.1rem;
                color: #ccc;
                margin-bottom: 2.5rem;
            }
            
            .info-card {
                background: rgba(42, 42, 42, 0.8);
                border-radius: 16px;
                padding: 2rem;
                margin: 2rem 0;
                border: 1px solid rgba(0, 123, 255, 0.2);
                text-align: left;
            }
            
            .info-card.error {
                border-color: rgba(220, 53, 69, 0.2);
            }
            
            .card-header {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                margin-bottom: 1.5rem;
                font-size: 1.1rem;
                font-weight: 600;
                color: #fff;
            }
            
            .header-icon {
                font-size: 1.3rem;
            }
            
            .commit-info .commit-badge {
                background: linear-gradient(45deg, #ffc107, #e0a800);
                color: #000;
                padding: 4px 12px;
                border-radius: 12px;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                font-size: 0.85rem;
                margin-bottom: 1rem;
                display: inline-block;
            }
            
            .commit-message {
                color: #fff;
                font-size: 1rem;
                line-height: 1.5;
                margin-bottom: 1rem;
            }
            
            .commit-details {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
            }
            
            .detail-item {
                color: #ccc;
                font-size: 0.9rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .author-avatar-small {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 1px solid rgba(255, 255, 255, 0.2);
                object-fit: cover;
            }
            
            .error-content .error-description {
                color: #ccc;
                line-height: 1.6;
                margin-bottom: 1.5rem;
            }
            
            .error-details {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }
            
            .detail-row {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: #aaa;
                font-size: 0.9rem;
            }
            
            .detail-icon {
                font-size: 1rem;
            }
            
            .status-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
                margin: 2rem 0;
            }
            
            .status-item {
                background: rgba(255, 255, 255, 0.05);
                padding: 1rem;
                border-radius: 12px;
                text-align: center;
            }
            
            .status-item .status-icon {
                display: block;
                font-size: 1.5rem;
                margin-bottom: 0.5rem;
            }
            
            .status-item .status-text {
                color: #ccc;
                font-size: 0.9rem;
                line-height: 1.4;
            }
            
            .action-buttons {
                display: flex;
                gap: 1rem;
                justify-content: center;
                margin-top: 2rem;
            }
            
            .action-btn {
                padding: 12px 24px;
                border: none;
                border-radius: 12px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 180px;
            }
            
            .action-btn.primary {
                background: linear-gradient(45deg, #007bff, #0056b3);
                color: white;
            }
            
            .action-btn.primary:hover {
                background: linear-gradient(45deg, #0056b3, #004085);
                transform: translateY(-2px);
            }
            
            .action-btn.secondary {
                background: rgba(108, 117, 125, 0.2);
                color: #ccc;
                border: 1px solid rgba(108, 117, 125, 0.3);
            }
            
            .action-btn.secondary:hover {
                background: rgba(108, 117, 125, 0.3);
                color: #fff;
            }
            
            .connection-status {
                margin-top: 2rem;
                padding-top: 1.5rem;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .status-indicator {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                color: #888;
                font-size: 0.9rem;
            }
            
            .status-dot {
                width: 8px;
                height: 8px;
                background: #dc3545;
                border-radius: 50%;
                animation: pulse 2s infinite;
            }
            
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            @media (max-width: 768px) {
                .offline-container {
                    margin: 1rem;
                    padding: 2rem;
                }
                
                .status-grid {
                    grid-template-columns: 1fr;
                }
                
                .action-buttons {
                    flex-direction: column;
                }
                
                .action-btn {
                    width: 100%;
                }
                
                .commit-details {
                    flex-direction: column;
                    gap: 0.75rem;
                    align-items: flex-start;
                }
                
                .detail-item {
                    width: 100%;
                    justify-content: flex-start;
                }
                
                .author-avatar-small {
                    width: 18px;
                    height: 18px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    startBackendRetryLoop() {
        const retryInterval = window.RkMConfig?.intervals?.offlineRetry || 10000;
        setInterval(async () => {
            try {
                const connected = await window.api.testConnection();
                if (connected) {
                    console.log('🟢 Backend восстановлен');
                    window.location.reload();
                }
            } catch (error) {
                // Продолжаем попытки
            }
        }, retryInterval);
    }
    
    reinitializeModules() {
        setTimeout(() => {
            // Инициализируем систему уведомлений если её нет
            if (!window.notifications) {
                // Загружаем систему уведомлений
                const script = document.createElement('script');
                script.src = 'js/notifications.js';
                script.onload = () => {
                    console.log('🔔 Система уведомлений загружена');
                };
                document.head.appendChild(script);
            } else {
                window.notifications.updateContainer();
            }
            
            if (window.modals) {
                window.modals.setupEventListeners();
            }
            if (window.buttonSounds) {
                window.buttonSounds.refreshBindings();
            }
        }, 100);
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});