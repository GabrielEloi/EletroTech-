import { useEffect, useState } from "react";
import * as checklistApi from "../api/checklist";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import { Carregando, ErroCarregamento, ListaVazia } from "../components/EstadoLista";
import { useNotificacao } from "../context/NotificacaoContext";

const POR_PAGINA = 10;

function perguntaVazia() {
  return { pergunta: "", tipo_resposta: "text", bloqueia_abertura: "" };
}

export default function ChecklistPage() {
  const { notificar } = useNotificacao();
  const [checklists, setChecklists] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [pagina, setPagina] = useState(1);
  const [salvando, setSalvando] = useState(false);

  const [filtroTitulo, setFiltroTitulo] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  const [modalNovo, setModalNovo] = useState(false);
  const [modalPerguntas, setModalPerguntas] = useState(false);
  const [perguntasVisualizadas, setPerguntasVisualizadas] = useState([]);
  const [carregandoPerguntas, setCarregandoPerguntas] = useState(false);

  const [novo, setNovo] = useState({ titulo: "", tipo: "" });
  const [perguntas, setPerguntas] = useState([perguntaVazia()]);

  function carregar(filtros = {}) {
    setCarregando(true);
    setErro("");
    checklistApi
      .listarChecklists({
        titulo: filtros.titulo ?? filtroTitulo,
        tipo: filtros.tipo ?? filtroTipo,
      })
      .then((res) => setChecklists(res.data?.checklists ?? res.data ?? []))
      .catch(() => setErro("Não foi possível carregar os checklists."))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFiltrar(e) {
    e.preventDefault();
    setPagina(1);
    carregar();
  }

  function handleLimpar() {
    setFiltroTitulo("");
    setFiltroTipo("");
    carregar({ titulo: "", tipo: "" });
  }

  function atualizarPergunta(index, campo, valor) {
    setPerguntas((lista) => lista.map((p, i) => (i === index ? { ...p, [campo]: valor } : p)));
  }

  function adicionarPergunta() {
    setPerguntas((lista) => [...lista, perguntaVazia()]);
  }

  function removerPergunta(index) {
    setPerguntas((lista) => (lista.length > 1 ? lista.filter((_, i) => i !== index) : lista));
  }

  async function handleCadastrar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      await checklistApi.cadastrarChecklist({
        titulo: novo.titulo,
        tipo: novo.tipo,
        pergunta: perguntas.map((p) => p.pergunta),
        tipo_resposta: perguntas.map((p) => p.tipo_resposta),
        bloqueia_abertura: perguntas.map((p) => p.bloqueia_abertura),
      });
      notificar("Checklist cadastrado com sucesso.");
      setModalNovo(false);
      setNovo({ titulo: "", tipo: "" });
      setPerguntas([perguntaVazia()]);
      carregar();
    } catch (err) {
      notificar(err.response?.data?.mensagem || "Erro ao cadastrar checklist.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  async function handleSelecionar(checklist) {
    try {
      await checklistApi.selecionarChecklist({ id_checklist: checklist.id, tipo: checklist.tipo });
      notificar(`Checklist "${checklist.titulo}" definido como padrão para ${checklist.tipo}.`);
      carregar();
    } catch (err) {
      notificar(err.response?.data?.mensagem || "Erro ao selecionar checklist.", "erro");
    }
  }

  async function handleExcluir(id) {
    if (!window.confirm("Tem certeza que deseja excluir este checklist?")) return;
    try {
      await checklistApi.excluirChecklist(id);
      notificar("Checklist excluído.");
      carregar();
    } catch (err) {
      notificar(err.response?.data?.mensagem || "Erro ao excluir checklist.", "erro");
    }
  }

  async function handleVerPerguntas(id) {
    setModalPerguntas(true);
    setCarregandoPerguntas(true);
    try {
      const { data } = await checklistApi.perguntasChecklist(id);
      setPerguntasVisualizadas(data?.perguntas ?? data ?? []);
    } catch {
      setPerguntasVisualizadas([]);
    } finally {
      setCarregandoPerguntas(false);
    }
  }

  const totalRows = checklists.length;
  const inicio = (pagina - 1) * POR_PAGINA;
  const paginaAtual = checklists.slice(inicio, inicio + POR_PAGINA);

  return (
    <div className="container">
      <div className="page-header">
        <h1>Checklist</h1>
        <p>Modelos de checklist para abertura e fechamento de OS.</p>
      </div>

      <div id="acoes_id">
        <button type="button" onClick={() => setModalNovo(true)}>
          <i className="fa-solid fa-plus"></i> Novo Checklist
        </button>
      </div>

      <form onSubmit={handleFiltrar} className="filtro-mes justify-content-center">
        <div>
          <label>Título</label>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por título..."
            value={filtroTitulo}
            onChange={(e) => setFiltroTitulo(e.target.value)}
          />
        </div>
        <div>
          <label>Tipo</label>
          <select className="form-select" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="">Todos</option>
            <option value="inicio">Início</option>
            <option value="fim">Fim</option>
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
        <Carregando texto="Carregando checklists..." />
      ) : (
        <>
          <table className="table table-dark table-hover table-bordered custom-table text-center tabela-eletrotech mt-3">
            <thead>
              <tr>
                <th style={{ width: "8%" }}>Ações</th>
                <th style={{ width: "5%" }}>ID</th>
                <th>Título</th>
                <th style={{ width: "12%" }}>Tipo</th>
                <th style={{ width: "12%" }}>Perguntas</th>
                <th style={{ width: "18%" }}>Padrão</th>
              </tr>
            </thead>
            <tbody>
              {paginaAtual.length > 0 ? (
                paginaAtual.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <button className="btn btn-sm btn-outline-info" onClick={() => handleVerPerguntas(c.id)} title="Ver perguntas">
                        <i className="fa-solid fa-list"></i>
                      </button>{" "}
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleExcluir(c.id)} title="Excluir">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                    <td>{c.id}</td>
                    <td>{c.titulo}</td>
                    <td className="text-capitalize">{c.tipo}</td>
                    <td>{c.qtd_perguntas ?? "-"}</td>
                    <td>
                      {c.selecionado ? (
                        <span className="badge" style={{ backgroundColor: "#FBD814", color: "#282828" }}>Padrão atual</span>
                      ) : (
                        <button className="btn btn-sm btn-outline-warning" onClick={() => handleSelecionar(c)}>
                          Definir como padrão
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <ListaVazia texto="Nenhum checklist encontrado." />
              )}
            </tbody>
          </table>
          <Pagination totalRows={totalRows} page={pagina} porPagina={POR_PAGINA} onChange={setPagina} />
        </>
      )}

      <Modal aberto={modalNovo} onFechar={() => setModalNovo(false)} titulo="Novo Checklist">
        <form className="eletrotech-form" onSubmit={handleCadastrar}>
          <label>Título</label>
          <input
            type="text"
            placeholder="Ex: Checklist de abertura de OS"
            required
            value={novo.titulo}
            onChange={(e) => setNovo({ ...novo, titulo: e.target.value })}
          />
          <label>Tipo</label>
          <select required value={novo.tipo} onChange={(e) => setNovo({ ...novo, tipo: e.target.value })}>
            <option value="" disabled hidden>Selecione o tipo</option>
            <option value="inicio">Início</option>
            <option value="fim">Fim</option>
          </select>

          <label className="mt-2">Perguntas</label>
          {perguntas.map((p, i) => (
            <div key={i} className="d-flex flex-column gap-2 mb-3 p-2" style={{ border: "1px solid #444", borderRadius: 8 }}>
              <textarea
                placeholder="Digite a pergunta"
                required
                value={p.pergunta}
                onChange={(e) => atualizarPergunta(i, "pergunta", e.target.value)}
                style={{ marginBottom: 0 }}
              ></textarea>
              <div className="d-flex gap-2">
                <select
                  value={p.tipo_resposta}
                  onChange={(e) => atualizarPergunta(i, "tipo_resposta", e.target.value)}
                  style={{ marginBottom: 0 }}
                >
                  <option value="text">Text</option>
                  <option value="radio">Radio (Sim/Não)</option>
                </select>
                {p.tipo_resposta === "radio" && (
                  <input
                    type="text"
                    placeholder="Vazio = nunca bloqueia"
                    value={p.bloqueia_abertura}
                    onChange={(e) => atualizarPergunta(i, "bloqueia_abertura", e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                )}
              </div>
              {perguntas.length > 1 && (
                <button type="button" className="btn btn-sm btn-outline-danger align-self-end" onClick={() => removerPergunta(i)}>
                  Remover
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-sm btn-outline-light mb-3" onClick={adicionarPergunta}>
            <i className="fa-solid fa-plus"></i> Adicionar pergunta
          </button>

          <button type="submit" className="btn-submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Cadastrar Checklist"}
          </button>
        </form>
      </Modal>

      <Modal aberto={modalPerguntas} onFechar={() => setModalPerguntas(false)} titulo="Perguntas do Checklist">
        {carregandoPerguntas ? (
          <Carregando texto="Carregando perguntas..." />
        ) : perguntasVisualizadas.length > 0 ? (
          <table className="table table-dark table-sm table-bordered text-center">
            <thead>
              <tr>
                <th>Pergunta</th>
                <th>Tipo</th>
                <th>Bloqueia se</th>
              </tr>
            </thead>
            <tbody>
              {perguntasVisualizadas.map((p, i) => (
                <tr key={i}>
                  <td>{p.pergunta}</td>
                  <td className="text-capitalize">{p.tipo_resposta}</td>
                  <td>{p.bloqueia_abertura || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-muted">Nenhuma pergunta cadastrada.</p>
        )}
      </Modal>
    </div>
  );
}
