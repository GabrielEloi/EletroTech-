export default function Modal({ aberto, onFechar, titulo, children }) {
  if (!aberto) return null;
  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.6)" }}
      tabIndex="-1"
      onClick={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content eletrotech-modal">
          <div className="modal-header">
            <h5 className="modal-title">{titulo}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onFechar}></button>
          </div>
          <div className="modal-body p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
