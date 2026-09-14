import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "./Layout";

export default function RotaProtegida({ children, permissao }) {
  const { usuario, pode, ehAdmin } = useAuth();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (permissao && !pode(permissao) && permissao !== "adminOnly") {
    return <Navigate to="/home" replace />;
  }

  if (permissao === "adminOnly" && !ehAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <Layout>{children}</Layout>;
}
