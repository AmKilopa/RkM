// === МОДАЛЬНЫЕ ОКНА ===
class ModalSystem {
    constructor() {
        this.overlay = document.getElementById('modal-overlay');
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Обновляем ссылку на overlay если она изменилась
        this.overlay = document.getElementById('modal-overlay');
        
        if (this.overlay) {
            // Удаляем старые обработчики
            this.overlay.replaceWith(this.overlay.cloneNode(true));
            this.overlay = document.getElementById('modal-overlay');
            
            // Добавляем новые обработчики
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.hide();
                }
            });
        }
    }
    
    show(content) {
        if (!this.overlay) {
            this.overlay = document.getElementById('modal-overlay');
        }
        
        if (this.overlay) {
            this.overlay.innerHTML = content;
            this.overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    hide() {
        if (this.overlay) {
            this.overlay.classList.remove('active');
            document.body.style.overflow = '';
            setTimeout(() => {
                if (this.overlay) {
                    this.overlay.innerHTML = '';
                }
            }, 300);
        }
    }
}

window.modals = new ModalSystem();