export function Carregando({ texto = "Carregando..." }) {
  return (
    <div className="text-center text-light py-5">
      <div className="spinner-border" role="status" style={{ color: "#FBD814" }}></div>
      <p className="mt-3">{texto}</p>
    </div>
  );
}

export function ErroCarregamento({ mensagem, onTentarNovamente }) {
  return (
    <div className="alert alert-danger d-flex justify-content-between align-items-center">
      <span>{mensagem || "Não foi possível carregar os dados do servidor."}</span>
      {onTentarNovamente && (
        <button className="btn btn-sm btn-outline-light" onClick={onTentarNovamente}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}

export function ListaVazia({ texto = "Nenhum registro encontrado." }) {
  return (
    <tr>
      <td colSpan={99} className="text-center text-muted py-4">
        {texto}
      </td>
    </tr>
  );
}
