import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/img/logo-eletrotech.png";

export default function Navbar() {
  const { ehAdmin, pode, logout } = useAuth();

  const linkClass = ({ isActive }) => "nav-link" + (isActive ? " active" : "");

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
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-center">
            {pode("menu") && (
              <li className="nav-item">
                <NavLink className={linkClass} to="/menu">Dashboard</NavLink>
              </li>
            )}
            {ehAdmin && (
              <li className="nav-item">
                <NavLink className={linkClass} to="/usuarios">Usuários</NavLink>
              </li>
            )}
            {pode("eletricistas") && (
              <li className="nav-item">
                <NavLink className={linkClass} to="/eletricistas">Eletricistas</NavLink>
              </li>
            )}
            {pode("produtos") && (
              <li className="nav-item">
                <NavLink className={linkClass} to="/produtos">Produtos</NavLink>
              </li>
            )}
            {pode("metas") && (
              <li className="nav-item">
                <NavLink className={linkClass} to="/metas">Metas</NavLink>
              </li>
            )}
            {pode("ordemServico") && (
              <li className="nav-item">
                <NavLink className={linkClass} to="/ordem-servico">Ordens de Serviço</NavLink>
              </li>
            )}
            {pode("checklist") && (
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                >
                  Checklist
                </a>
                <ul className="dropdown-menu dropdown-menu-dark">
                  <li>
                    <NavLink className="dropdown-item" to="/checklist">Seleção Checklist</NavLink>
                  </li>
                  <li>
                    <NavLink className="dropdown-item" to="/consulta-checklist">Consulta Checklist</NavLink>
                  </li>
                </ul>
              </li>
            )}
            {pode("baixas") && (
              <li className="nav-item">
                <NavLink className={linkClass} to="/baixas">Movimentação</NavLink>
              </li>
            )}
            {ehAdmin && (
              <li className="nav-item">
                <NavLink className={linkClass} to="/lancamentos">Baixas</NavLink>
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
