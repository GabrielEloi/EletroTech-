import api, { toFormBody } from "./client";

// GET /eletricistas - lista de eletricistas
export function listarEletricistas() {
  return api.get("/eletricistas");
}

// POST /eletricistas/cadastrar { nome, cpf, data_contratacao, senha }
export function cadastrarEletricista(dados) {
  return api.post("/eletricistas", toFormBody(dados));
}

// POST /eletricistas/editar { id, nome, senha }
export function editarEletricista(dados) {
  return api.put(`/eletricistas/${dados.id}`, toFormBody(dados));
}

// GET /eletricistas/demitir/{id}
export function demitirEletricista(id) {
  return api.patch(`/eletricistas/${id}/demissao`);
}

// GET /eletricistas/reativar/{id}
export function reativarEletricista(id) {
  return api.patch(`/eletricistas/${id}/reativacao`);
}

// GET /eletricistas/historico_os/{id}
export function historicoOsEletricista(id) {
  return api.get(`/eletricistas/${id}/ordens-servico`);
}
