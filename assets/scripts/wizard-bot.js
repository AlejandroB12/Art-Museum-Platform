(function () {
    const CHAT_API_URL = '/api/chat';

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
                <i class="fa-solid fa-rotate-right" id="reset-chat" title="Reiniciar"></i>
            </div>
        </div>

        <div class="chat-body">
            <div class="message-row bot-message">
                <div class="message-bubble">¡Hola! Soy el mago del museo y seré tu guía. ¿En qué puedo ayudarte?</div>
                <div class="message-time"></div>
            </div>
        </div>

        <div class="chat-chips">
            <div class="chip" data-msg="¿Qué artistas famosos tienen obras en el museo?">Artistas</div>
            <div class="chip" data-msg="¿Qué tipos de obras de arte hay?">Obras</div>
            <div class="chip" data-msg="¿Cómo puedo comprar una obra de arte?">Comprar</div>
            <div class="chip" data-msg="¿Cuánto cuesta la membresía del museo?">Membresía</div>
            <div class="chip" data-msg="¿Cuál es el horario y dónde está el museo?">Ubicación</div>
        </div>

        <div class="chat-footer">
            <div class="input-wrapper">
                <input type="text" id="chat-input" placeholder="Escribe tu mensaje..." autocomplete="off">
            </div>
            <button class="send-btn" id="chat-send">
                <i class="fa-solid fa-paper-plane"></i>
            </button>
        </div>
    </div>
    `;

    function getTime() {
        const now = new Date();
        return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    }

    function addMessage(text, isUser = false) {
        const body = document.querySelector('.chat-body');
        if (!body) return;

        const row = document.createElement('div');
        row.className = 'message-row' + (isUser ? ' user-message' : ' bot-message');

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.innerHTML = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');

        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = getTime();

        row.appendChild(bubble);
        row.appendChild(time);
        body.appendChild(row);
        body.scrollTop = body.scrollHeight;
    }

    function showTyping() {
        const body = document.querySelector('.chat-body');
        if (!body) return;

        const row = document.createElement('div');
        row.className = 'message-row bot-message';
        row.id = 'typing-indicator';

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble typing';
        bubble.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';

        row.appendChild(bubble);
        body.appendChild(row);
        body.scrollTop = body.scrollHeight;
    }

    function hideTyping() {
        const el = document.getElementById('typing-indicator');
        if (el) el.remove();
    }

    async function sendMessage(text) {
        if (!text.trim()) return;

        const input = document.getElementById('chat-input');
        input.value = '';
        addMessage(text, true);
        showTyping();

        try {
            const resp = await fetch(CHAT_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mensaje: text }),
            });
            const data = await resp.json();
            hideTyping();
            if (data.respuesta) {
                addMessage(data.respuesta);
            } else if (data.detail) {
                addMessage('⚠️ ' + data.detail);
            } else {
                addMessage('Lo siento, no pude procesar tu mensaje.');
            }
        } catch (err) {
            hideTyping();
            addMessage('Error al conectar con el servicio. Intenta de nuevo más tarde.');
        }
    }

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

        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send');

        sendBtn.addEventListener('click', () => sendMessage(input.value));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendMessage(input.value);
        });

        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => sendMessage(chip.dataset.msg));
        });

        document.getElementById('reset-chat')?.addEventListener('click', () => {
            const body = document.querySelector('.chat-body');
            if (!body) return;
            body.innerHTML = '';
            addMessage('¡Hola! Soy el mago del museo y seré tu guía. ¿En qué puedo ayudarte?');
        });
    });
})();
