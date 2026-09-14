import api, { toFormBody } from "./client";

// GET /consultachecklist?tipo=&eletricista=&ordenar=
export function listarConsultaChecklist(filtros = {}) {
  return api.get("/consultachecklist", { params: filtros });
}

// POST /consultachecklist/finalizar { id_os, tipo, observacao, acao }
export function finalizarConsultaChecklist(dados) {
  return api.post("/consultachecklist/finalizar", toFormBody(dados));
}

// GET /consultachecklist/relatorio/{idOs}/{tipo}
export function relatorioChecklist(idOs, tipo) {
  return api.get(`/consultachecklist/relatorio/${idOs}/${tipo}`);
}
