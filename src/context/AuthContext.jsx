import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth";

const AuthContext = createContext(null);

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
      // Espera-se que o backend retorne algo como:
      // { nome, is_admin, permissoes: [...], destino, rotuloDestino }
      setUsuario(data);
      return data;
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

  const ehAdmin = !!usuario?.is_admin;
  const permissoes = usuario?.permissoes || [];

  function pode(chave) {
    return ehAdmin || permissoes.includes(chave);
  }

  const value = useMemo(
    () => ({ usuario, setUsuario, carregando, erro, login, logout, ehAdmin, permissoes, pode }),
    [usuario, carregando, erro]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
