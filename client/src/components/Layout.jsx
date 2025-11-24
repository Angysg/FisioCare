import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { getUser, logout } from "../auth";

function normalizeRole(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function Layout() {
  const [user, setUser] = useState(() => getUser());
  const roleRaw = user?.role || user?.rol || user?.tipo || "";
  const role = normalizeRole(roleRaw);

  useEffect(() => {
    const u = getUser();
    setUser(u || null);
  }, []);

  const isAdmin = role.includes("admin");
  const isRecepcion = role.includes("recepcion");

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

  const links = isRecepcion
    ? baseLinks.filter((l) =>
        ["/dashboard", "/pacientes", "/citas"].includes(l.to)
      )
    : [...baseLinks, ...adminLinks];

  const userChipStyle = {
    fontSize: "1rem",
    lineHeight: 1.2,
    fontWeight: 500,
    color: "var(--text)",
    background: "var(--panel)",
    border: "1px solid var(--border)",
    borderRadius: "0.5rem",
    padding: "0.6rem 0.9rem",
    whiteSpace: "nowrap",
  };

  const logoutBtnStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    borderRadius: "0.5rem",
    padding: "0.55rem 0.9rem",
    fontSize: "1rem",
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
          className="header-inner"
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "6px 32px", // alto del header en escritorio
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            alignItems: "center",
            columnGap: "80px",
          }}
        >
          {/* IZQUIERDA: logo */}
          <div className="header-left" style={{ justifySelf: "start" }}>
            <Link
              to="/dashboard"
              style={{
                display: "block",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              <div
                className="logo-box"
                style={{
                  height: 82,
                  width: 270,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <img
                  src="/logo_FisioCare.png"
                  alt="Clínica FisioCare"
                  style={{
                    height: 210,
                    width: "auto",
                    display: "block",
                    marginTop: 10,
                  }}
                />
              </div>
            </Link>
          </div>

          {/* CENTRO: navegación */}
          <nav
            className="topnav header-center"
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "18px 30px",
              minHeight: "2.6rem",
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

          {/* DERECHA: usuario + salir + tema */}
          <div
            className="header-right"
            style={{
              justifySelf: "end",
              display: "flex",
              alignItems: "center",
              flexWrap: "nowrap",
              gap: "10px",
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
