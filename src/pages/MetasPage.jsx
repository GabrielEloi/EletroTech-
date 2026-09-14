import { useEffect, useState } from "react";
import * as metasApi from "../api/metas";
import * as eletricistasApi from "../api/eletricistas";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import { Carregando, ErroCarregamento, ListaVazia } from "../components/EstadoLista";
import { useNotificacao } from "../context/NotificacaoContext";

const POR_PAGINA = 10;

export default function MetasPage() {
  const { notificar } = useNotificacao();
  const [metas, setMetas] = useState([]);
  const [eletricistasAtivos, setEletricistasAtivos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [pagina, setPagina] = useState(1);
  const [salvando, setSalvando] = useState(false);

  const [filtroEletricista, setFiltroEletricista] = useState("");
  const [filtroMes, setFiltroMes] = useState("");

  const [modalNova, setModalNova] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [nova, setNova] = useState({ eletricista_meta: "", mes_meta: "", vlr_meta: "" });
  const [editando, setEditando] = useState({ id: null, nome_eletricista: "", mes_meta: "", vlr_meta: "" });

  function carregar(filtros = {}) {
    setCarregando(true);
    setErro("");
    metasApi
      .listarMetas({
        filtro_eletricista: filtros.filtro_eletricista ?? filtroEletricista,
        filtro_mes: filtros.filtro_mes ?? filtroMes,
      })
      .then((res) => setMetas(res.data?.metas ?? res.data ?? []))
      .catch(() => setErro("Não foi possível carregar as metas."))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregar();
    eletricistasApi
      .listarEletricistas()
      .then((res) => {
        const lista = res.data?.eletricistas ?? res.data ?? [];
        setEletricistasAtivos(lista.filter((e) => !e.data_demissao));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFiltrar(e) {
    e.preventDefault();
    setPagina(1);
    carregar();
  }

  function handleLimparFiltros() {
    setFiltroEletricista("");
    setFiltroMes("");
    carregar({ filtro_eletricista: "", filtro_mes: "" });
  }

  async function handleNova(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      await metasApi.cadastrarMeta(nova);
      notificar("Meta cadastrada com sucesso.");
      setModalNova(false);
      setNova({ eletricista_meta: "", mes_meta: "", vlr_meta: "" });
      carregar();
    } catch (err) {
      notificar(err.response?.data?.mensagem || "Erro ao cadastrar meta.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  async function handleEditar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      await metasApi.editarMeta({ id: editando.id, vlr_meta: editando.vlr_meta });
      notificar("Meta atualizada com sucesso.");
      setModalEditar(false);
      carregar();
    } catch (err) {
      notificar(err.response?.data?.mensagem || "Erro ao editar meta.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(id) {
    if (!window.confirm("Excluir esta meta?")) return;
    try {
      await metasApi.excluirMeta(id);
      notificar("Meta excluída.");
      carregar();
    } catch (err) {
      notificar(err.response?.data?.mensagem || "Erro ao excluir meta.", "erro");
    }
  }

  const totalRows = metas.length;
  const inicio = (pagina - 1) * POR_PAGINA;
  const paginaAtual = metas.slice(inicio, inicio + POR_PAGINA);

  return (
    <div className="container">
      <div className="page-header">
        <h1>Metas</h1>
        <p>Metas mensais de faturamento por eletricista.</p>
      </div>

      <div id="acoes_id">
        <button type="button" onClick={() => setModalNova(true)}>
          <i className="fa-solid fa-plus"></i> Nova Meta
        </button>
      </div>

      <form onSubmit={handleFiltrar} className="filtro-mes justify-content-center">
        <div>
          <label>Eletricista</label>
          <select
            className="form-select"
            value={filtroEletricista}
            onChange={(e) => setFiltroEletricista(e.target.value)}
          >
            <option value="">Todos os Eletricistas</option>
            {eletricistasAtivos.map((el) => (
              <option key={el.id} value={el.id}>{el.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Mês</label>
          <input
            type="month"
            className="form-control"
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
          />
        </div>
        <div>
          <button type="submit" className="btn btn-outline-warning">Filtrar</button>
          <button type="button" className="btn btn-outline-secondary ms-2" onClick={handleLimparFiltros} title="Limpar Filtros">
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
      </form>

      {erro && <ErroCarregamento mensagem={erro} onTentarNovamente={carregar} />}

      {carregando ? (
        <Carregando texto="Carregando metas..." />
      ) : (
        <>
          <table className="table table-dark table-hover table-bordered custom-table text-center tabela-eletrotech mt-3">
            <thead>
              <tr>
                <th style={{ width: "15%" }}>Ações</th>
                <th style={{ width: "40%" }}>Eletricista</th>
                <th style={{ width: "20%" }}>Mês de Referência</th>
                <th style={{ width: "15%" }}>Valor da Meta</th>
                <th style={{ width: "10%" }}>ID</th>
              </tr>
            </thead>
            <tbody>
              {paginaAtual.length > 0 ? (
                paginaAtual.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => {
                          setEditando({ id: m.id, nome_eletricista: m.nome_eletricista, mes_meta: m.mes_meta, vlr_meta: m.vlr_meta });
                          setModalEditar(true);
                        }}
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>{" "}
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleExcluir(m.id)}>
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                    <td>{m.nome_eletricista}</td>
                    <td>{m.mes_meta || "-"}</td>
                    <td>R$ {Number(m.vlr_meta).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td>{m.id}</td>
                  </tr>
                ))
              ) : (
                <ListaVazia texto="Nenhuma meta encontrada para os filtros selecionados." />
              )}
            </tbody>
          </table>
          <Pagination totalRows={totalRows} page={pagina} porPagina={POR_PAGINA} onChange={setPagina} />
        </>
      )}

      <Modal aberto={modalNova} onFechar={() => setModalNova(false)} titulo="Cadastrar Meta">
        <form className="eletrotech-form" onSubmit={handleNova}>
          <label>Eletricista</label>
          <select
            required
            value={nova.eletricista_meta}
            onChange={(e) => setNova({ ...nova, eletricista_meta: e.target.value })}
          >
            <option value="" disabled hidden>Selecione um eletricista ativo...</option>
            {eletricistasAtivos.map((el) => (
              <option key={el.id} value={el.id}>{el.nome}</option>
            ))}
          </select>
          <label>Mês de referência</label>
          <input
            type="month"
            required
            value={nova.mes_meta}
            onChange={(e) => setNova({ ...nova, mes_meta: e.target.value })}
          />
          <label>Valor da meta (R$)</label>
          <input
            type="number"
            step="0.01"
            placeholder="Ex: 5000.00"
            required
            value={nova.vlr_meta}
            onChange={(e) => setNova({ ...nova, vlr_meta: e.target.value })}
          />
          <button type="submit" className="btn-submit mt-3" disabled={salvando}>
            {salvando ? "Salvando..." : "Cadastrar"}
          </button>
        </form>
      </Modal>

      <Modal aberto={modalEditar} onFechar={() => setModalEditar(false)} titulo="Editar Meta">
        <form className="eletrotech-form" onSubmit={handleEditar}>
          <label>Eletricista</label>
          <p style={{ fontWeight: 700 }}>{editando.nome_eletricista}</p>
          <label>Mês de referência</label>
          <p>{editando.mes_meta}</p>
          <label>Valor da meta (R$)</label>
          <input
            type="number"
            step="0.01"
            required
            value={editando.vlr_meta}
            onChange={(e) => setEditando({ ...editando, vlr_meta: e.target.value })}
          />
          <button type="submit" className="btn-submit mt-3" disabled={salvando}>
            {salvando ? "Salvando..." : "Gravar Alterações"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
