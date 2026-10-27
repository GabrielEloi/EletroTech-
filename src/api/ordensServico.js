import api, { toFormBody } from "./client";

// GET /ordemServico - lista de ordens de serviço
export function listarOrdensServico(filtros = {}) {
  return api.get("/ordens-servico", { params: filtros });
}

// POST /ordemServico/solicitar { eletricista_os, data_os }
export function solicitarOrdemServico(dados) {
  return api.post("/ordens-servico", toFormBody(dados));
}

// JSON preserva o ID de cada pergunta e suas respostas.
// POST /ordemServico/abrir { id_os, id_produto[], qtd_utilizada[], checklist_resposta[] }
export function abrirOrdemServico(dados) {
  return api.post(`/ordens-servico/${dados.id_os}/abertura`, { ...dados, checklistRespostas: dados.checklist_resposta });
}

// POST /ordemServico/fechar { id_os, checklist_resposta[], motivos }
export function fecharOrdemServico(dados) {
  return api.post(`/ordens-servico/${dados.id_os}/fechamento`, { ...dados, checklistRespostas: dados.checklist_resposta });
}

// GET /ordemServico/detalhes/{idOs}
export function detalhesOrdemServico(idOs) {
  return api.get(`/ordens-servico/${idOs}`);
}

// POST /ordemServico/adicionarComentario { id_os, comentario }
export function adicionarComentario(dados) {
  return api.post(`/ordens-servico/${dados.id_os}/comentarios`, toFormBody(dados));
}
