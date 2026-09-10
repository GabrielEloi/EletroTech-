<style>
    #chat-widget {
        position: fixed;
        bottom: 25px;
        right: 25px;
        z-index: 9999;
        font-family: Arial, sans-serif;
    }

    #chat-window {
        display: none;
        width: 350px;
        height: 480px;
        background-color: #282828;
        border: 1px solid #FBD814;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        flex-direction: column;
        overflow: hidden;
        margin-bottom: 15px;
    }

    #chat-header {
        background-color: #FBD814;
        color: #282828;
        padding: 15px;
        font-weight: bold;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 16px;
    }

    #chat-messages {
        flex-grow: 1;
        padding: 15px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
        font-size: 14px;
    }

    .msg-user {
        align-self: flex-end;
        background-color: #4a4a4a;
        color: white;
        padding: 10px 15px;
        border-radius: 18px 18px 0 18px;
        max-width: 85%;
        line-height: 1.4;
    }

    .msg-ai {
        align-self: flex-start;
        background-color: transparent;
        border: 1px solid #FBD814;
        color: #e0e0e0;
        padding: 10px 15px;
        border-radius: 18px 18px 18px 0;
        max-width: 85%;
        line-height: 1.4;
    }

    #chat-input-area {
        display: flex;
        padding: 15px;
        background-color: #1e1e1e;
        border-top: 1px solid #444;
    }

    #chat-input {
        flex-grow: 1;
        background: transparent;
        border: none;
        color: white;
        outline: none;
        font-size: 14px;
    }

    #chat-input::placeholder {
        color: #888;
    }

    #chat-send {
        background: none;
        border: none;
        color: #FBD814;
        cursor: pointer;
        font-size: 1.2rem;
        transition: 0.2s;
    }

    #chat-send:hover {
        color: white;
    }

    #chat-btn {
        background-color: #FBD814;
        color: #282828;
        width: 65px;
        height: 65px;
        border-radius: 50%;
        border: none;
        font-size: 28px;
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.4);
        cursor: pointer;
        float: right;
        transition: transform 0.3s, background-color 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    #chat-btn:hover {
        background-color: #ffffff;
        transform: scale(1.05);
    }

    #chat-messages::-webkit-scrollbar {
        width: 6px;
    }

    #chat-messages::-webkit-scrollbar-thumb {
        background-color: #555;
        border-radius: 10px;
    }
</style>

<div id="chat-widget">
    <div id="chat-window">
        <div id="chat-header">
            <span><i class="fa-solid fa-bolt"></i> Assistente EletroTech</span>
            <button onclick="toggleChat()" style="background:none; border:none; color:#282828; cursor:pointer; font-size: 18px;">
                <i class="fa-solid fa-times"></i>
            </button>
        </div>
        <div id="chat-messages">
            <div class="msg-ai">Olá! Eu sou a Inteligência Artificial da EletroTech. Como posso ajudar com o sistema hoje?</div>
        </div>
        <div id="chat-input-area">
            <input type="text" id="chat-input" placeholder="Pergunte algo..." onkeypress="handleEnter(event)">
            <button id="chat-send" onclick="enviarMensagem()"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
    </div>
    <button id="chat-btn" onclick="toggleChat()">
        <i class="fa-solid fa-robot"></i>
    </button>
</div>

<script>
    function toggleChat() {
        const chatWindow = document.getElementById('chat-window');
        chatWindow.style.display = (chatWindow.style.display === 'flex') ? 'none' : 'flex';
        if (chatWindow.style.display === 'flex') {
            document.getElementById('chat-input').focus();
        }
    }

    function handleEnter(e) {
        if (e.key === 'Enter') enviarMensagem();
    }

    async function enviarMensagem() {
        const input = document.getElementById('chat-input');
        const mensagem = input.value.trim();
        if (!mensagem) return;

        const chatMessages = document.getElementById('chat-messages');

        chatMessages.innerHTML += `<div class="msg-user">${mensagem}</div>`;
        input.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const typingId = 'typing-' + Date.now();
        chatMessages.innerHTML += `<div id="${typingId}" class="msg-ai">A processar a resposta <i class="fa-solid fa-circle-notch fa-spin"></i></div>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const response = await fetch('<?= site_url('chat/enviar') ?>', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    mensagem: mensagem
                })
            });

            if (!response.ok) throw new Error("Erro no servidor");

            const data = await response.json();

            document.getElementById(typingId).remove();

            if (data.erro) {
                chatMessages.innerHTML += `<div class="msg-ai" style="border-color: #dc3545; color: #dc3545;">${data.erro}</div>`;
            } else {
                const formatado = data.resposta.replace(/\n/g, '<br>');
                chatMessages.innerHTML += `<div class="msg-ai">${formatado}</div>`;
            }

        } catch (error) {
            document.getElementById(typingId).remove();
            chatMessages.innerHTML += `<div class="msg-ai" style="border-color: #dc3545; color: #dc3545;">Erro ao conectar com o assistente. Verifique o console.</div>`;
        }

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
</script>
