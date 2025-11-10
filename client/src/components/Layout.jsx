import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { getUser, logout } from "../auth";

function normalizeRole(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // quita tildes
}

export default function Layout() {
  // guardamos el usuario logado localmente
  const [user, setUser] = useState(() => getUser());
  const roleRaw = user?.role || user?.rol || user?.tipo || "";
  const role = normalizeRole(roleRaw);

  useEffect(() => {
    const u = getUser();
    setUser(u || null);
  }, []);

  const isAdmin = role.includes("admin");         // cubre "admin" y "administrador"
  const isRecepcion = role.includes("recepcion"); // cubre "recepción" normalizada

  // links para la navegación central
  const baseLinks = [
    { to: "/dashboard", label: "Inicio" },
    { to: "/pacientes", label: "Pacientes" },
    { to: "/citas", label: "Citas" },
    { to: "/seguimientos", label: "Seguimiento y Valoración" },
    { to: "/pilates", label: "Grupo Pilates" },
    { to: "/vacaciones", label: "Vacaciones" },
  ];

  const adminLinks = isAdmin
    ? [
        { to: "/fisioterapeutas", label: "Fisioterapeutas" },
        { to: "/analitica-dolencias", label: "Gráficos" }, // ✅ nuevo enlace
      ]
    : [];

  // Recepción: mostrar SIEMPRE Inicio + Pacientes + Citas
  const links = isRecepcion
    ? baseLinks.filter((l) => ["/dashboard", "/pacientes", "/citas"].includes(l.to))
    : [...baseLinks, ...adminLinks];

  // estilos reutilizables
  const userChipStyle = {
    fontSize: "0.8rem",
    lineHeight: 1.2,
    fontWeight: 500,
    color: "var(--text)",
    background: "var(--panel)",
    border: "1px solid var(--border)",
    borderRadius: "0.5rem",
    padding: "0.5rem 0.75rem",
    whiteSpace: "nowrap",
  };

  const logoutBtnStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    borderRadius: "0.5rem",
    padding: "0.5rem 0.75rem",
    fontSize: "0.8rem",
    fontWeight: 500,
    lineHeight: 1.2,
    cursor: "pointer",
  };

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
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "10px 24px",
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            alignItems: "center",
            columnGap: "16px",
          }}
        >
          {/* IZQUIERDA: marca */}
          <div style={{ justifySelf: "start" }}>
            <Link
              to="/dashboard"
              style={{
                fontWeight: 800,
                textDecoration: "none",
                color: "var(--text)",
                fontSize: "1.1rem",
                letterSpacing: ".2px",
                whiteSpace: "nowrap",
              }}
            >
              Clínica FisioCare
            </Link>
          </div>

          {/* CENTRO: navegación */}
          <nav
            className="topnav"
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "12px 16px",
              minHeight: "2rem",
            }}
          >
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => (isActive ? "active" : "")}
                style={{
                  fontSize: "0.95rem",
                  lineHeight: 1.2,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* DERECHA: usuario + salir + tema */}
          <div
            style={{
              justifySelf: "end",
              display: "flex",
              alignItems: "center",
              flexWrap: "nowrap",
              gap: "8px",
              minWidth: 0,
            }}
          >
            {user && (
              <span style={userChipStyle}>
                {user.nombre || user.name} {roleRaw ? `(${roleRaw})` : ""}
              </span>
            )}

            {user && (
              <button
                onClick={() => {
                  logout();
                  setUser(null);
                  window.location.href = "/login";
                }}
                style={logoutBtnStyle}
              >
                Salir
              </button>
            )}

            <ThemeToggle />
          </div>
        </div>
      </header>

      <div
        className="container"
        style={{ paddingTop: 16, maxWidth: "1280px", margin: "0 auto" }}
      >
        <Outlet />
      </div>
    </>
  );
}
