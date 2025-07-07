// === ГЛАВНЫЙ СКРИПТ ===
class App {
    constructor() {
        this.currentPage = 'home';
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateBugReportLink();
        console.log('🚀 Приложение RkM запущено');
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
        
        // Кнопка "Нашёл баг"
        document.getElementById('bug-report-btn')?.addEventListener('click', () => {
            this.openBugReport();
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
        // Добавить другие модули когда будут готовы
    }
    
    updateBugReportLink() {
        const bugBtn = document.getElementById('bug-report-btn');
        if (!bugBtn) return;
        
        const links = {
            'home': 'https://github.com/AmKilopa/RkM/issues/new',
            'inventory': 'https://github.com/AmKilopa/RkM/issues/new?title=ICR',
            'friend-error': 'https://github.com/AmKilopa/RkM/issues/new?title=FER',
            'substitution': 'https://github.com/AmKilopa/RkM/issues/new?title=SPR'
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
        
        console.log('🏠 Возврат на главную страницу');
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});