// === ГЛАВНЫЙ СКРИПТ ===
class App {
    constructor() {
        this.currentPage = 'home';
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateBugReportLink();
        this.checkForUpdates();
    }
    
    setupEventListeners() {
        // Кнопки главной страницы
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
        
        // Кнопка "Логи обновлений"
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
        
        const links = {
            'home': 'https://github.com/AmKilopa/RkM/issues/new?title=HPR',
            'inventory': 'https://github.com/AmKilopa/RkM/issues/new?title=ICR',
            'friend-error': 'https://github.com/AmKilopa/RkM/issues/new?title=FER',
            'substitution': 'https://github.com/AmKilopa/RkM/issues/new?title=SSR'
        };
        
        bugBtn.onclick = () => window.open(links[this.currentPage], '_blank');
    }
    
    showHomePage() {
        // Удаляем все страницы кроме главной
        const pages = document.querySelectorAll('.page:not(#home-page)');
        pages.forEach(page => page.remove());
        
        // Показываем главную страницу
        const homePage = document.getElementById('home-page');
        if (homePage) {
            homePage.classList.add('active');
        }
        
        // Сбрасываем состояние
        this.currentPage = 'home';
        this.updateBugReportLink();
    }
    
    // === СИСТЕМА ОБНОВЛЕНИЙ ===
    async checkForUpdates() {
        try {
            const response = await fetch('https://api.github.com/repos/AmKilopa/RkM/commits?per_page=1');
            const commits = await response.json();
            
            if (commits && commits[0]) {
                const latestCommit = commits[0];
                const storedCommit = localStorage.getItem('rkm_last_commit');
                
                if (storedCommit && storedCommit !== latestCommit.sha) {
                    // Есть новое обновление - показываем страницу обновления
                    this.showUpdatePage(latestCommit);
                } else if (!storedCommit) {
                    // Первый запуск - сохраняем текущий коммит
                    localStorage.setItem('rkm_last_commit', latestCommit.sha);
                }
            }
        } catch (error) {
            // Игнорируем ошибки проверки обновлений
        }
    }
    
    showUpdatePage(commit) {
        document.body.innerHTML = `
            <div class="update-page">
                <div class="update-container">
                    <div class="update-icon">🔄</div>
                    <h1>Обновление сайта</h1>
                    <p class="update-message">На сайте происходят изменения...</p>
                    
                    <div class="commit-info">
                        <h3>Последний коммит:</h3>
                        <div class="commit-message">${commit.commit.message}</div>
                        <div class="commit-details">
                            <span class="commit-author">${commit.commit.author.name}</span>
                            <span class="commit-date">${new Date(commit.commit.author.date).toLocaleString('ru')}</span>
                        </div>
                        <div class="commit-sha">#${commit.sha.substring(0, 7)}</div>
                    </div>
                    
                    <div class="loading-spinner"></div>
                    <p class="loading-text">Ожидаем завершения сборки...</p>
                    
                    <button onclick="window.location.reload()" class="reload-btn">
                        Обновить страницу
                    </button>
                </div>
            </div>
        `;
        
        // Проверяем статус сборки каждые 30 секунд
        setInterval(() => {
            window.location.reload();
        }, 30000);
    }
    
    showChangelog() {
        if (window.changelogModule) {
            window.changelogModule.show();
        } else {
            window.notifications?.error('Модуль логов недоступен');
        }
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});