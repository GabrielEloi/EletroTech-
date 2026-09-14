import api, { toFormBody } from "./client";

// GET /usuarios - lista de usuários
export function listarUsuarios() {
  return api.get("/usuarios");
}

// POST /usuarios/criar { usuario, senha, is_admin, permissoes[], eletricista_id }
export function criarUsuario(dados) {
  return api.post("/usuarios/criar", toFormBody(dados));
}

// POST /usuarios/editar { id, usuario, is_admin, permissoes[], senha }
export function editarUsuario(dados) {
  return api.post("/usuarios/editar", toFormBody(dados));
}

// GET /usuarios/excluir/{id}
export function excluirUsuario(id) {
  return api.get(`/usuarios/excluir/${id}`);
}
