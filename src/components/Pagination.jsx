export default function Pagination({ totalRows, page, porPagina = 10, onChange }) {
  if (!totalRows || totalRows <= porPagina) return null;

  const totalPaginas = Math.ceil(totalRows / porPagina);
  const offset = (page - 1) * porPagina;

  return (
    <div className="rodape-paginacao">
      <nav>
        <ul className="pagination mb-0">
          <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => onChange(page - 1)}>
              Anterior
            </button>
          </li>
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
            <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
              <button className="page-link" onClick={() => onChange(p)}>
                {p}
              </button>
            </li>
          ))}
          <li className={`page-item ${page >= totalPaginas ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => onChange(page + 1)}>
              Próxima
            </button>
          </li>
        </ul>
      </nav>
      <span className="contagem">
        Mostrando {offset + 1}–{Math.min(offset + porPagina, totalRows)} de {totalRows} registros
      </span>
    </div>
  );
}
