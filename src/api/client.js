import axios from "axios";

// API REST Node/Express. Configure VITE_API_URL sem a barra final.
const baseURL = import.meta.env.VITE_API_URL || "/api/v1";

const api = axios.create({
  baseURL,
  withCredentials: true,
});
let renovacao;
const atualizarSessao = usuario => {
  if (usuario) localStorage.setItem('eletrotech_usuario', JSON.stringify(usuario));
  else localStorage.removeItem('eletrotech_usuario');
  window.dispatchEvent(new CustomEvent('eletrotech:sessao', { detail: usuario }));
};

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
      response.meta = response.data.meta;
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const config = error.config;
    // As páginas antigas também recebem a mensagem do envelope REST.
    if (error.response?.data?.error?.message) error.response.data.mensagem = error.response.data.error.message;
    if (error.response?.status === 401 && config && !config._renovada && !/\/auth\/(login|refresh|logout)/.test(config.url)) {
      config._renovada = true;
      try {
        // Compartilha a renovação entre chamadas simultâneas e rotaciona o cookie.
        if (!renovacao) renovacao = axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true }).then(res => {
          const { usuario, accessToken } = res.data.data;
          atualizarSessao({ ...usuario, accessToken });
          return accessToken;
        }).finally(() => { renovacao = null; });
        const token = await renovacao;
        config.headers.Authorization = `Bearer ${token}`;
        return api(config);
      } catch { atualizarSessao(null); }
    }
    if (error.response?.status === 403 && ['INACTIVE_USER', 'NO_PERMISSIONS'].includes(error.response?.data?.error?.code)) atualizarSessao(null);
    return Promise.reject(error);
  }
);

export default api;
