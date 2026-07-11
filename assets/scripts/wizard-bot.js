(function () {
    const botHTML = `
    <input type="checkbox" id="chat-toggle">

    <div class="fab-wrapper">
        <label for="chat-toggle" class="chat-btn">
            <i class="fa-regular fa-comment-dots"></i>
        </label>
    </div>

    <div class="chat-window">
        <div class="chat-header">
            <div class="header-info">
                <div class="avatar">
                    <img src="/icons/wizard_icon.png" alt="Wizard" class="avatar-img">
                </div>
                <div class="bot-status">
                    <h4 class="bot-name">Wizard</h4>
                    <p class="status-text">En línea · Siempre disponible</p>
                </div>
            </div>
            <div class="header-actions">
                <i class="fa-solid fa-rotate-right" title="Reiniciar"></i>
            </div>
        </div>

        <div class="chat-body">
            <div class="message-row">
                <div class="message-bubble">
                    ¡Hola! Soy el mago del museo y seré tu guía. ¿En qué puedo ayudarte?
                </div>
                <div class="message-time">01:25</div>
            </div>
        </div>

        <div class="chat-chips">
            <div class="chip">Servicios</div>
            <div class="chip">Precios</div>
            <div class="chip">Contacto</div>
            <div class="chip">Horario</div>
        </div>

        <div class="chat-footer">
            <div class="input-wrapper">
                <input type="text" placeholder="Escribe tu mensaje..." autocomplete="off">
            </div>
            <button class="send-btn">
                <i class="fa-solid fa-paper-plane"></i>
            </button>
        </div>
    </div>
    `;

    document.addEventListener('DOMContentLoaded', function () {
        const temp = document.createElement('div');
        temp.innerHTML = botHTML;
        while (temp.firstChild) {
            document.body.appendChild(temp.firstChild);
        }

        const fabWrapper = document.querySelector('.fab-wrapper');
        const chatWindow = document.querySelector('.chat-window');
        const footer = document.querySelector('footer');
        if (!fabWrapper || !chatWindow || !footer) return;

        const WINDOW_OFFSET = 60;

        function updateBotPosition() {
            const footerRect = footer.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            if (footerRect.top < viewportHeight && footerRect.height > 0 && footerRect.top > -footerRect.height) {
                const overlap = viewportHeight - footerRect.top + 20;
                fabWrapper.style.bottom = overlap + 'px';
                chatWindow.style.bottom = (overlap + WINDOW_OFFSET) + 'px';
            } else {
                fabWrapper.style.bottom = '';
                chatWindow.style.bottom = '';
            }
        }

        window.addEventListener('scroll', updateBotPosition, { passive: true });
        window.addEventListener('resize', updateBotPosition);
        setTimeout(updateBotPosition, 100);
    });
})();
