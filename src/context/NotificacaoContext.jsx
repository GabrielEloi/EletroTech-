import { createContext, useCallback, useContext, useState } from "react";

const NotificacaoContext = createContext(null);

export function NotificacaoProvider({ children }) {
  const [notificacoes, setNotificacoes] = useState([]);

  const notificar = useCallback((mensagem, tipo = "sucesso") => {
    const id = Date.now() + Math.random();
    setNotificacoes((lista) => [...lista, { id, mensagem, tipo }]);
    setTimeout(() => {
      setNotificacoes((lista) => lista.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  return (
    <NotificacaoContext.Provider value={{ notificar }}>
      {children}
      <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 10000 }}>
        {notificacoes.map((n) => (
          <div
            key={n.id}
            className={`toast show align-items-center text-white border-0 mb-2 ${
              n.tipo === "erro" ? "bg-danger" : "bg-success"
            }`}
          >
            <div className="d-flex">
              <div className="toast-body">{n.mensagem}</div>
            </div>
          </div>
        ))}
      </div>
    </NotificacaoContext.Provider>
  );
}

export function useNotificacao() {
  const ctx = useContext(NotificacaoContext);
  if (!ctx) throw new Error("useNotificacao deve ser usado dentro de NotificacaoProvider");
  return ctx;
}
