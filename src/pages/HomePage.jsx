import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHome } from "../api/auth";
import logo from "../assets/img/logo-eletrotech.png";
import { Carregando } from "../components/EstadoLista";

export default function HomePage() {
  const { usuario, pode, ehAdmin, ehEletricista } = useAuth();
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    getHome()
      .then((res) => setDados(res.data))
      .catch((error) => {
        setDados(null);
        setErro(error.response?.data?.mensagem || "Não foi possível carregar os dados da conta.");
      })
      .finally(() => setCarregando(false));
  }, []);

  const nomeExibicao =
    usuario?.nome_exibicao ||
    usuario?.eletricista_nome ||
    dados?.nome ||
    usuario?.nome ||
    usuario?.usuario ||
    "Usuário";
  const destinosDisponiveis = [
    ...(ehAdmin || ehEletricista
      ? [{ permissao: "menu", destino: "/menu", rotulo: "Dashboard" }]
      : []),
    { permissao: "ordemServico", destino: "/ordem-servico", rotulo: "Ordens de Serviço" },
    { permissao: "metas", destino: "/metas", rotulo: "Metas" },
    { permissao: "produtos", destino: "/produtos", rotulo: "Produtos" },
    { permissao: "eletricistas", destino: "/eletricistas", rotulo: "Eletricistas" },
    { permissao: "checklist", destino: "/checklist", rotulo: "Checklist" },
    { permissao: "baixas", destino: "/baixas", rotulo: "Movimentação" },
  ];
  const destino = destinosDisponiveis.find(
    ({ permissao, destino: rota }) => rota === dados?.destino && pode(permissao)
  ) || destinosDisponiveis.find(({ permissao }) => pode(permissao));

  return (
    <div className="home-hero">
      <img src={logo} alt="Logo EletroTech" />
      {carregando ? (
        <Carregando texto="Carregando..." />
      ) : (
        <>
          {erro && <div className="alert alert-warning" role="status">{erro}</div>}
          <h1>Bem-vindo, {nomeExibicao}!</h1>
          <p>Sistema de gestão da EletroTech Soluções Elétricas.</p>
          {destino ? (
            <Link className="btn-dashboard" to={destino.destino}>
              <i className="fa-solid fa-gauge-high"></i> Acessar {destino.rotulo}
            </Link>
          ) : (
            <p role="status">Sua conta ainda não possui módulos de acesso liberados.</p>
          )}
        </>
      )}
    </div>
  );
}
