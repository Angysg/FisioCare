import { Link, NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { getRole } from "../session";

export default function Layout({ children }) {
  const role = getRole(); // "admin" | "fisioterapeuta"

  const base = [
    { to: "/", label: "Inicio" },
    { to: "/pacientes", label: "Pacientes" },
    { to: "/citas", label: "Citas" },
    { to: "/seguimiento", label: "Seguimiento y Valoración" },
    { to: "/pilates", label: "Grupo Pilates" },
  ];
  const extraAdmin =
    role === "admin" ? [{ to: "/fisioterapeutas", label: "Fisioterapeutas" }] : [];
  const links = [...base, ...extraAdmin];

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "saturate(180%) blur(8px)",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Wrapper del header un poco más ancho que .container normal */}
        <div
          style={{
            maxWidth: "1280px",              // ⬅️ más ancho para separar extremos
            margin: "0 auto",
            padding: "10px 24px",            // ⬅️ pequeño padding lateral
            display: "grid",
            gridTemplateColumns: "auto 1fr auto", // título | nav | toggle
            alignItems: "center",
            columnGap: "16px",
          }}
        >
          {/* Izquierda: logo / título */}
          <div style={{ justifySelf: "start" }}>
            <Link
              to="/"
              style={{
                fontWeight: 800,
                textDecoration: "none",
                color: "var(--text)",
                fontSize: "1.1rem",
                letterSpacing: ".2px",
              }}
            >
              Clínica FisioCare
            </Link>
          </div>

          {/* Centro: navegación */}
          <nav
            className="topnav"
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* Derecha: botón tema completamente al extremo */}
          <div style={{ justifySelf: "end" }}>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Contenido con el ancho habitual */}
      <div className="container" style={{ paddingTop: 16 }}>
        {children}
      </div>
    </>
  );
}
