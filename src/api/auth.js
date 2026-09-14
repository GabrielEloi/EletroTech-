import api, { toFormBody } from "./client";

// POST /auth/entrar { nome, senha }
export function login(nome, senha) {
  return api.post("/auth/entrar", toFormBody({ nome, senha }));
}

// GET /auth/sair
export function logout() {
  return api.get("/auth/sair");
}

// GET /home - dados do usuário logado (nome, destino do dashboard)
export function getHome() {
  return api.get("/home");
}
