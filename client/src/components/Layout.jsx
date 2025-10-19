import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle.jsx";
import { isLoggedIn } from "../auth.js";

const clinicName = import.meta.env.VITE_CLINIC_NAME || "Clínica";

export default function Layout({ children }) {
  const logged = isLoggedIn();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header global */}
      <header style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"12px 20px", borderBottom:"1px solid var(--border)"
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontWeight:800 }}>{clinicName}</span>
          <nav style={{ display:"flex", gap:12 }}>
            <Link to="/">Inicio</Link>
            {logged ? <Link to="/pacientes">Pacientes</Link> : <Link to="/login">Login</Link>}
          </nav>
        </div>
        <ThemeToggle />
      </header>

      {/* Contenido de cada página */}
      <main style={{ flex:1, padding: 24 }}>
        {children}
      </main>
    </div>
  );
}
