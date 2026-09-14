import { useEffect, useState } from "react";
import * as produtosApi from "../api/produtos";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import { Carregando, ErroCarregamento, ListaVazia } from "../components/EstadoLista";
import { useNotificacao } from "../context/NotificacaoContext";

const POR_PAGINA = 10;

export default function ProdutosPage() {
  const { notificar } = useNotificacao();
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [pagina, setPagina] = useState(1);
  const [salvando, setSalvando] = useState(false);

  const [modalNovo, setModalNovo] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalEstoque, setModalEstoque] = useState(false);

  const [novo, setNovo] = useState({ nome_produto: "", vlr_unitario: "", qtd_estoque: "" });
  const [editando, setEditando] = useState({ id: null, nome_produto: "", vlr_unitario: "" });
  const [estoque, setEstoque] = useState({ id: null, nome: "", qtd_estoque: "" });

  function carregar() {
    setCarregando(true);
    setErro("");
    produtosApi
      .listarProdutos()
      .then((res) => setProdutos(res.data?.produtos ?? res.data ?? []))
      .catch(() => setErro("Não foi possível carregar os produtos."))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleNovo(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      await produtosApi.cadastrarProduto(novo);
      notificar("Produto cadastrado com sucesso.");
      setModalNovo(false);
      setNovo({ nome_produto: "", vlr_unitario: "", qtd_estoque: "" });
      carregar();
    } catch (err) {
      notificar(err.response?.data?.mensagem || "Erro ao cadastrar produto.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  async function handleEditar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      await produtosApi.editarProduto(editando);
      notificar("Produto atualizado com sucesso.");
      setModalEditar(false);
      carregar();
    } catch (err) {
      notificar(err.response?.data?.mensagem || "Erro ao editar produto.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  async function handleZerarEstoque(id) {
    if (!window.confirm("Zerar estoque?")) return;
    try {
      await produtosApi.zerarEstoqueProduto(id);
      notificar("Estoque zerado.");
      carregar();
    } catch (err) {
      notificar(err.response?.data?.mensagem || "Erro ao zerar estoque.", "erro");
    }
  }

  async function handleAumentarEstoque(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      await produtosApi.aumentarEstoqueProduto(estoque.id, estoque.qtd_estoque);
      notificar("Estoque atualizado.");
      setModalEstoque(false);
      carregar();
    } catch (err) {
      notificar(err.response?.data?.mensagem || "Erro ao atualizar estoque.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  const totalRows = produtos.length;
  const inicio = (pagina - 1) * POR_PAGINA;
  const paginaAtual = produtos.slice(inicio, inicio + POR_PAGINA);

  return (
    <div className="container">
      <div className="page-header">
        <h1>Produtos</h1>
        <p>Controle de estoque e materiais utilizados nas ordens de serviço.</p>
      </div>

      <div id="acoes_id">
        <button type="button" onClick={() => setModalNovo(true)}>
          <i className="fa-solid fa-plus"></i> Novo Produto
        </button>
      </div>

      {erro && <ErroCarregamento mensagem={erro} onTentarNovamente={carregar} />}

      {carregando ? (
        <Carregando texto="Carregando produtos..." />
      ) : (
        <>
          <table className="table table-dark table-hover table-bordered custom-table text-center tabela-eletrotech">
            <thead>
              <tr>
                <th style={{ width: "15%" }}>Ações</th>
                <th style={{ width: "45%" }}>Nome do Produto</th>
                <th style={{ width: "20%" }}>Valor Unitário</th>
                <th style={{ width: "10%" }}>Qtd. Estoque</th>
                <th style={{ width: "10%" }}>ID</th>
              </tr>
            </thead>
            <tbody>
              {paginaAtual.length > 0 ? (
                paginaAtual.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => {
                          setEditando({ id: p.id, nome_produto: p.nome_produto, vlr_unitario: p.vlr_unitario });
                          setModalEditar(true);
                        }}
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>{" "}
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleZerarEstoque(p.id)}>
                        <i className="fa-solid fa-trash"></i>
                      </button>{" "}
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => {
                          setEstoque({ id: p.id, nome: p.nome_produto, qtd_estoque: "" });
                          setModalEstoque(true);
                        }}
                      >
                        <i className="fa-solid fa-plus"></i>
                      </button>
                    </td>
                    <td>{p.nome_produto}</td>
                    <td>R$ {Number(p.vlr_unitario).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td>{p.qtd_estoque}</td>
                    <td>{p.id}</td>
                  </tr>
                ))
              ) : (
                <ListaVazia texto="Nenhum produto cadastrado no momento." />
              )}
            </tbody>
          </table>
          <Pagination totalRows={totalRows} page={pagina} porPagina={POR_PAGINA} onChange={setPagina} />
        </>
      )}

      <Modal aberto={modalNovo} onFechar={() => setModalNovo(false)} titulo="Cadastrar Novo Produto">
        <p className="mb-3" style={{ color: "#FBD814", fontSize: 12, fontWeight: "bold" }}>* campos obrigatórios</p>
        <form className="eletrotech-form" onSubmit={handleNovo}>
          <label className="required">Nome / Descrição do Material</label>
          <input
            type="text"
            placeholder="Ex: Cabo PP 2,5mm²"
            required
            value={novo.nome_produto}
            onChange={(e) => setNovo({ ...novo, nome_produto: e.target.value })}
          />
          <label className="required">Preço Unitário (R$)</label>
          <input
            type="text"
            placeholder="Ex: 8.90"
            required
            value={novo.vlr_unitario}
            onChange={(e) => setNovo({ ...novo, vlr_unitario: e.target.value })}
          />
          <label className="required">Quantidade em Estoque</label>
          <input
            type="number"
            min="0"
            placeholder="Ex: 100"
            required
            value={novo.qtd_estoque}
            onChange={(e) => setNovo({ ...novo, qtd_estoque: e.target.value })}
          />
          <button type="submit" className="btn-submit mt-3" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar Produto"}
          </button>
        </form>
      </Modal>

      <Modal aberto={modalEditar} onFechar={() => setModalEditar(false)} titulo="Editar Produto">
        <form className="eletrotech-form" onSubmit={handleEditar}>
          <label>Nome do Produto</label>
          <input
            type="text"
            required
            value={editando.nome_produto}
            onChange={(e) => setEditando({ ...editando, nome_produto: e.target.value })}
          />
          <label>Valor Unitário (R$)</label>
          <input
            type="number"
            step="0.01"
            required
            value={editando.vlr_unitario}
            onChange={(e) => setEditando({ ...editando, vlr_unitario: e.target.value })}
          />
          <button type="submit" className="btn-submit mt-4" disabled={salvando}>
            {salvando ? "Salvando..." : "Gravar Alterações"}
          </button>
        </form>
      </Modal>

      <Modal aberto={modalEstoque} onFechar={() => setModalEstoque(false)} titulo="Aumentar Estoque">
        <form className="eletrotech-form" onSubmit={handleAumentarEstoque}>
          <label>Produto</label>
          <p style={{ marginBottom: 20, fontWeight: 700 }}>{estoque.nome}</p>
          <label>Quantidade a adicionar</label>
          <input
            type="number"
            min="1"
            placeholder="Ex: 10"
            required
            value={estoque.qtd_estoque}
            onChange={(e) => setEstoque({ ...estoque, qtd_estoque: e.target.value })}
          />
          <button type="submit" className="btn-submit mt-3" disabled={salvando}>
            {salvando ? "Salvando..." : "Atualizar Estoque"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
