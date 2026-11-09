export default function Modal({ aberto, onFechar, titulo, children }) {
  if (!aberto) return null;
  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.6)" }}
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="eletrotech-modal-title"
      onClick={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content eletrotech-modal">
          <div className="modal-header">
            <h5 id="eletrotech-modal-title" className="modal-title">{titulo}</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              aria-label="Fechar janela"
              onClick={onFechar}
            />
          </div>
          <div className="modal-body p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
