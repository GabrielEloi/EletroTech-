import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/img/logo-eletrotech.png";

export default function Navbar() {
  const { ehAdmin, pode, logout } = useAuth();
  const { pathname } = useLocation();

  const linkClass = ({ isActive }) => "nav-link" + (isActive ? " active" : "");
  const grupoAtivo = (rotas) =>
    "nav-link dropdown-toggle" + (rotas.some((rota) => pathname.startsWith(rota)) ? " active" : "");

  return (
    <nav className="navbar navbar-expand-lg navbar-custom">
      <div className="container-fluid px-4">
        <NavLink className="navbar-brand d-flex align-items-center" to="/home">
          <img src={logo} alt="Logo Eletrotech" style={{ maxHeight: 60 }} />
        </NavLink>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Abrir navegação"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">
            {pode("menu") && (
              <li className="nav-item">
                <NavLink className={linkClass} to="/menu">Dashboard</NavLink>
              </li>
            )}
            {(ehAdmin || pode("eletricistas") || pode("produtos") || pode("metas")) && (
              <li className="nav-item dropdown">
                <button
                  type="button"
                  className={grupoAtivo(["/usuarios", "/eletricistas", "/produtos", "/metas"])}
                  data-bs-toggle="dropdown"
                >
                  Cadastros
                </button>
                <ul className="dropdown-menu dropdown-menu-dark">
                  {ehAdmin && <li><NavLink className="dropdown-item" to="/usuarios">Usuários</NavLink></li>}
                  {pode("eletricistas") && <li><NavLink className="dropdown-item" to="/eletricistas">Eletricistas</NavLink></li>}
                  {pode("produtos") && <li><NavLink className="dropdown-item" to="/produtos">Produtos</NavLink></li>}
                  {pode("metas") && <li><NavLink className="dropdown-item" to="/metas">Metas</NavLink></li>}
                </ul>
              </li>
            )}
            {(pode("ordemServico") || pode("checklist") || pode("baixas") || ehAdmin) && (
              <li className="nav-item dropdown">
                <button
                  type="button"
                  className={grupoAtivo(["/ordem-servico", "/checklist", "/consulta-checklist", "/baixas", "/lancamentos"])}
                  data-bs-toggle="dropdown"
                >
                  Operações
                </button>
                <ul className="dropdown-menu dropdown-menu-dark">
                  {pode("ordemServico") && <li><NavLink className="dropdown-item" to="/ordem-servico">Ordens de Serviço</NavLink></li>}
                  {pode("checklist") && <li><NavLink className="dropdown-item" to="/checklist">Checklist</NavLink></li>}
                  {pode("checklist") && <li><NavLink className="dropdown-item" to="/consulta-checklist">Consulta Checklist</NavLink></li>}
                  {pode("baixas") && <li><NavLink className="dropdown-item" to="/baixas">Movimentação</NavLink></li>}
                  {ehAdmin && <li><NavLink className="dropdown-item" to="/lancamentos">Baixas de Estoque</NavLink></li>}
                </ul>
              </li>
            )}
            <li className="nav-item ms-3">
              <button
                className="nav-link text-danger fw-bold btn btn-link"
                style={{ background: "transparent", border: "none" }}
                onClick={logout}
              >
                Sair
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
