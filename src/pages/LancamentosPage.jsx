import { useEffect, useState } from "react";
import * as lancamentosApi from "../api/lancamentos";
import { Carregando, ErroCarregamento } from "../components/EstadoLista";
import { useNotificacao } from "../context/NotificacaoContext";

const TIPOS = [
  { chave: "entrada", rotulo: "Entrada" },
  { chave: "saida", rotulo: "Saída" },
];

export default function LancamentosPage() {
  const { notificar } = useNotificacao();
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [abaAtiva, setAbaAtiva] = useState("entrada");
  const [enviando, setEnviando] = useState(false);

  const [formAbrir, setFormAbrir] = useState({ data_baixa: "", id_eletricista: "", observacao: "" });
  const [formItem, setFormItem] = useState({ id_produto: "", quantidade: "", valor_unitario: "" });

  function carregar() {
    setCarregando(true);
    setErro("");
    lancamentosApi
      .getLancamentos()
      .then((res) => setDados(res.data))
      .catch(() => setErro("Não foi possível carregar os lançamentos."))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregar();
  }, []);

  const produtos = dados?.produtos ?? [];
  const eletricistas = dados?.eletricistas ?? [];
  const abaDados = dados?.abas?.[abaAtiva] ?? { rascunho: null, itens: [] };
  const rascunho = abaDados.rascunho;
  const itens = abaDados.itens ?? [];
  const subtotal = itens.reduce((soma, i) => soma + Number(i.quantidade) * Number(i.valor_unitario), 0);

  async function handleAbrir(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await lancamentosApi.abrirLancamento({ tipo: abaAtiva, ...formAbrir });
      notificar("Rascunho de baixa aberto.");
      setFormAbrir({ data_baixa: "", id_eletricista: "", observacao: "" });
      carregar();
    } catch (err) {
      notificar(err.response?.data?.mensagem || "Erro ao abrir baixa.", "erro");
    } finally {
      setEnviando(false);
    }
  }

  async function handleIncluirItem(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await lancamentosApi.incluirItemLancamento({ id_baixa: rascunho.id, ...formItem });
      notificar("Item incluído.");
      setFormItem({ id_produto: "", quantidade: "", valor_unitario: "" });
      carregar();
    } catch (err) {
      notificar(err.response?.data?.mensagem || "Erro ao incluir item.", "erro");
    } finally {
      setEnviando(false);
    }
  }

  async function handleRemoverItem(idItem) {
    try {
      await lancamentosApi.removerItemLancamento({ id_baixa: rascunho.id, id_item: idItem });
      notificar("Item removido.");
      carregar();
    } catch (err) {
      notificar(err.response?.data?.mensagem || "Erro ao remover item.", "erro");
    }
  }

  async function handleCancelar() {
    if (!window.confirm("Cancelar esta baixa? Os materiais incluídos serão descartados.")) return;
    try {
      await lancamentosApi.cancelarLancamento(rascunho.id);
      notificar("Baixa cancelada.");
      carregar();
    } catch (err) {
      notificar(err.response?.data?.mensagem || "Erro ao cancelar baixa.", "erro");
    }
  }

  async function handleFinalizar() {
    if (!window.confirm("Finalizar esta baixa? Após finalizada não poderá ser alterada.")) return;
    try {
      await lancamentosApi.finalizarLancamento(rascunho.id);
      notificar("Baixa finalizada com sucesso.");
      carregar();
    } catch (err) {
      notificar(err.response?.data?.mensagem || "Erro ao finalizar baixa.", "erro");
    }
  }

  function selecionarProduto(idProduto) {
    const produto = produtos.find((p) => String(p.id) === String(idProduto));
    setFormItem({
      ...formItem,
      id_produto: idProduto,
      valor_unitario: produto ? produto.vlr_unitario : "",
    });
  }

  if (carregando) return <Carregando texto="Carregando lançamentos..." />;
  if (erro) return <ErroCarregamento mensagem={erro} onTentarNovamente={carregar} />;

  return (
    <div className="container">
      <div className="page-header">
        <h1>Baixas de Estoque</h1>
        <p>Lançamento de entradas e saídas de materiais no estoque.</p>
      </div>

      <ul className="nav nav-tabs mb-3">
        {TIPOS.map((t) => (
          <li className="nav-item" key={t.chave}>
            <button
              className={`nav-link ${abaAtiva === t.chave ? "active" : ""}`}
              style={abaAtiva === t.chave ? { backgroundColor: "#FBD814", color: "#282828", fontWeight: "bold" } : { color: "#fff" }}
              onClick={() => setAbaAtiva(t.chave)}
            >
              {t.rotulo}
            </button>
          </li>
        ))}
      </ul>

      {!rascunho ? (
        <div className="painel painel-destaque">
          <h5 style={{ color: "#FBD814" }}>Abrir nova baixa de {abaAtiva === "entrada" ? "entrada" : "saída"}</h5>
          <form className="eletrotech-form" onSubmit={handleAbrir}>
            <label>Data</label>
            <input
              type="date"
              required
              value={formAbrir.data_baixa}
              onChange={(e) => setFormAbrir({ ...formAbrir, data_baixa: e.target.value })}
            />
            <label>Eletricista responsável</label>
            <select
              required
              value={formAbrir.id_eletricista}
              onChange={(e) => setFormAbrir({ ...formAbrir, id_eletricista: e.target.value })}
            >
              <option value="">Selecione o eletricista</option>
              {eletricistas.map((el) => (
                <option key={el.id} value={el.id}>{el.nome}</option>
              ))}
            </select>
            <label>Observação</label>
            <input
              type="text"
              value={formAbrir.observacao}
              onChange={(e) => setFormAbrir({ ...formAbrir, observacao: e.target.value })}
            />
            <button type="submit" className="btn-submit mt-3" disabled={enviando}>
              {enviando ? "Abrindo..." : "Abrir Baixa"}
            </button>
          </form>
        </div>
      ) : (
        <div className="painel painel-destaque">
          <h5 style={{ color: "#FBD814" }}>Baixa em andamento — #{rascunho.id}</h5>

          <form className="eletrotech-form mb-4" onSubmit={handleIncluirItem}>
            <div className="row g-2">
              <div className="col-md-5">
                <label>Material</label>
                <select
                  required
                  value={formItem.id_produto}
                  onChange={(e) => selecionarProduto(e.target.value)}
                >
                  <option value="">Selecione o material</option>
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome_produto} (Estoque: {p.qtd_estoque})</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label>Quantidade</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formItem.quantidade}
                  onChange={(e) => setFormItem({ ...formItem, quantidade: e.target.value })}
                />
              </div>
              <div className="col-md-3">
                <label>Valor unitário</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formItem.valor_unitario}
                  onChange={(e) => setFormItem({ ...formItem, valor_unitario: e.target.value })}
                />
              </div>
              <div className="col-md-1 d-flex align-items-end">
                <button type="submit" className="btn btn-eletrotech w-100" disabled={enviando}>
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>
          </form>

          <table className="table table-dark table-sm table-bordered text-center tabela-eletrotech">
            <thead>
              <tr>
                <th>Material</th>
                <th>Qtd</th>
                <th>Valor un.</th>
                <th>Subtotal</th>
                <th>&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {itens.length > 0 ? (
                itens.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nome_produto}</td>
                    <td>{item.quantidade}</td>
                    <td>R$ {Number(item.valor_unitario).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td>R$ {(Number(item.quantidade) * Number(item.valor_unitario)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleRemoverItem(item.id)}>
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-muted py-3">Nenhum item incluído ainda.</td>
                </tr>
              )}
            </tbody>
            {itens.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={3} className="text-end fw-bold">Total</td>
                  <td className="fw-bold">R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>

          <div className="d-flex gap-2 justify-content-end mt-3">
            <button className="btn btn-outline-danger" onClick={handleCancelar}>
              Cancelar Baixa
            </button>
            <button className="btn btn-eletrotech" onClick={handleFinalizar} disabled={itens.length === 0}>
              Finalizar Baixa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
