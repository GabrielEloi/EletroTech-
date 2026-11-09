import api, { toFormBody } from "./client";

// GET /checklists/pendencias?tipo=&eletricista=&ordenar=
export function listarConsultaChecklist(filtros = {}) {
  return api.get("/checklists/pendencias", { params: filtros });
}

// POST /checklists/pendencias/:idOs/:tipo/resolucao { observacao, acao }
export function finalizarConsultaChecklist(dados) {
  return api.post(`/checklists/pendencias/${dados.id_os}/${dados.tipo}/resolucao`, toFormBody(dados));
}

// GET /checklists/pendencias/:idOs/:tipo/relatorio
export function relatorioChecklist(idOs, tipo) {
  return api.get(`/checklists/pendencias/${idOs}/${tipo}/relatorio`);
}
export const opcoesConsultaChecklist = () => api.get('/checklists/pendencias/opcoes');
