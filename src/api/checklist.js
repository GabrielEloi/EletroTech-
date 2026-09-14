import api, { toFormBody } from "./client";

// GET /checklist?tipo=&titulo=
export function listarChecklists(filtros = {}) {
  return api.get("/checklist", { params: filtros });
}

// POST /checklist/cadastrar { titulo, tipo, pergunta[], tipo_resposta[], bloqueia_abertura[] }
export function cadastrarChecklist(dados) {
  return api.post("/checklist/cadastrar", toFormBody(dados));
}

// POST /checklist/selecionar { id_checklist, tipo }
export function selecionarChecklist(dados) {
  return api.post("/checklist/selecionar", toFormBody(dados));
}

// GET /checklist/perguntas/{id}
export function perguntasChecklist(id) {
  return api.get(`/checklist/perguntas/${id}`);
}

// GET /checklist/excluir/{id}
export function excluirChecklist(id) {
  return api.get(`/checklist/excluir/${id}`);
}
