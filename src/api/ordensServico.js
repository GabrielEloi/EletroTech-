import api, { toFormBody } from "./client";

// GET /ordemServico - lista de ordens de serviço
export function listarOrdensServico() {
  return api.get("/ordens-servico");
}

// POST /ordemServico/solicitar { eletricista_os, data_os }
export function solicitarOrdemServico(dados) {
  return api.post("/ordens-servico", toFormBody(dados));
}

// POST /ordemServico/abrir { id_os, id_produto[], qtd_utilizada[], checklist_resposta[] }
export function abrirOrdemServico(dados) {
  return api.post(`/ordens-servico/${dados.id_os}/abertura`, toFormBody(dados));
}

// POST /ordemServico/fechar { id_os, checklist_resposta[], motivos }
export function fecharOrdemServico(dados) {
  return api.post(`/ordens-servico/${dados.id_os}/fechamento`, toFormBody(dados));
}

// GET /ordemServico/detalhes/{idOs}
export function detalhesOrdemServico(idOs) {
  return api.get(`/ordens-servico/${idOs}`);
}

// POST /ordemServico/adicionarComentario { id_os, comentario }
export function adicionarComentario(dados) {
  return api.post(`/ordens-servico/${dados.id_os}/comentarios`, toFormBody(dados));
}
