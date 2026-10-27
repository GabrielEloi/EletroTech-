import Navbar from "./Navbar";
import Chatbot from "./Chatbot";

import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const { ehEletricista } = useAuth();
  return (
    <div className="app-shell">
      <Navbar />
      <main className="container-fluid px-4 py-4">{children}</main>
      {/* O eletricista acessa somente os três módulos do seu perfil. */}
      {!ehEletricista && <Chatbot />}
    </div>
  );
}
