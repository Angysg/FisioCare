import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

export default function PublicHeader() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
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
            to="/login"
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

        {/* CENTRO: vacío (no links en público) */}
        <div />

        {/* DERECHA: tema */}
        <div
          style={{
            justifySelf: "end",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
