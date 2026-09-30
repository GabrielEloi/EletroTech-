import api, { toFormBody } from "./client";

// GET /lancamentos - rascunho atual + histórico
export function getLancamentos() {
  return api.get("/lancamentos");
}

// POST /lancamentos/abrir { tipo, data_baixa, id_eletricista, observacao }
export function abrirLancamento(dados) {
  return api.post("/lancamentos", toFormBody(dados));
}

// POST /lancamentos/incluir_item { id_baixa, id_produto, quantidade, valor_unitario }
export function incluirItemLancamento(dados) {
  return api.post(`/lancamentos/${dados.id_baixa}/itens`, toFormBody(dados));
}

// POST /lancamentos/remover_item { id_baixa, id_item }
export function removerItemLancamento(dados) {
  return api.delete(`/lancamentos/${dados.id_baixa}/itens/${dados.id_item}`);
}

// POST /lancamentos/finalizar { id_baixa }
export function finalizarLancamento(idBaixa) {
  return api.post(`/lancamentos/${idBaixa}/finalizacao`);
}

// POST /lancamentos/cancelar { id_baixa }
export function cancelarLancamento(idBaixa) {
  return api.post(`/lancamentos/${idBaixa}/cancelamento`);
}

// GET /lancamentos/relatorio/{id}
export function relatorioLancamento(id) {
  return api.get(`/lancamentos/${id}/relatorio`);
}
