import api, { toFormBody } from "./client";

// GET /metas?filtro_eletricista=&filtro_mes=
export function listarMetas(filtros = {}) {
  return api.get("/metas", { params: filtros });
}

// POST /metas/cadastrar { eletricista_meta, mes_meta, vlr_meta }
export function cadastrarMeta(dados) {
  return api.post("/metas", toFormBody(dados));
}

// POST /metas/editar { id, vlr_meta }
export function editarMeta(dados) {
  return api.put(`/metas/${dados.id}`, toFormBody(dados));
}

// GET /metas/excluir/{id}
export function excluirMeta(id) {
  return api.delete(`/metas/${id}`);
}
