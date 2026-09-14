import api from "./client";

// GET /menu?mes= - dashboard geral (admin) ou dashboard do eletricista
export function getMenu(mes) {
  return api.get("/menu", { params: mes ? { mes } : {} });
}
