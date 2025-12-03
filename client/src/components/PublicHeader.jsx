// client/src/components/PublicHeader.jsx
/**
 * PublicHeader es la cabecera que se muestra solo en las páginas públicas, como el login o la portada. 
 * Es una versión simplificada del header principal: solo muestra el logo y el botón de tema, sin menú ni usuario.
 */

import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

export default function PublicHeader() {
  return (
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
          padding: "10px 32px",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "center",
          columnGap: "32px",
        }}
      >
        {/* Logo (igual que en Layout, pero sin menú) */}
        <div style={{ justifySelf: "start" }}>
          <Link
            to="/"
            style={{
              display: "block",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            <div
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
                  height: 200,
                  width: "auto",
                  display: "block",
                  marginTop: 10,
                }}
              />
            </div>
          </Link>
        </div>

        {/* Espacio vacío para centrar distribución */}
        <div></div>

        {/* Botón modo claro/oscuro */}
        <div style={{ justifySelf: "end" }}>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
