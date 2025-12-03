// client/src/components/Layout.jsx
/**
 * Es el “marco” general de la aplicación:
muestra el header, la navegación, los datos del usuario, el botón de salir y el selector de tema, 
y debajo renderiza cada página usando <Outlet />.

 */

// React y React Router para navegación
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

// Botón de cambiar tema (oscuro/claro)
import ThemeToggle from "./ThemeToggle";

// Funciones de sesión del usuario
import { getUser, logout } from "../auth";

// Normaliza el rol por si viene con mayúsculas, acentos u otros formatos
function normalizeRole(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function Layout() {
  // Cargamos usuario desde localStorage/sessionStorage
  const [user, setUser] = useState(() => getUser());

  // Detección del rol (admin, recepcion, fisio…)
  const roleRaw = user?.role || user?.rol || user?.tipo || "";
  const role = normalizeRole(roleRaw);

  // Cuando el layout se monta, vuelve a leer el usuario
  useEffect(() => {
    const u = getUser();
    setUser(u || null);
  }, []);

  // Flags de rol para controlar qué enlaces aparecen
  const isAdmin = role.includes("admin");
  const isRecepcion = role.includes("recepcion");

  // Enlaces principales visibles para todos
  const baseLinks = [
    { to: "/dashboard", label: "Inicio" },
    { to: "/pacientes", label: "Pacientes" },
    { to: "/citas", label: "Citas" },
    { to: "/seguimientos", label: "Seguimiento y Valoración" },
    { to: "/pilates", label: "Grupo Pilates" },
    { to: "/vacaciones", label: "Vacaciones" },
  ];

  // Enlaces solo para administradores
  const adminLinks = isAdmin
    ? [
        { to: "/fisioterapeutas", label: "Fisioterapeutas" },
        { to: "/analitica-dolencias", label: "Gráficos" },
      ]
    : [];

  // Recepción solo ve parte del menú
  const links = isRecepcion
    ? baseLinks.filter((l) =>
        ["/dashboard", "/pacientes", "/citas"].includes(l.to)
      )
    : [...baseLinks, ...adminLinks];

  // Estilos para el recuadro del usuario arriba a la derecha
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

  // Estilo del botón de logout
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
      {/* HEADER FIJO ARRIBA */}
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
        {/* Contenido del header */}
        <div
          className="header-inner"
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "6px 32px", // altura en escritorio
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            alignItems: "center",
            columnGap: "80px",
          }}
        >

          {/* IZQUIERDA → LOGO */}
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

          {/* CENTRO → MENÚ DE NAVEGACIÓN */}
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

          {/* DERECHA → usuario + botón salir + tema */}
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
            {/* Nombre del usuario y rol */}
            {user && (
              <span style={userChipStyle}>
                {user.nombre || user.name} {roleRaw ? `(${roleRaw})` : ""}
              </span>
            )}

            {/* Botón cerrar sesión */}
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

            {/* Selector de tema oscuro/claro */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL → aquí se cargan las páginas */}
      <div
        className="container"
        style={{ paddingTop: 16, maxWidth: "1280px", margin: "0 auto" }}
      >
        <Outlet /> {/* React Router injecta aquí la página actual */}
      </div>
    </>
  );
}
