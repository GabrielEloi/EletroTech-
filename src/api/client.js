import axios from "axios";

// Base da API - aponta para o backend CodeIgniter (PHP) do EletroTech.
// Configure em um arquivo .env na raiz: VITE_API_URL=http://seu-servidor/index.php
const baseURL = import.meta.env.VITE_API_URL || "/index.php";

const api = axios.create({
  baseURL,
  withCredentials: true, // necessário para manter a sessão PHP (cookie PHPSESSID)
});

// Helper para enviar dados como application/x-www-form-urlencoded,
// formato que o CodeIgniter lê nativamente via $this->input->post().
export function toFormBody(data) {
  const params = new URLSearchParams();
  Object.entries(data || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(`${key}[]`, v));
    } else if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  return params;
}

api.interceptors.request.use((config) => {
  if (config.data instanceof URLSearchParams) {
    config.headers["Content-Type"] = "application/x-www-form-urlencoded";
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Sessão expirada/sem permissão - deixa a tela decidir o redirecionamento.
    }
    return Promise.reject(error);
  }
);

export default api;
