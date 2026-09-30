import api from "./client";

// POST /auth/login { nome, senha }
export function login(nome, senha) {
  return api.post("/auth/login", { nome, senha });
}

// GET /auth/sair
export function logout() {
  return api.post("/auth/logout");
}

// GET /home - dados do usuário logado (nome, destino do dashboard)
export function getHome() {
  return api.get("/auth/me");
}
