import { Navigate } from "react-router-dom";
import { useAuth } from "../context/auth-store";
import Layout from "./Layout";
import { Carregando } from './EstadoLista';

export default function RotaProtegida({ children, permissao }) {
  const { usuario, pode, ehAdmin, ehSupervisor, carregandoSessao } = useAuth();

  if (carregandoSessao) return <Carregando texto="Validando acesso..." />;

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (permissao && !pode(permissao) && !['adminOnly','supervisorOnly'].includes(permissao)) {
    return <Navigate to="/home" replace />;
  }

  if (permissao === "adminOnly" && !ehAdmin) {
    return <Navigate to="/home" replace />;
  }
  if (permissao === 'supervisorOnly' && !ehSupervisor && !ehAdmin) return <Navigate to="/home" replace />;

  return <Layout>{children}</Layout>;
}
