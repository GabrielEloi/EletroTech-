import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "./Layout";

export default function RotaProtegida({ children, permissao }) {
  const { usuario, pode, ehAdmin, ehEletricista } = useAuth();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (permissao === "menu" && !ehAdmin && !ehEletricista) {
    return <Navigate to="/home" replace />;
  }

  if (permissao && !pode(permissao) && permissao !== "adminOnly") {
    return <Navigate to="/home" replace />;
  }

  if (permissao === "adminOnly" && !ehAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <Layout>{children}</Layout>;
}
