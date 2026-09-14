import api, { toFormBody } from "./client";

// GET /eletricistas - lista de eletricistas
export function listarEletricistas() {
  return api.get("/eletricistas");
}

// POST /eletricistas/cadastrar { nome, cpf, data_contratacao, senha }
export function cadastrarEletricista(dados) {
  return api.post("/eletricistas/cadastrar", toFormBody(dados));
}

// POST /eletricistas/editar { id, nome, senha }
export function editarEletricista(dados) {
  return api.post("/eletricistas/editar", toFormBody(dados));
}

// GET /eletricistas/demitir/{id}
export function demitirEletricista(id) {
  return api.get(`/eletricistas/demitir/${id}`);
}

// GET /eletricistas/reativar/{id}
export function reativarEletricista(id) {
  return api.get(`/eletricistas/reativar/${id}`);
}

// GET /eletricistas/historico_os/{id}
export function historicoOsEletricista(id) {
  return api.get(`/eletricistas/historico_os/${id}`);
}
