import { useEffect, useState } from "react";
import * as eletricistasApi from "../api/eletricistas";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import { Carregando, ErroCarregamento, ListaVazia } from "../components/EstadoLista";
import { useNotificacao } from "../context/NotificacaoContext";

const POR_PAGINA = 10;

export default function EletricistasPage() {
  const { notificar } = useNotificacao();
  const [lista, setLista] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [pagina, setPagina] = useState(1);
  const [salvando, setSalvando] = useState(false);

  const [modalNovo, setModalNovo] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [novo, setNovo] = useState({ cpf: "", nome: "", data_contratacao: "", senha: "" });
  const [editando, setEditando] = useState({ id: null, nome: "", senha: "" });

  function carregar() {
    setCarregando(true);
    setErro("");
    eletricistasApi
      .listarEletricistas()
      .then((res) => setLista(res.data?.eletricistas ?? res.data ?? []))
      .catch(() => setErro("Não foi possível carregar os eletricistas."))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleNovo(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      await eletricistasApi.cadastrarEletricista(novo);
      notificar("Eletricista cadastrado com sucesso.");
      setModalNovo(false);
      setNovo({ cpf: "", nome: "", data_contratacao: "", senha: "" });
      carregar();
    } catch (err) {
      notificar(err.response?.data?.mensagem || "Erro ao cadastrar eletricista.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  async function handleEditar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      await eletricistasApi.editarEletricista(editando);
      notificar("Eletricista atualizado com sucesso.");
      setModalEditar(false);
      carregar();
    } catch (err) {
      notificar(err.response?.data?.mensagem || "Erro ao editar eletricista.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  async function handleDemitir(id) {
    if (!window.confirm("Demitir este funcionário?")) return;
    try {
      await eletricistasApi.demitirEletricista(id);
      notificar("Eletricista demitido.");
      carregar();
    } catch (err) {
      notificar(err.response?.data?.mensagem || "Erro ao demitir eletricista.", "erro");
    }
  }

  async function handleReativar(id) {
    if (!window.confirm("Deseja readmitir este eletricista?")) return;
    try {
      await eletricistasApi.reativarEletricista(id);
      notificar("Eletricista reativado.");
      carregar();
    } catch (err) {
      notificar(err.response?.data?.mensagem || "Erro ao reativar eletricista.", "erro");
    }
  }

  const totalRows = lista.length;
  const inicio = (pagina - 1) * POR_PAGINA;
  const paginaAtual = lista.slice(inicio, inicio + POR_PAGINA);

  return (
    <div className="container">
      <div className="page-header">
        <h1>Eletricistas</h1>
        <p>Cadastro e histórico de eletricistas da equipe.</p>
      </div>

      <div id="acoes_id">
        <button type="button" onClick={() => setModalNovo(true)}>
          <i className="fa-solid fa-plus"></i> Novo Eletricista
        </button>
      </div>

      {erro && <ErroCarregamento mensagem={erro} onTentarNovamente={carregar} />}

      {carregando ? (
        <Carregando texto="Carregando eletricistas..." />
      ) : (
        <>
          <table className="table table-dark table-hover table-bordered custom-table text-center tabela-eletrotech">
            <thead>
              <tr>
                <th>Ações</th>
                <th>CPF</th>
                <th>Nome</th>
                <th>Contratação</th>
                <th>Demissão</th>
                <th>Status</th>
                <th>OS Realizadas</th>
                <th>Meta Atual</th>
              </tr>
            </thead>
            <tbody>
              {paginaAtual.length > 0 ? (
                paginaAtual.map((e) => {
                  const ativo = !e.data_demissao;
                  return (
                    <tr key={e.id}>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => {
                            setEditando({ id: e.id, nome: e.nome, senha: "" });
                            setModalEditar(true);
                          }}
                          title="Editar"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>{" "}
                        {ativo ? (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDemitir(e.id)} title="Demitir">
                            <i className="fa-solid fa-user-slash"></i>
                          </button>
                        ) : (
                          <button className="btn btn-sm btn-outline-success" onClick={() => handleReativar(e.id)} title="Reativar">
                            <i className="fa-solid fa-user-check"></i>
                          </button>
                        )}
                      </td>
                      <td>{e.cpf}</td>
                      <td>{e.nome}</td>
                      <td>{e.data_contratacao || "-"}</td>
                      <td>{e.data_demissao || "-"}</td>
                      <td>
                        <span className={`badge ${ativo ? "bg-success" : "bg-secondary"}`}>
                          {ativo ? "Ativo" : "Demitido"}
                        </span>
                      </td>
                      <td>{e.total_os ?? 0}</td>
                      <td>{e.meta_atual > 0 ? `R$ ${Number(e.meta_atual).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "R$ 0,00"}</td>
                    </tr>
                  );
                })
              ) : (
                <ListaVazia texto="Nenhum eletricista cadastrado no momento." />
              )}
            </tbody>
          </table>
          <Pagination totalRows={totalRows} page={pagina} porPagina={POR_PAGINA} onChange={setPagina} />
        </>
      )}

      <Modal aberto={modalNovo} onFechar={() => setModalNovo(false)} titulo="Cadastrar Eletricista">
        <form className="eletrotech-form" onSubmit={handleNovo}>
          <label>CPF</label>
          <input
            type="text"
            placeholder="Apenas números"
            minLength={11}
            maxLength={11}
            required
            value={novo.cpf}
            onChange={(e) => setNovo({ ...novo, cpf: e.target.value })}
          />
          <label>Nome</label>
          <input
            type="text"
            placeholder="Ex: João Silva"
            required
            value={novo.nome}
            onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
          />
          <label>Data de contratação</label>
          <input
            type="date"
            required
            value={novo.data_contratacao}
            onChange={(e) => setNovo({ ...novo, data_contratacao: e.target.value })}
          />
          <label>Senha de acesso</label>
          <input
            type="password"
            placeholder="Mínimo 8 caracteres"
            minLength={8}
            autoComplete="new-password"
            required
            value={novo.senha}
            onChange={(e) => setNovo({ ...novo, senha: e.target.value })}
          />
          <button type="submit" className="btn-submit mt-3" disabled={salvando}>
            {salvando ? "Salvando..." : "Cadastrar"}
          </button>
        </form>
      </Modal>

      <Modal aberto={modalEditar} onFechar={() => setModalEditar(false)} titulo="Editar Eletricista">
        <form className="eletrotech-form" onSubmit={handleEditar}>
          <label>Nome</label>
          <input
            type="text"
            required
            value={editando.nome}
            onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
          />
          <label>Nova senha</label>
          <input
            type="password"
            placeholder="Deixe em branco para manter a atual"
            minLength={8}
            autoComplete="new-password"
            value={editando.senha}
            onChange={(e) => setEditando({ ...editando, senha: e.target.value })}
          />
          <button type="submit" className="btn-submit mt-3" disabled={salvando}>
            {salvando ? "Salvando..." : "Gravar Alterações"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
