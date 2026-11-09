import { useEffect, useState } from "react";
import { AuthContext } from './auth-store';
import * as authApi from "../api/auth";

import { PERMISSOES_ELETRICISTA, PERMISSOES_SUPERVISOR } from "../constants/permissoes";


const STORAGE_KEY = "eletrotech_usuario";

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      return salvo ? JSON.parse(salvo) : null;
    } catch {
      return null;
    }
  });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [carregandoSessao, setCarregandoSessao] = useState(() => {
    try { return !!localStorage.getItem(STORAGE_KEY); } catch { return false; }
  });
  const usuarioId = usuario?.id;

  useEffect(() => {
    const atualizar = e => setUsuario(e.detail);
    window.addEventListener('eletrotech:sessao', atualizar);
    return () => window.removeEventListener('eletrotech:sessao', atualizar);
  }, []);

  useEffect(() => {
    let ativo = true;
    if (!usuarioId) return;
    async function validar() {
      try {
        const { data } = await authApi.getHome();
        if (ativo) setUsuario(atual => {
          if (atual?.id !== usuarioId) return atual;
          let token = atual.accessToken;
          try { token = JSON.parse(localStorage.getItem(STORAGE_KEY))?.accessToken || token; } catch { /* Usa o token atual. */ }
          return { ...data, accessToken: token };
        });
      } catch (e) {
        if (ativo && [401,403].includes(e.response?.status)) setUsuario(null);
      } finally { if (ativo) setCarregandoSessao(false); }
    }
    validar();
    window.addEventListener('focus', validar);
    return () => { ativo = false; window.removeEventListener('focus', validar); };
  }, [usuarioId]);

  useEffect(() => {
    if (usuario) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [usuario]);

  async function login(nome, senha) {
    setCarregando(true);
    setErro("");
    try {
      const { data } = await authApi.login(nome, senha);
      const usuario = data.usuario ? { ...data.usuario, accessToken: data.accessToken } : data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
      setUsuario(usuario);
      return usuario;
    } catch (e) {
      setErro(
        e.response?.data?.mensagem ||
          "Não foi possível entrar. Verifique usuário e senha."
      );
      throw e;
    } finally {
      setCarregando(false);
    }
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // segue o fluxo mesmo se a chamada falhar
    }
    setUsuario(null);
  }

  // A interface também limita contas antigas vinculadas a um eletricista.
  const ehEletricista = !!(usuario?.eletricista_id ?? usuario?.eletricistaId);
  const ehAdmin = !ehEletricista && Number(usuario?.is_admin ?? usuario?.isAdmin) === 1;
  const ehSupervisor = !ehEletricista && !ehAdmin && usuario?.perfil === "supervisor";
  const permissoes = ehEletricista ? PERMISSOES_ELETRICISTA : ehSupervisor ? PERMISSOES_SUPERVISOR : usuario?.permissoes || [];

  function pode(chave) {
    return ehAdmin || permissoes.includes(chave);
  }

  const value = { usuario, setUsuario, carregando, carregandoSessao: Boolean(usuario) && carregandoSessao, erro, login, logout, ehAdmin, ehEletricista, ehSupervisor, permissoes, pode };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
