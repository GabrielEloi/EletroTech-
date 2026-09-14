import { useEffect, useState } from "react";
import * as baixasApi from "../api/baixas";
import * as produtosApi from "../api/produtos";
import { Carregando, ErroCarregamento, ListaVazia } from "../components/EstadoLista";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "/index.php";

export default function BaixasPage() {
  const { ehAdmin } = useAuth();
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [filtros, setFiltros] = useState({ tipo: "", id_produto: "", data_inicio: "", data_fim: "" });
  const [selecionados, setSelecionados] = useState([]);

  function carregar(novosFiltros = filtros) {
    setCarregando(true);
    setErro("");
    baixasApi
      .listarBaixas({ consultar: 1, ...novosFiltros })
      .then((res) => setMovimentacoes(res.data?.movimentacoes ?? res.data ?? []))
      .catch(() => setErro("Não foi possível carregar as movimentações."))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregar();
    produtosApi
      .listarProdutos()
      .then((res) => setProdutos(res.data?.produtos ?? res.data ?? []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFiltrar(e) {
    e.preventDefault();
    carregar(filtros);
  }

  function handleLimpar() {
    const vazio = { tipo: "", id_produto: "", data_inicio: "", data_fim: "" };
    setFiltros(vazio);
    carregar(vazio);
  }

  function toggleSelecionado(id) {
    setSelecionados((lista) => (lista.includes(id) ? lista.filter((i) => i !== id) : [...lista, id]));
  }

  function abrirRelatorioMisto() {
    if (selecionados.length === 0) return;
    const form = document.createElement("form");
    form.method = "POST";
    form.action = `${API_BASE}/baixas/relatorio_misto`;
    form.target = "_blank";
    selecionados.forEach((id) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "ids[]";
      input.value = id;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Movimentação de Estoque</h1>
        <p>Consulta de entradas e saídas de materiais.</p>
      </div>

      <form onSubmit={handleFiltrar} className="filtro-mes justify-content-center">
        <div>
          <label>Tipo</label>
          <select className="form-select" value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}>
            <option value="">Todas</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </div>
        <div>
          <label>Produto</label>
          <select className="form-select" value={filtros.id_produto} onChange={(e) => setFiltros({ ...filtros, id_produto: e.target.value })}>
            <option value="">Todos</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>{p.nome_produto}</option>
            ))}
          </select>
        </div>
        <div>
          <label>De</label>
          <input type="date" className="form-control" value={filtros.data_inicio} onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })} />
        </div>
        <div>
          <label>Até</label>
          <input type="date" className="form-control" value={filtros.data_fim} onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })} />
        </div>
        <div>
          <button type="submit" className="btn btn-outline-warning">Consultar</button>
          <button type="button" className="btn btn-outline-secondary ms-2" onClick={handleLimpar} title="Limpar Filtros">
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
      </form>

      {erro && <ErroCarregamento mensagem={erro} onTentarNovamente={() => carregar()} />}

      {carregando ? (
        <Carregando texto="Carregando movimentações..." />
      ) : (
        <>
          <div className="d-flex justify-content-between align-items-center mt-3 mb-2">
            <span className="text-muted">{movimentacoes.length} registro(s) encontrado(s)</span>
            {selecionados.length > 0 && (
              <button type="button" className="btn btn-sm btn-eletrotech" onClick={abrirRelatorioMisto}>
                <i className="fa-solid fa-file-lines"></i> Criar relatório misto ({selecionados.length})
              </button>
            )}
          </div>

          <table className="table table-dark table-hover table-bordered custom-table text-center tabela-eletrotech">
            <thead>
              <tr>
                <th>Ações</th>
                <th>Data</th>
                <th>Produto</th>
                <th>Tipo</th>
                <th>Qtd</th>
                <th>Valor Unit.</th>
                <th>Valor Total</th>
                <th>Origem</th>
              </tr>
            </thead>
            <tbody>
              {movimentacoes.length > 0 ? (
                movimentacoes.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <input
                        type="checkbox"
                        className="form-check-input me-2"
                        style={{ accentColor: "#FBD814" }}
                        checked={selecionados.includes(m.id)}
                        onChange={() => toggleSelecionado(m.id)}
                      />
                      <a
                        href={`${API_BASE}/baixas/detalhes/${m.id}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Ver relatório detalhado"
                      >
                        <i className="fa-solid fa-file-lines"></i>
                      </a>
                    </td>
                    <td>{m.data_mov ? new Date(m.data_mov).toLocaleDateString("pt-BR") : "-"}</td>
                    <td>{m.nome_produto}</td>
                    <td>
                      {m.tipo === "entrada" ? (
                        <span className="badge bg-success"><i className="fa-solid fa-arrow-down"></i> Entrada</span>
                      ) : (
                        <span className="badge bg-danger"><i className="fa-solid fa-arrow-up"></i> Saída</span>
                      )}
                    </td>
                    <td>{m.quantidade}</td>
                    <td>R$ {Number(m.valor_unitario).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td>R$ {Number(m.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td>
                      {m.id_baixa && ehAdmin ? (
                        <a href={`${API_BASE}/lancamentos/relatorio/${m.id_baixa}`} target="_blank" rel="noreferrer">
                          {m.origem}
                        </a>
                      ) : (
                        m.origem
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <ListaVazia texto="Nenhuma movimentação encontrada para os filtros selecionados." />
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
