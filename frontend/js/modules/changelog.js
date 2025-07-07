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
                        <div class="loading-spinner"></div>
                        <p>Загружаем историю изменений...</p>
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
        
        try {
            const response = await fetch('https://api.github.com/repos/AmKilopa/RkM/commits?per_page=20');
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
                        <img src="${commit.author?.avatar_url || ''}" alt="" class="author-avatar">
                        <span>${commit.commit.author.name}</span>
                    </div>
                    <div class="commit-date">${date.toLocaleString('ru')}</div>
                </div>
            `;
        }).join('');
        
        content.innerHTML = `
            <div class="changelog-header">
                <p>История последних ${this.commits.length} изменений</p>
                <button onclick="window.changelogModule.refresh()" class="refresh-btn">🔄 Обновить</button>
            </div>
            <div class="commits-list">
                ${commitsHtml}
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
                    Попробовать снова
                </button>
            </div>
        `;
    }
    
    async refresh() {
        const content = document.getElementById('changelog-content');
        if (content) {
            content.innerHTML = `
                <div class="loading-spinner"></div>
                <p>Обновляем данные...</p>
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