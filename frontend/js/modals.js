// === МОДАЛЬНЫЕ ОКНА ===
class ModalSystem {
    constructor() {
        this.overlay = document.getElementById('modal-overlay');
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });
    }
    
    show(content) {
        this.overlay.innerHTML = content;
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    hide() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => {
            this.overlay.innerHTML = '';
        }, 300);
    }
}

window.modals = new ModalSystem();