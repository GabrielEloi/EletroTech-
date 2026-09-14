import api, { toFormBody } from "./client";

// GET /ordemServico - lista de ordens de serviço
export function listarOrdensServico() {
  return api.get("/ordemServico");
}

// POST /ordemServico/solicitar { eletricista_os, data_os }
export function solicitarOrdemServico(dados) {
  return api.post("/ordemServico/solicitar", toFormBody(dados));
}

// POST /ordemServico/abrir { id_os, id_produto[], qtd_utilizada[], checklist_resposta[] }
export function abrirOrdemServico(dados) {
  return api.post("/ordemServico/abrir", toFormBody(dados));
}

// POST /ordemServico/fechar { id_os, checklist_resposta[], motivos }
export function fecharOrdemServico(dados) {
  return api.post("/ordemServico/fechar", toFormBody(dados));
}

// GET /ordemServico/detalhes/{idOs}
export function detalhesOrdemServico(idOs) {
  return api.get(`/ordemServico/detalhes/${idOs}`);
}

// POST /ordemServico/adicionarComentario { id_os, comentario }
export function adicionarComentario(dados) {
  return api.post("/ordemServico/adicionarComentario", toFormBody(dados));
}
