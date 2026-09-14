import api from "./client";

// GET /baixas?consultar=1&tipo=&id_produto=&data_inicio=&data_fim=
export function listarBaixas(filtros = {}) {
  return api.get("/baixas", { params: filtros });
}

// GET /baixas/detalhes/{id}
export function detalhesBaixa(id) {
  return api.get(`/baixas/detalhes/${id}`);
}

// POST /baixas/relatorio_misto { ids[] }
export function relatorioMistoBaixas(ids) {
  const params = new URLSearchParams();
  ids.forEach((id) => params.append("ids[]", id));
  return api.post("/baixas/relatorio_misto", params);
}
