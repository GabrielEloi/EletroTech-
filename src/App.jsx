import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificacaoProvider } from "./context/NotificacaoContext";
import RotaProtegida from "./components/RotaProtegida";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import UsuariosPage from "./pages/UsuariosPage";
import EletricistasPage from "./pages/EletricistasPage";
import ProdutosPage from "./pages/ProdutosPage";
import MetasPage from "./pages/MetasPage";
import OrdemServicoPage from "./pages/OrdemServicoPage";
import ChecklistPage from "./pages/ChecklistPage";
import ConsultaChecklistPage from "./pages/ConsultaChecklistPage";
import BaixasPage from "./pages/BaixasPage";
import LancamentosPage from "./pages/LancamentosPage";

function RotaLogin() {
  const { usuario } = useAuth();
  if (usuario) return <Navigate to="/home" replace />;
  return <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <NotificacaoProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<RotaLogin />} />

            <Route path="/home" element={<RotaProtegida><HomePage /></RotaProtegida>} />
            <Route path="/menu" element={<RotaProtegida permissao="menu"><MenuPage /></RotaProtegida>} />
            <Route path="/usuarios" element={<RotaProtegida permissao="adminOnly"><UsuariosPage /></RotaProtegida>} />
            <Route path="/eletricistas" element={<RotaProtegida permissao="eletricistas"><EletricistasPage /></RotaProtegida>} />
            <Route path="/produtos" element={<RotaProtegida permissao="produtos"><ProdutosPage /></RotaProtegida>} />
            <Route path="/metas" element={<RotaProtegida permissao="metas"><MetasPage /></RotaProtegida>} />
            <Route path="/ordem-servico" element={<RotaProtegida permissao="ordemServico"><OrdemServicoPage /></RotaProtegida>} />
            <Route path="/checklist" element={<RotaProtegida permissao="checklist"><ChecklistPage /></RotaProtegida>} />
            <Route path="/consulta-checklist" element={<RotaProtegida permissao="checklist"><ConsultaChecklistPage /></RotaProtegida>} />
            <Route path="/baixas" element={<RotaProtegida permissao="baixas"><BaixasPage /></RotaProtegida>} />
            <Route path="/lancamentos" element={<RotaProtegida permissao="adminOnly"><LancamentosPage /></RotaProtegida>} />

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificacaoProvider>
    </AuthProvider>
  );
}
