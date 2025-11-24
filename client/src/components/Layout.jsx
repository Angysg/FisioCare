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

  const isAdmin = role.includes("admin"); // cubre "admin" y "administrador"
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
      { to: "/analitica-dolencias", label: "Gráficos" },
    ]
    : [];

  // Recepción: mostrar SIEMPRE Inicio + Pacientes + Citas
  const links = isRecepcion
    ? baseLinks.filter((l) =>
      ["/dashboard", "/pacientes", "/citas"].includes(l.to)
    )
    : [...baseLinks, ...adminLinks];

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
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "4px 48px",      // <<< menos alto arriba/abajo
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            alignItems: "center",
            columnGap: "80px",         // separación entre logo / nav / botones
          }}
        >
          {/* IZQUIERDA: logo */}
          <div style={{ justifySelf: "start" }}>
            <Link
              to="/dashboard"
              style={{
                display: "block",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              <div
                style={{
                  height: 60,          // <<< MUCHO MÁS BAJO
                  width: 260,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <img
                  src="/logo_FisioCare.png"
                  alt="Clínica FisioCare"
                  style={{
                    height: 180,       // <<< antes 220 → ahora más compacto
                    width: "auto",
                    display: "block",
                    marginTop: 4,      // <<< menos desplazamiento
                  }}
                />
              </div>
            </Link>
          </div>


          {/* CENTRO: navegación */}
          <nav
            className="topnav"
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "18px 30px",
              minHeight: "2.4rem",
            }}
          >
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => (isActive ? "active" : "")}
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 630,
                  lineHeight: 1.3,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* DERECHA: usuario + botones */}
          <div
            style={{
              justifySelf: "end",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              minWidth: 0,
            }}
          >
            {user && (
              <span
                style={{
                  fontSize: "0.9rem",
                  lineHeight: 1,
                  fontWeight: 500,
                  color: "var(--text)",
                  background: "var(--panel)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.5rem",
                  padding: "0.60rem 1rem",
                  whiteSpace: "nowrap",
                }}
              >
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
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  borderRadius: "0.5rem",
                  padding: "0.6rem 1rem",
                  fontSize: "1rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
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
