import axios from "axios";

// API REST Node/Express. Configure VITE_API_URL sem a barra final.
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3100/api/v1";

const api = axios.create({
  baseURL,
  withCredentials: true,
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
  try {
    const usuario = JSON.parse(localStorage.getItem("eletrotech_usuario"));
    if (usuario?.accessToken) config.headers.Authorization = `Bearer ${usuario.accessToken}`;
  } catch {
    // A requisição de login continua funcionando sem armazenamento local.
  }
  if (config.data instanceof URLSearchParams) {
    config.headers["Content-Type"] = "application/x-www-form-urlencoded";
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // O backend usa { data, meta? } como envelope padrão; preserva o contrato
    // simples que as páginas React já consomem via `const { data } = ...`.
    if (response.data && Object.prototype.hasOwnProperty.call(response.data, "data")) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Sessão expirada/sem permissão - deixa a tela decidir o redirecionamento.
    }
    return Promise.reject(error);
  }
);

export default api;
