import { useRef, useState } from "react";
import { enviarMensagemChat } from "../api/chat";

export default function Chatbot() {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState([
    { autor: "ai", texto: "Olá! Eu sou a Inteligência Artificial da EletroTech. Como posso ajudar com o sistema hoje?" },
  ]);
  const [input, setInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const listaRef = useRef(null);

  function rolarParaFinal() {
    requestAnimationFrame(() => {
      if (listaRef.current) {
        listaRef.current.scrollTop = listaRef.current.scrollHeight;
      }
    });
  }

  async function enviar() {
    const texto = input.trim();
    if (!texto || enviando) return;

    setMensagens((m) => [...m, { autor: "user", texto }]);
    setInput("");
    setEnviando(true);
    rolarParaFinal();

    try {
      const { data } = await enviarMensagemChat(texto);
      if (data?.erro) {
        setMensagens((m) => [...m, { autor: "ai", texto: data.erro, erro: true }]);
      } else {
        setMensagens((m) => [...m, { autor: "ai", texto: data?.resposta ?? "" }]);
      }
    } catch {
      setMensagens((m) => [
        ...m,
        { autor: "ai", texto: "Erro ao conectar com o assistente.", erro: true },
      ]);
    } finally {
      setEnviando(false);
      rolarParaFinal();
    }
  }

  return (
    <div id="chat-widget">
      {aberto && (
        <div id="chat-window" style={{ display: "flex" }}>
          <div id="chat-header">
            <span>
              <i className="fa-solid fa-bolt"></i> Assistente EletroTech
            </span>
            <button
              onClick={() => setAberto(false)}
              style={{ background: "none", border: "none", color: "#282828", cursor: "pointer", fontSize: 18 }}
            >
              <i className="fa-solid fa-times"></i>
            </button>
          </div>
          <div id="chat-messages" ref={listaRef}>
            {mensagens.map((m, i) => (
              <div
                key={i}
                className={m.autor === "user" ? "msg-user" : "msg-ai"}
                style={m.erro ? { borderColor: "#dc3545", color: "#dc3545" } : undefined}
              >
                {m.texto.split("\n").map((linha, j) => (
                  <span key={j}>
                    {linha}
                    <br />
                  </span>
                ))}
              </div>
            ))}
            {enviando && (
              <div className="msg-ai">
                A processar a resposta <i className="fa-solid fa-circle-notch fa-spin"></i>
              </div>
            )}
          </div>
          <div id="chat-input-area">
            <input
              type="text"
              id="chat-input"
              placeholder="Pergunte algo..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && enviar()}
            />
            <button id="chat-send" onClick={enviar}>
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}
      <button id="chat-btn" onClick={() => setAberto((v) => !v)}>
        <i className="fa-solid fa-robot"></i>
      </button>
    </div>
  );
}
