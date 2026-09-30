import api, { toFormBody } from "./client";

// GET /checklist?tipo=&titulo=
export function listarChecklists(filtros = {}) {
  return api.get("/checklists", { params: filtros });
}

// POST /checklist/cadastrar { titulo, tipo, pergunta[], tipo_resposta[], bloqueia_abertura[] }
export function cadastrarChecklist(dados) {
  return api.post("/checklists", toFormBody(dados));
}

// POST /checklist/selecionar { id_checklist, tipo }
export function selecionarChecklist(dados) {
  return api.put("/checklists/selecao", toFormBody(dados));
}

// GET /checklist/perguntas/{id}
export function perguntasChecklist(id) {
  return api.get(`/checklists/${id}/perguntas`);
}

// GET /checklist/excluir/{id}
export function excluirChecklist(id) {
  return api.delete(`/checklists/${id}`);
}
