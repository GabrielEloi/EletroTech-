import { useEffect, useState } from "react";
import * as baixasApi from "../api/baixas";
import Relatorio, { TabelaMovimentacoes } from "../components/Relatorio";
import { dataBr, mensagemErro } from "../lib/formatters";
import { useNotificacao } from "../context/NotificacaoContext";
import { Carregando, ErroCarregamento, ListaVazia } from "../components/EstadoLista";
import { useAuth } from "../context/auth-store";


export default function BaixasPage() {
  const { ehAdmin } = useAuth();
  const { notificar } = useNotificacao();
  const [relatorio, setRelatorio] = useState(null);
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
      .then((res) => { setMovimentacoes(res.data?.movimentacoes ?? res.data ?? []); setSelecionados([]); })
      .catch(() => setErro("Não foi possível carregar as movimentações."))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregar();
    baixasApi
      .opcoesMovimentacoes()
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

  async function abrirRelatorioMisto() {
    if (!selecionados.length) return;
    try { const { data } = await baixasApi.relatorioMistoBaixas(selecionados); setRelatorio(data); }
    catch (e) { notificar(mensagemErro(e), 'erro'); }
  }
  async function abrirDetalhe(id) {
    try { const { data } = await baixasApi.detalhesMovimentacao(id); setRelatorio([data]); }
    catch (e) { notificar(mensagemErro(e), 'erro'); }
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
                      <button className="btn btn-sm btn-outline-info" type="button" onClick={() => abrirDetalhe(m.id)} title="Ver relatório detalhado"><i className="fa-solid fa-file-lines" /></button>
                    </td>
                    <td>{m.data_mov ? dataBr(m.data_mov) : "-"}</td>
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
                      {m.origem}{m.id_baixa && ehAdmin && <small className="d-block">Baixa #{m.id_baixa}</small>}
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
      <Relatorio aberto={!!relatorio} onFechar={() => setRelatorio(null)} titulo="Relatório de movimentações">{relatorio && <TabelaMovimentacoes itens={relatorio} />}</Relatorio>
    </div>
  );
}
