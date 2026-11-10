import { useEffect, useState } from "react";
import * as consultaApi from "../api/consultaChecklist";
import Relatorio from "../components/Relatorio";
import { dataBr } from "../lib/formatters";
import Modal from "../components/Modal";
import { Carregando, ErroCarregamento, ListaVazia } from "../components/EstadoLista";
import { useNotificacao } from "../context/NotificacaoContext";

export default function ConsultaChecklistPage() {
  const { notificar } = useNotificacao();
  const [lista, setLista] = useState([]);
  const [eletricistas, setEletricistas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroEletricista, setFiltroEletricista] = useState("");
  const [ordenar, setOrdenar] = useState("data_desc");

  const [modalFinalizar, setModalFinalizar] = useState(false);
  const [selecionado, setSelecionado] = useState({ id_os: null, tipo: "" });
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [relatorio, setRelatorio] = useState(null);
  async function abrirRelatorio(id, tipo) {
    try { const { data } = await consultaApi.relatorioChecklist(id,tipo); setRelatorio(data); }
    catch (err) { notificar(err.response?.data?.mensagem || 'Erro ao carregar relatório.', 'erro'); }
  }

  function carregar(filtros = {}) {
    setCarregando(true);
    setErro("");
    consultaApi
      .listarConsultaChecklist({
        tipo: filtros.tipo ?? filtroTipo,
        eletricista: filtros.eletricista ?? filtroEletricista,
        ordenar: filtros.ordenar ?? ordenar,
      })
      .then((res) => setLista(res.data?.bloqueados ?? res.data ?? []))
      .catch(() => setErro("Não foi possível carregar as pendências de checklist."))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregar();
    consultaApi
      .opcoesConsultaChecklist()
      .then((res) => setEletricistas(res.data?.eletricistas ?? res.data ?? []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFiltrar(e) {
    e.preventDefault();
    carregar();
  }

  function handleLimpar() {
    setFiltroTipo("");
    setFiltroEletricista("");
    setOrdenar("data_desc");
    carregar({ tipo: "", eletricista: "", ordenar: "data_desc" });
  }

  function abrirModalFinalizar(idOs, tipo) {
    setSelecionado({ id_os: idOs, tipo });
    setObservacao("");
    setModalFinalizar(true);
  }

  async function handleFinalizar(acao) {
    if (!observacao.trim()) {
      notificar("Descreva o motivo da decisão.", "erro");
      return;
    }
    setEnviando(true);
    try {
      const { data } = await consultaApi.finalizarConsultaChecklist({
        id_os: selecionado.id_os,
        tipo: selecionado.tipo,
        observacao,
        acao,
      });
      notificar(data.mensagem);
      setModalFinalizar(false);
      carregar();
    } catch (err) {
      notificar(err.response?.data?.mensagem || "Erro ao registrar decisão.", "erro");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Consulta Checklist</h1>
        <p>OSs bloqueadas por respostas negativas no checklist, à espera de decisão.</p>
      </div>

      <form onSubmit={handleFiltrar} className="filtro-mes justify-content-center">
        <div>
          <label>Tipo</label>
          <select className="form-select" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="">Todos</option>
            <option value="inicio">Início</option>
            <option value="fim">Fim</option>
          </select>
        </div>
        <div>
          <label>Eletricista</label>
          <select className="form-select" value={filtroEletricista} onChange={(e) => setFiltroEletricista(e.target.value)}>
            <option value="">Todos</option>
            {eletricistas.map((el) => (
              <option key={el.id} value={el.id}>{el.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Ordenar</label>
          <select className="form-select" value={ordenar} onChange={(e) => setOrdenar(e.target.value)}>
            <option value="data_desc">Bloqueio (mais recente)</option>
            <option value="data_asc">Bloqueio (mais antigo)</option>
            <option value="os_asc">OS (crescente)</option>
            <option value="os_desc">OS (decrescente)</option>
            <option value="eletricista_asc">Eletricista (A-Z)</option>
            <option value="eletricista_desc">Eletricista (Z-A)</option>
          </select>
        </div>
        <div>
          <button type="submit" className="btn btn-outline-warning">Filtrar</button>
          <button type="button" className="btn btn-outline-secondary ms-2" onClick={handleLimpar} title="Limpar Filtros">
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
      </form>

      {erro && <ErroCarregamento mensagem={erro} onTentarNovamente={carregar} />}

      {carregando ? (
        <Carregando texto="Carregando pendências..." />
      ) : (
        <table className="table table-dark table-hover table-bordered custom-table text-center tabela-eletrotech mt-3">
          <thead>
            <tr>
              <th style={{ width: "15%" }}>Ações</th>
              <th>OS</th>
              <th>Eletricista</th>
              <th>Tipo</th>
              <th>Status da OS</th>
              <th>Bloqueado em</th>
            </tr>
          </thead>
          <tbody>
            {lista.length > 0 ? (
              lista.map((c) => (
                <tr key={`${c.id_os}-${c.tipo}`}>
                  <td>
                    <button type="button" onClick={() => abrirRelatorio(c.id_os,c.tipo)} className="btn btn-sm btn-outline-info" title="Gerar relatório"><i className="fa-solid fa-file-lines" /></button>{" "}
                    <button className="btn btn-sm btn-outline-warning" onClick={() => abrirModalFinalizar(c.id_os, c.tipo)}>
                      Decidir
                    </button>
                  </td>
                  <td>{c.id_os}</td>
                  <td>{c.nome_eletricista}</td>
                  <td>{c.origem === "manual" ? "Bloqueio manual" : c.tipo}<small className="d-block">{c.decisao === "negar" ? "Negada: permanece bloqueada" : "Aguardando revisão"}</small></td>
                  <td>{c.status_os}</td>
                  <td>{c.data_bloqueio ? new Date(c.data_bloqueio).toLocaleString("pt-BR") : "-"}</td>
                </tr>
              ))
            ) : (
              <ListaVazia texto="Nenhuma pendência de checklist encontrada." />
            )}
          </tbody>
        </table>
      )}

      <Relatorio aberto={!!relatorio} onFechar={() => setRelatorio(null)} titulo={`Checklist da OS #${relatorio?.ordem?.id || ''}`}>
        {relatorio && <><p>Eletricista: {relatorio.ordem.nome_eletricista} · Data: {dataBr(relatorio.ordem.data_os)} · Status: {relatorio.ordem.status}</p><p>Tipo: {relatorio.tipo} · Origem: {relatorio.pendencia?.origem || 'Checklist'}</p><p>Observação: {relatorio.pendencia?.observacao || '—'}</p><table className="table table-dark table-bordered"><thead><tr><th>Pergunta</th><th>Resposta</th><th>Justificativa</th></tr></thead><tbody>{relatorio.respostas.map(r => <tr key={r.id}><td>{r.texto_pergunta}</td><td>{r.resposta}</td><td>{r.motivo_nao || '—'}</td></tr>)}</tbody></table></>}
      </Relatorio>
      <Modal aberto={modalFinalizar} onFechar={() => setModalFinalizar(false)} titulo="Decidir Pendência de Checklist">
        <div className="eletrotech-form">
          <label>Observação</label>
          <textarea
            placeholder="Descreva o motivo da decisão..."
            required
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          ></textarea>
          <div className="d-flex gap-2 mt-2">
            <button
              type="button"
              className="btn-submit flex-fill"
              disabled={enviando}
              onClick={() => handleFinalizar("autorizar")}
            >
              Autorizar
            </button>
            <button
              type="button"
              className="btn-submit flex-fill"
              style={{ backgroundColor: "#dc3545", color: "#fff" }}
              disabled={enviando}
              onClick={() => handleFinalizar("negar")}
            >
              Negar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
