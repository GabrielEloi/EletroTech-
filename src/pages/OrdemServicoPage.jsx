import { useCallback, useEffect, useState } from "react";
import * as osApi from "../api/ordensServico";
import Modal from "../components/Modal";
import ModalDetalhesOs from "../components/ModalDetalhesOs";
import Pagination from "../components/Pagination";
import { Carregando, ErroCarregamento, ListaVazia } from "../components/EstadoLista";
import { useNotificacao } from "../context/NotificacaoContext";
import { hoje } from "../lib/formatters";
import { useAuth } from "../context/auth-store";

const POR_PAGINA = 10;
const FILTROS = [
  { chave: "todas", rotulo: "Todas" },
  { chave: "solicitada", rotulo: "Solicitadas" },
  { chave: "aberta", rotulo: "Abertas" },
  { chave: "fechada", rotulo: "Fechadas" },
  { chave: "bloqueada", rotulo: "Bloqueadas" },
];

const STATUS_BADGE = {
  bloqueada: <span className="badge bg-danger">Bloqueada</span>,
  solicitada: <span className="badge bg-warning text-dark">Solicitada</span>,
  aberta: <span className="badge bg-success">Aberta</span>,
  fechada: <span className="badge bg-secondary">Fechada</span>,
};

export default function OrdemServicoPage() {
  const { ehAdmin, ehSupervisor } = useAuth();
  const { notificar } = useNotificacao();

  const [dadosPagina, setDadosPagina] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [pagina, setPagina] = useState(1);
  const [filtroStatus, setFiltroStatus] = useState("todas");
  const [salvando, setSalvando] = useState(false);

  const [modalSolicitar, setModalSolicitar] = useState(false);
  const [modalAbrir, setModalAbrir] = useState(false);
  const [modalFechar, setModalFechar] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState(false);
  const [idOsSelecionada, setIdOsSelecionada] = useState(null);

  const [solicitacao, setSolicitacao] = useState({ eletricista_os: "", data_os: "", valor_servico: "0", descricao: "", local_servico: "" });
  const [materiais, setMateriais] = useState([]);
  const [respostasInicio, setRespostasInicio] = useState({});
  const [respostasFim, setRespostasFim] = useState({});
  const [motivosFim, setMotivosFim] = useState({});
  const [fotoInicio, setFotoInicio] = useState(null), [fotoFim, setFotoFim] = useState(null);
  const [bloqueio, setBloqueio] = useState(null), [motivoBloqueio, setMotivoBloqueio] = useState("");
  async function bloquear(e) {
    e.preventDefault(); setSalvando(true);
    try {
      const { data } = await osApi.bloquearOrdemServico(bloqueio, motivoBloqueio);
      notificar(data.mensagem); setBloqueio(null); carregar();
    } catch (err) { notificar(err.response?.data?.mensagem || "Erro ao bloquear OS.", "erro"); }
    finally { setSalvando(false); }
  }

  const carregar = useCallback(() => {
    setCarregando(true);
    setErro("");
    osApi
      .listarOrdensServico({ page: pagina, pageSize: POR_PAGINA, status: filtroStatus })
      .then((res) => setDadosPagina(res.data))
      .catch(() => setErro("Não foi possível carregar as ordens de serviço."))
      .finally(() => setCarregando(false));
  }, [pagina, filtroStatus]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const ordensServico = dadosPagina?.ordensServico ?? [];
  const eletricistasAtivos = dadosPagina?.eletricistasAtivos ?? [];
  const produtosDisponiveis = dadosPagina?.produtosDisponiveis ?? [];
  const checklistInicio = dadosPagina?.checklistInicio;
  const checklistFim = dadosPagina?.checklistFim;
  // Supervisores também atribuem novas ordens de serviço à equipe.
  const podeSolicitar = dadosPagina?.podeSolicitar ?? (ehAdmin || ehSupervisor);

// A paginação e o status são aplicados na API após o filtro de propriedade.
  const totalRows = dadosPagina?.paginacao?.total ?? 0;
  const paginaAtual = ordensServico;

  async function handleSolicitar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      await osApi.solicitarOrdemServico(solicitacao);
      notificar("Ordem de serviço solicitada.");
      setModalSolicitar(false);
      setSolicitacao({ eletricista_os: "", data_os: "", valor_servico: "0", descricao: "", local_servico: "" });
      carregar();
    } catch (err) {
      notificar(err.response?.data?.mensagem || "Erro ao solicitar OS.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  function abrirModalAbertura(idOs) {
    setIdOsSelecionada(idOs);
    setMateriais([]);
    setFotoInicio(null);
    setRespostasInicio({});
    setModalAbrir(true);
  }

  function abrirModalFechamento(idOs) {
    setIdOsSelecionada(idOs);
    setRespostasFim({});
    setFotoFim(null);
    setMotivosFim({});
    setModalFechar(true);
  }

  function abrirModalDetalhes(idOs) {
    setIdOsSelecionada(idOs);
    setModalDetalhes(true);
  }

  function atualizarMaterial(index, campo, valor) {
    setMateriais((lista) => lista.map((m, i) => (i === index ? { ...m, [campo]: valor } : m)));
  }

  function adicionarMaterial() {
    setMateriais((lista) => [...lista, { id_produto: "", qtd_utilizada: "" }]);
  }

  function removerMaterial(index) {
    setMateriais((lista) => lista.filter((_, i) => i !== index));
  }

  async function handleAbrir(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      const { data } = await osApi.abrirOrdemServico({
        id_os: idOsSelecionada,
        id_produto: materiais.map((m) => m.id_produto),
        qtd_utilizada: materiais.map((m) => m.qtd_utilizada),
        checklist_resposta: respostasInicio, foto: fotoInicio,
      });
      notificar(data.mensagem);
      setModalAbrir(false);
      carregar();
    } catch (err) {
      notificar(err.response?.data?.mensagem || "Erro ao abrir OS.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  async function handleFechar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      const { data } = await osApi.fecharOrdemServico({
        id_os: idOsSelecionada,
        checklist_resposta: respostasFim,
        motivos: motivosFim, foto: fotoFim,
      });
      notificar(data.mensagem);
      setModalFechar(false);
      carregar();
    } catch (err) {
      notificar(err.response?.data?.mensagem || "Erro ao fechar OS.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Ordens de Serviço</h1>
        <p>Solicitação, abertura e fechamento de ordens de serviço.</p>
      </div>

      <div id="acoes_id">
        {podeSolicitar && (
          <button type="button" onClick={() => setModalSolicitar(true)}>
            <i className="fa-solid fa-plus"></i> Solicitar OS
          </button>
        )}
      </div>

      <div className="d-flex justify-content-center gap-2 flex-wrap mb-3">
        {FILTROS.map((f) => (
          <button
            key={f.chave}
            type="button"
            className={`btn btn-sm ${filtroStatus === f.chave ? "btn-warning" : "btn-outline-warning"}`}
            onClick={() => {
              setFiltroStatus(f.chave);
              setPagina(1);
            }}
          >
            {f.rotulo}
          </button>
        ))}
      </div>

      {erro && <ErroCarregamento mensagem={erro} onTentarNovamente={carregar} />}

      {carregando ? (
        <Carregando texto="Carregando ordens de serviço..." />
      ) : (
        <>
          <table className="table table-dark table-hover table-bordered custom-table text-center tabela-eletrotech">
            <thead>
              <tr>
                <th style={{ width: "16%" }}>Ações</th>
                <th style={{ width: "28%" }}>Eletricista Responsável</th>
                <th style={{ width: "15%" }}>Data da Operação</th>
                <th style={{ width: "15%" }}>Data de Fechamento</th>
                <th style={{ width: "12%" }}>Status</th>
                <th style={{ width: "14%" }}>ID OS</th>
              </tr>
            </thead>
            <tbody>
              {paginaAtual.length > 0 ? (
                paginaAtual.map((os) => (
                  <tr key={os.id}>
                    <td>
                      <button className="btn btn-sm btn-outline-light" onClick={() => abrirModalDetalhes(os.id)} title="Ver detalhes">
                        <i className="fa-solid fa-eye"></i>
                      </button>{" "}
                      {os.status === "solicitada" && (
                        <button className="btn btn-sm btn-outline-warning" disabled={os.data_os > hoje()} onClick={() => abrirModalAbertura(os.id)} title={os.data_os > hoje() ? "Aguarde a data programada" : "Abrir"}>
                          <i className="fa-solid fa-play"></i>
                        </button>
                      )}
                      {podeSolicitar && ['solicitada','aberta'].includes(os.status) && <button className="btn btn-sm btn-outline-danger ms-1" title="Bloquear OS" onClick={() => { setBloqueio(os.id); setMotivoBloqueio(''); }}><i className="fa-solid fa-ban" /></button>}
                      {os.status === "aberta" && (
                        <button className="btn btn-sm btn-outline-success" onClick={() => abrirModalFechamento(os.id)} title="Fechar">
                          <i className="fa-solid fa-check"></i>
                        </button>
                      )}
                    </td>
                    <td>{os.nome_eletricista}</td>
                    <td>{os.data_os || "-"}</td>
                    <td>{os.data_fechamento || "-"}</td>
                    <td>{STATUS_BADGE[os.status] || os.status}</td>
                    <td>{os.id}</td>
                  </tr>
                ))
              ) : (
                <ListaVazia texto="Nenhuma ordem de serviço encontrada." />
              )}
            </tbody>
          </table>
          <Pagination totalRows={totalRows} page={pagina} porPagina={POR_PAGINA} onChange={setPagina} />
        </>
      )}

      {/* Modal: solicitar OS */}
      <Modal aberto={modalSolicitar} onFechar={() => setModalSolicitar(false)} titulo="Solicitar Ordem de Serviço">
        <form className="eletrotech-form" onSubmit={handleSolicitar}>
          <label>Eletricista</label>
          <select
            required
            value={solicitacao.eletricista_os}
            onChange={(e) => setSolicitacao({ ...solicitacao, eletricista_os: e.target.value })}
          >
            <option value="" disabled hidden>Selecione (Apenas Ativos)</option>
            {eletricistasAtivos.map((el) => (
              <option key={el.id} value={el.id}>{el.nome}</option>
            ))}
          </select>
          <label>Data da operação</label>
          <input
            type="date"
            value={solicitacao.data_os}
            onChange={(e) => setSolicitacao({ ...solicitacao, data_os: e.target.value })}
          />
          <label>Descrição do serviço</label><textarea maxLength={4000} value={solicitacao.descricao} onChange={e => setSolicitacao({ ...solicitacao, descricao: e.target.value })} />
          <label>Local do serviço</label><input maxLength={255} value={solicitacao.local_servico} onChange={e => setSolicitacao({ ...solicitacao, local_servico: e.target.value })} />
          <label>Valor do serviço (R$)</label><input type="number" min="0" step="0.01" required value={solicitacao.valor_servico} onChange={e => setSolicitacao({ ...solicitacao, valor_servico: e.target.value })} />
          <small className="text-muted">Este valor conta para o faturamento quando a OS for fechada.</small>
          <button type="submit" className="btn-submit mt-3" disabled={salvando}>
            {salvando ? "Enviando..." : "Solicitar"}
          </button>
        </form>
      </Modal>

      {/* Modal: abrir OS */}
      <Modal aberto={modalAbrir} onFechar={() => setModalAbrir(false)} titulo="Abrir Ordem de Serviço">
        <form className="eletrotech-form" onSubmit={handleAbrir}>
          <label>Materiais utilizados (opcional)</label>
          {!materiais.length && <p className="text-muted">Adicione os materiais utilizados, se houver.</p>}
          {materiais.map((m, i) => (
            <div key={i} className="d-flex gap-2 align-items-center mb-2">
              <select
                required
                style={{ flex: 2 }}
                value={m.id_produto}
                onChange={(e) => atualizarMaterial(i, "id_produto", e.target.value)}
              >
                <option value="" disabled hidden>Selecione o material...</option>
                {produtosDisponiveis.length > 0 ? (
                  produtosDisponiveis.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome_produto} (Estoque: {p.qtd_estoque})</option>
                  ))
                ) : (
                  <option value="" disabled>Nenhum material com estoque disponível</option>
                )}
              </select>
              <input
                type="number"
                min="1"
                placeholder="Ex: 5"
                required
                style={{ flex: 1 }}
                value={m.qtd_utilizada}
                onChange={(e) => atualizarMaterial(i, "qtd_utilizada", e.target.value)}
              />
              {materiais.length > 0 && (
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removerMaterial(i)}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="btn btn-sm btn-outline-warning mt-2 mb-3"
            style={{ borderRadius: 20, fontWeight: "bold" }}
            onClick={adicionarMaterial}
          >
            <i className="fa-solid fa-plus"></i> Adicionar material
          </button>

          {checklistInicio?.perguntas?.length > 0 && (
            <>
              <label className="mt-2">Checklist de início — {checklistInicio.titulo}</label>
              {checklistInicio.perguntas.map((p) => (
                <div key={p.id} className="mb-2">
                  <label style={{ textTransform: "none", fontWeight: 400 }}>{p.pergunta}</label>
                  {p.tipo_resposta === "sim_nao" ? (
                    <select
                      required
                      value={respostasInicio[p.id] || ""}
                      onChange={(e) => setRespostasInicio({ ...respostasInicio, [p.id]: e.target.value })}
                    >
                      <option value="" disabled hidden>Selecione sim ou não</option>
                      <option value="sim">Sim</option>
                      <option value="nao">Não</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Digite a resposta"
                      required
                      value={respostasInicio[p.id] || ""}
                      onChange={(e) => setRespostasInicio({ ...respostasInicio, [p.id]: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </>
          )}

          <label>Foto de início (opcional, até 8 MB)</label><input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={e => setFotoInicio(e.target.files[0] || null)} />
          <button type="submit" className="btn-submit mt-3" disabled={salvando || !checklistInicio?.perguntas?.length}>
            {salvando ? "Abrindo..." : "Abrir OS"}
          </button>
        </form>
      </Modal>

      {/* Modal: fechar OS */}
      <Modal aberto={modalFechar} onFechar={() => setModalFechar(false)} titulo="Fechar Ordem de Serviço">
        <form className="eletrotech-form" onSubmit={handleFechar}>
          {checklistFim?.perguntas?.length > 0 ? (
            checklistFim.perguntas.map((p) => (
              <div key={p.id} className="mb-2">
                <label style={{ textTransform: "none", fontWeight: 400 }}>{p.pergunta}</label>
                {p.tipo_resposta === "sim_nao" ? (
                  <>
                    <select
                      required
                      value={respostasFim[p.id] || ""}
                      onChange={(e) => setRespostasFim({ ...respostasFim, [p.id]: e.target.value })}
                    >
                      <option value="" disabled hidden>Selecione sim ou não</option>
                      <option value="sim">Sim</option>
                      <option value="nao">Não</option>
                    </select>
                    {respostasFim[p.id] === "nao" && p.bloqueia_normalizado === "nao" && (
                      <input
                        type="text"
                        placeholder="Justifique a resposta negativa"
                        required
                        value={motivosFim[p.id] || ""}
                        onChange={(e) => setMotivosFim({ ...motivosFim, [p.id]: e.target.value })}
                      />
                    )}
                  </>
                ) : (
                  <input
                    type="text"
                    placeholder="Digite a resposta"
                    required
                    value={respostasFim[p.id] || ""}
                    onChange={(e) => setRespostasFim({ ...respostasFim, [p.id]: e.target.value })}
                  />
                )}
              </div>
            ))
          ) : (
            <p className="text-muted">Nenhum checklist de fechamento configurado.</p>
          )}
          <label>Foto de fechamento (opcional, até 8 MB)</label><input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={e => setFotoFim(e.target.files[0] || null)} />
          <button type="submit" className="btn-submit mt-3" disabled={salvando || !checklistFim?.perguntas?.length}>
            {salvando ? "Fechando..." : "Fechar OS"}
          </button>
        </form>
      </Modal>

      <Modal aberto={!!bloqueio} onFechar={() => !salvando && setBloqueio(null)} titulo="Bloquear OS">
        <form className="eletrotech-form" onSubmit={bloquear}><label>Motivo do bloqueio</label><textarea required maxLength={4000} value={motivoBloqueio} onChange={e => setMotivoBloqueio(e.target.value)} /><button className="btn-submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Bloquear OS'}</button></form>
      </Modal>
      <ModalDetalhesOs idOs={idOsSelecionada} aberto={modalDetalhes} onFechar={() => setModalDetalhes(false)} />
    </div>
  );
}
