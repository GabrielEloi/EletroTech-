import api, { toFormBody } from "./client";

// GET /lancamentos - rascunho atual + histórico
export function getLancamentos() {
  return api.get("/lancamentos");
}

// POST /lancamentos/abrir { tipo, data_baixa, id_eletricista, observacao }
export function abrirLancamento(dados) {
  return api.post("/lancamentos/abrir", toFormBody(dados));
}

// POST /lancamentos/incluir_item { id_baixa, id_produto, quantidade, valor_unitario }
export function incluirItemLancamento(dados) {
  return api.post("/lancamentos/incluir_item", toFormBody(dados));
}

// POST /lancamentos/remover_item { id_baixa, id_item }
export function removerItemLancamento(dados) {
  return api.post("/lancamentos/remover_item", toFormBody(dados));
}

// POST /lancamentos/finalizar { id_baixa }
export function finalizarLancamento(idBaixa) {
  return api.post("/lancamentos/finalizar", toFormBody({ id_baixa: idBaixa }));
}

// POST /lancamentos/cancelar { id_baixa }
export function cancelarLancamento(idBaixa) {
  return api.post("/lancamentos/cancelar", toFormBody({ id_baixa: idBaixa }));
}

// GET /lancamentos/relatorio/{id}
export function relatorioLancamento(id) {
  return api.get(`/lancamentos/relatorio/${id}`);
}
