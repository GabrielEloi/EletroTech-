import api, { toFormBody } from "./client";

// GET /produtos - lista de produtos
export function listarProdutos() {
  return api.get("/produtos");
}

// POST /produtos/cadastrar { nome_produto, vlr_unitario, qtd_estoque }
export function cadastrarProduto(dados) {
  return api.post("/produtos/cadastrar", toFormBody(dados));
}

// POST /produtos/editar { id, nome_produto, vlr_unitario }
export function editarProduto(dados) {
  return api.post("/produtos/editar", toFormBody(dados));
}

// GET /produtos/ZerarEstoque/{id}
export function zerarEstoqueProduto(id) {
  return api.get(`/produtos/ZerarEstoque/${id}`);
}

// POST /produtos/aumentarQtdEstoque/{id} { qtd_estoque }
export function aumentarEstoqueProduto(id, qtdEstoque) {
  return api.post(
    `/produtos/aumentarQtdEstoque/${id}`,
    toFormBody({ qtd_estoque: qtdEstoque })
  );
}
