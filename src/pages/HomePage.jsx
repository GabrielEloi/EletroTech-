import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHome } from "../api/auth";
import logo from "../assets/img/logo-eletrotech.png";
import { Carregando } from "../components/EstadoLista";

export default function HomePage() {
  const { usuario } = useAuth();
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    getHome()
      .then((res) => setDados(res.data))
      .catch(() => setDados(null))
      .finally(() => setCarregando(false));
  }, []);

  const nomeExibicao = dados?.usuario || usuario?.nome || "Usuário";
  const destino = dados?.destino || "menu";
  const rotuloDestino = dados?.rotuloDestino || "Dashboard";

  return (
    <div className="home-hero">
      <img src={logo} alt="Logo EletroTech" />
      {carregando ? (
        <Carregando texto="Carregando..." />
      ) : (
        <>
          <h1>Bem-vindo, {nomeExibicao}!</h1>
          <p>Sistema de gestão da EletroTech Soluções Elétricas.</p>
          <Link to={`/${destino === "menu" ? "menu" : destino}`}>
            <button className="btn-dashboard">
              <i className="fa-solid fa-gauge-high"></i> Acessar {rotuloDestino}
            </button>
          </Link>
        </>
      )}
    </div>
  );
}
