import api, { toFormBody } from "./client";

function corpo(dados) {
  if (!dados.foto) { const { foto: _foto, ...json } = dados; return json; }
  const form = new FormData();
  Object.entries(dados).forEach(([key, value]) => {
    if (value != null) form.append(key, key === 'foto' ? value : typeof value === 'object' ? JSON.stringify(value) : value);
  });
  return form;
}

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
  return api.post(`/ordens-servico/${dados.id_os}/abertura`, corpo({ itens: dados.id_produto.map((p,i) => ({ produtoId: p, quantidade: dados.qtd_utilizada[i] })), checklistRespostas: dados.checklist_resposta, foto: dados.foto }));
}

// POST /ordemServico/fechar { id_os, checklist_resposta[], motivos }
export function fecharOrdemServico(dados) {
  return api.post(`/ordens-servico/${dados.id_os}/fechamento`, corpo({ checklistRespostas: dados.checklist_resposta, motivos: dados.motivos, foto: dados.foto }));
}

// GET /ordemServico/detalhes/{idOs}
export function detalhesOrdemServico(idOs) {
  return api.get(`/ordens-servico/${idOs}`);
}

// POST /ordemServico/adicionarComentario { id_os, comentario }
export function adicionarComentario(dados) {
  return api.post(`/ordens-servico/${dados.id_os}/comentarios`, dados.foto ? corpo(dados) : toFormBody(dados));
}

export const bloquearOrdemServico = (id, motivo) => api.post(`/ordens-servico/${id}/bloqueio`, { motivo });
export const editarOrdemServico = (id, dados) => api.put(`/ordens-servico/${id}`, dados);
export const obterFotoOs = (id, fotoId) => api.get(`/ordens-servico/${id}/fotos/${fotoId}`, { responseType: 'blob' });
