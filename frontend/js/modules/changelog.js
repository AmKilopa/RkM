// === МОДУЛЬ ЛОГОВ ОБНОВЛЕНИЙ ===
class ChangelogModule {
    constructor() {
        this.commits = [];
        this.isLoading = false;
    }
    
    async show() {
        const modal = `
            <div class="modal changelog-modal">
                <div class="modal-header">
                    <h3 class="modal-title">📋 Логи обновлений</h3>
                    <button onclick="window.modals.hide()" class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="changelog-content">
                        <div style="text-align: center; padding: 3rem;">
                            <div class="loading-spinner"></div>
                            <p style="margin-top: 1rem; color: var(--text-muted);">Загружаем историю изменений...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        window.modals.show(modal);
        await this.loadCommits();
    }
    
    async loadCommits() {
        if (this.isLoading) return;
        this.isLoading = true;
        
        const config = window.RkMConfig?.github;
        if (!config) {
            this.renderConfigError();
            this.isLoading = false;
            return;
        }
        
        try {
            const response = await fetch(`${config.apiUrl}/commits?per_page=20`);
            
            if (response.status === 404) {
                this.renderRepositoryNotFound();
                this.isLoading = false;
                return;
            }
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            this.commits = await response.json();
            this.renderCommits();
        } catch (error) {
            this.renderError();
        }
        
        this.isLoading = false;
    }
    
    renderCommits() {
        const content = document.getElementById('changelog-content');
        if (!content) return;
        
        const commitsHtml = this.commits.map(commit => {
            const date = new Date(commit.commit.author.date);
            const timeAgo = this.getTimeAgo(date);
            
            return `
                <div class="commit-item">
                    <div class="commit-header">
                        <div class="commit-sha">#${commit.sha.substring(0, 7)}</div>
                        <div class="commit-time">${timeAgo}</div>
                    </div>
                    <div class="commit-message">${this.escapeHtml(commit.commit.message)}</div>
                    <div class="commit-author">
                        ${commit.author?.avatar_url ? `<img src="${commit.author.avatar_url}" alt="" class="author-avatar">` : ''}
                        <span>${commit.commit.author.name}</span>
                    </div>
                    <div class="commit-date">${date.toLocaleString('ru')}</div>
                </div>
            `;
        }).join('');
        
        content.innerHTML = `
            <div class="changelog-header">
                <div>
                    <h2>📋 История изменений</h2>
                    <p>Последние ${this.commits.length} коммитов</p>
                </div>
                <div class="changelog-controls">
                    <button onclick="window.changelogModule.refresh()" class="refresh-btn">🔄 Обновить</button>
                </div>
            </div>
            <div class="commits-list">
                ${commitsHtml}
            </div>
        `;
    }
    
    renderRepositoryNotFound() {
        const content = document.getElementById('changelog-content');
        if (!content) return;
        
        const config = window.RkMConfig?.github;
        const repoName = config ? `${config.owner}/${config.repo}` : 'AmKilopa/RkM';
        
        content.innerHTML = `
            <div class="repo-not-found">
                <div class="repo-icon">📂</div>
                <h3>Репозиторий не найден</h3>
                <p>GitHub репозиторий "${repoName}" не существует или недоступен</p>
                <div class="repo-info">
                    <p><strong>Возможные причины:</strong></p>
                    <ul>
                        <li>Репозиторий еще не создан</li>
                        <li>Репозиторий приватный</li>
                        <li>Неверное имя репозитория в config.js</li>
                    </ul>
                </div>
                <button onclick="window.open('https://github.com/new', '_blank')" class="create-repo-btn">
                    📝 Создать репозиторий
                </button>
            </div>
        `;
    }
    
    renderConfigError() {
        const content = document.getElementById('changelog-content');
        if (!content) return;
        
        content.innerHTML = `
            <div class="error-message">
                <div class="error-icon">⚙️</div>
                <h3>Конфигурация не найдена</h3>
                <p>Не найден файл config.js или конфигурация GitHub</p>
                <p>Проверьте что файл js/config.js подключен в index.html</p>
            </div>
        `;
    }
    
    renderError() {
        const content = document.getElementById('changelog-content');
        if (!content) return;
        
        content.innerHTML = `
            <div class="error-message">
                <div class="error-icon">❌</div>
                <h3>Ошибка загрузки</h3>
                <p>Не удалось загрузить историю изменений</p>
                <button onclick="window.changelogModule.loadCommits()" class="retry-btn">
                    🔄 Попробовать снова
                </button>
            </div>
        `;
    }
    
    async refresh() {
        const content = document.getElementById('changelog-content');
        if (content) {
            content.innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <div class="loading-spinner"></div>
                    <p style="margin-top: 1rem; color: var(--text-muted);">Обновляем данные...</p>
                </div>
            `;
        }
        await this.loadCommits();
    }
    
    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'только что';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} мин назад`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ч назад`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} дн назад`;
        
        return date.toLocaleDateString('ru');
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Инициализация модуля
window.changelogModule = new ChangelogModule();