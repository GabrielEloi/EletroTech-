import Navbar from "./Navbar";
import Chatbot from "./Chatbot";

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="container-fluid px-4 py-4">{children}</main>
      <Chatbot />
    </div>
  );
}
