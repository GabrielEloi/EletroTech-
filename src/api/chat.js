import api from "./client";

// POST /chat/enviar { mensagem } - este endpoint espera JSON (igual ao front original)
export function enviarMensagemChat(mensagem) {
  return api.post(
    "/chat",
    { mensagem },
    { headers: { "Content-Type": "application/json" } }
  );
}
