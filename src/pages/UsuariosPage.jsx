import { useEffect, useState } from "react";
import * as usuariosApi from "../api/usuarios";
import { PERMISSOES_DISPONIVEIS } from "../constants/permissoes";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import { Carregando, ErroCarregamento, ListaVazia } from "../components/EstadoLista";
import { useNotificacao } from "../context/NotificacaoContext";

const POR_PAGINA = 10;

function formularioVazio() {
  return { id: null, usuario: "", senha: "", is_admin: false, permissoes: [] };
}

export default function UsuariosPage() {
  const { notificar } = useNotificacao();
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [pagina, setPagina] = useState(1);

  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [form, setForm] = useState(formularioVazio());
  const [ehEletricista, setEhEletricista] = useState(false);
  const [salvando, setSalvando] = useState(false);

  function carregar() {
    setCarregando(true);
    setErro("");
    usuariosApi
      .listarUsuarios()
      .then((res) => setUsuarios(res.data?.usuarios ?? res.data ?? []))
      .catch(() => setErro("Não foi possível carregar a lista de usuários."))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregar();
  }, []);

  function togglePermissao(chave) {
    setForm((f) => ({
      ...f,
      permissoes: f.permissoes.includes(chave)
        ? f.permissoes.filter((p) => p !== chave)
        : [...f.permissoes, chave],
    }));
  }

  function abrirCriar() {
    setForm(formularioVazio());
    setModalCriarAberto(true);
  }

  function abrirEditar(usuario) {
    setForm({
      id: usuario.id,
      usuario: usuario.usuario,
      senha: "",
      is_admin: !!Number(usuario.is_admin),
      permissoes: usuario.permissoes || [],
    });
    setEhEletricista(usuario.eletricista_id !== null && usuario.eletricista_id !== undefined);
    setModalEditarAberto(true);
  }

  async function handleCriar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      await usuariosApi.criarUsuario({
        usuario: form.usuario,
        senha: form.senha,
        is_admin: form.is_admin ? 1 : 0,
        permissoes: form.permissoes,
      });
      notificar("Usuário criado com sucesso.");
      setModalCriarAberto(false);
      carregar();
    } catch (err) {
      notificar(err.response?.data?.mensagem || "Erro ao criar usuário.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  async function handleEditar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      await usuariosApi.editarUsuario({
        id: form.id,
        usuario: form.usuario,
        senha: form.senha,
        is_admin: form.is_admin ? 1 : 0,
        permissoes: form.permissoes,
      });
      notificar("Usuário atualizado com sucesso.");
      setModalEditarAberto(false);
      carregar();
    } catch (err) {
      notificar(err.response?.data?.mensagem || "Erro ao editar usuário.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(id) {
    if (!window.confirm("Tem certeza que deseja excluir este usuário?")) return;
    try {
      await usuariosApi.excluirUsuario(id);
      notificar("Usuário excluído.");
      carregar();
    } catch (err) {
      notificar(err.response?.data?.mensagem || "Erro ao excluir usuário.", "erro");
    }
  }

  const totalRows = usuarios.length;
  const inicio = (pagina - 1) * POR_PAGINA;
  const paginaAtual = usuarios.slice(inicio, inicio + POR_PAGINA);

  return (
    <div className="container">
      <div className="page-header">
        <h1>Usuários</h1>
        <p>Gestão de contas de acesso ao sistema.</p>
      </div>

      <div id="acoes_id">
        <button type="button" onClick={abrirCriar}>
          <i className="fa-solid fa-plus"></i> Novo Usuário
        </button>
      </div>

      {erro && <ErroCarregamento mensagem={erro} onTentarNovamente={carregar} />}

      {carregando ? (
        <Carregando texto="Carregando usuários..." />
      ) : (
        <>
          <table className="table table-dark table-hover table-bordered custom-table text-center tabela-eletrotech">
            <thead>
              <tr>
                <th style={{ width: "20%" }}>Ações</th>
                <th style={{ width: "45%" }}>Nome de Usuário</th>
                <th style={{ width: "25%" }}>Perfil</th>
                <th style={{ width: "10%" }}>ID</th>
              </tr>
            </thead>
            <tbody>
              {paginaAtual.length > 0 ? (
                paginaAtual.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => abrirEditar(u)}
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>{" "}
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleExcluir(u.id)}
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                    <td>
                      {u.eletricista_nome ? (
                        <>
                          {u.eletricista_nome}
                          <div className="texto-vazio" style={{ fontSize: 12, color: "#888" }}>
                            login: {u.usuario}
                          </div>
                        </>
                      ) : (
                        u.usuario
                      )}
                    </td>
                    <td>
                      {Number(u.is_admin) === 1 ? (
                        <span className="badge" style={{ backgroundColor: "#FBD814", color: "#282828", fontWeight: "bold" }}>Administrador</span>
                      ) : u.eletricista_id ? (
                        <span className="badge" style={{ backgroundColor: "#555", color: "#eee" }}>Eletricista</span>
                      ) : (
                        <span className="badge" style={{ backgroundColor: "#555", color: "#eee" }}>Padrão</span>
                      )}
                    </td>
                    <td>{u.id}</td>
                  </tr>
                ))
              ) : (
                <ListaVazia texto="Nenhum usuário cadastrado no momento." />
              )}
            </tbody>
          </table>
          <Pagination totalRows={totalRows} page={pagina} porPagina={POR_PAGINA} onChange={setPagina} />
        </>
      )}

      <Modal aberto={modalCriarAberto} onFechar={() => setModalCriarAberto(false)} titulo="Novo Usuário">
        <form className="eletrotech-form" onSubmit={handleCriar}>
          <label className="campo">Nome de Usuário</label>
          <input
            type="text"
            required
            value={form.usuario}
            onChange={(e) => setForm({ ...form, usuario: e.target.value })}
          />

          <label className="campo">Senha (mín. 8 caracteres)</label>
          <input
            type="password"
            minLength={8}
            required
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
          />

          <div className="permissoes-aviso" style={{ display: "block" }}>
            Contas de eletricista são criadas na tela de Eletricistas.
          </div>

          <div className="switch-admin">
            <input
              type="checkbox"
              checked={form.is_admin}
              onChange={(e) => setForm({ ...form, is_admin: e.target.checked })}
            />
            <label>Administrador (acesso total)</label>
          </div>

          {form.is_admin && (
            <div className="permissoes-aviso" style={{ display: "block" }}>
              Administrador já tem acesso a tudo.
            </div>
          )}

          <div className={`permissoes-bloco ${form.is_admin ? "desativado" : ""}`}>
            <div className="titulo">Módulos liberados</div>
            <div className="permissoes-grid">
              {Object.entries(PERMISSOES_DISPONIVEIS).map(([chave, rotulo]) => (
                <div className="perm-item" key={chave}>
                  <input
                    type="checkbox"
                    checked={form.is_admin || form.permissoes.includes(chave)}
                    disabled={form.is_admin}
                    onChange={() => togglePermissao(chave)}
                  />
                  <label>{rotulo}</label>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Criar Usuário"}
          </button>
        </form>
      </Modal>

      <Modal aberto={modalEditarAberto} onFechar={() => setModalEditarAberto(false)} titulo="Editar Usuário">
        <form className="eletrotech-form" onSubmit={handleEditar}>
          <label className="campo">Nome de Usuário</label>
          <input
            type="text"
            required
            readOnly={ehEletricista}
            value={form.usuario}
            onChange={(e) => setForm({ ...form, usuario: e.target.value })}
          />

          <label className="campo">Nova senha (deixe em branco para manter)</label>
          <input
            type="password"
            minLength={8}
            autoComplete="new-password"
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
          />

          {ehEletricista && (
            <div className="permissoes-aviso" style={{ display: "block" }}>
              Conta de eletricista — o login é o CPF e não pode virar administrador.
            </div>
          )}

          <div className="switch-admin">
            <input
              type="checkbox"
              disabled={ehEletricista}
              checked={form.is_admin}
              onChange={(e) => setForm({ ...form, is_admin: e.target.checked })}
            />
            <label>Administrador (acesso total)</label>
          </div>

          {form.is_admin && (
            <div className="permissoes-aviso" style={{ display: "block" }}>
              Administrador tem acesso a tudo.
            </div>
          )}

          <div className={`permissoes-bloco ${form.is_admin ? "desativado" : ""}`}>
            <div className="titulo">Módulos liberados</div>
            <div className="permissoes-grid">
              {Object.entries(PERMISSOES_DISPONIVEIS).map(([chave, rotulo]) => (
                <div className="perm-item" key={chave}>
                  <input
                    type="checkbox"
                    checked={form.is_admin || form.permissoes.includes(chave)}
                    disabled={form.is_admin}
                    onChange={() => togglePermissao(chave)}
                  />
                  <label>{rotulo}</label>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Gravar Alterações"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
