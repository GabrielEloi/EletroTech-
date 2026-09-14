import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/img/logo-eletrotech.png";

export default function LoginPage() {
  const { login, carregando } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    try {
      await login(nome, senha);
      navigate("/home");
    } catch (err) {
      setErro(
        err.response?.data?.mensagem || "Não foi possível entrar. Verifique usuário e senha."
      );
    }
  }

  return (
    <div id="body-login">
      <header>
        <img src={logo} alt="logo-eletrotech" />
      </header>

      <div className="container-login">
        {erro && (
          <div
            className="alert alert-danger"
            style={{ color: "#ff4c5d", textAlign: "center", marginBottom: 15, fontWeight: "bold" }}
          >
            {erro}
          </div>
        )}

        <h1>Login</h1>

        <form onSubmit={handleSubmit} className="login-inputs">
          <label htmlFor="login-nome">Nome de Usuário ou CPF</label>
          <input
            type="text"
            id="login-nome"
            name="nome"
            placeholder="Insira seu nome de usuário ou CPF"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />

          <label htmlFor="login-senha">Senha</label>
          <div className="ml-input-wrapper">
            <input
              type={mostrarSenha ? "text" : "password"}
              id="login-senha"
              name="senha"
              className="ml-input-field"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
            <i
              className={`fa-regular ${mostrarSenha ? "fa-eye-slash" : "fa-eye"} ml-input-icon`}
              onClick={() => setMostrarSenha((v) => !v)}
              style={{ cursor: "pointer" }}
            ></i>
          </div>

          <div className="container-button">
            <button type="submit" className="ml-button" disabled={carregando}>
              {carregando ? "Entrando..." : "Fazer login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
