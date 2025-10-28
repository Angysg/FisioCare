import { useNavigate } from "react-router-dom";
import { isLoggedIn } from "../auth";
import PublicHeader from "../components/PublicHeader.jsx";

export default function Home() {
  const nav = useNavigate();

  function ir() {
    nav(isLoggedIn() ? "/pacientes" : "/login");
  }

  const clinicName =
    import.meta.env.VITE_CLINIC_NAME || "Clínica FisioCare";

  // main: ocupa la pantalla, centra la tarjeta, PERO
  // NO fuerza color de fondo. Deja que el body pinte var(--bg).
  const mainStyle = {
    minHeight: "calc(100vh - 60px)",
    display: "grid",
    placeItems: "center",
    padding: "2rem 1rem 3rem",
  };

  // Card: ya usa variables del tema, sin colores fijos.
  const cardStyle = {
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    borderRadius: 12,
    width: "100%",
    maxWidth: 520,
    padding: "24px 24px 20px",
    textAlign: "center",
    boxShadow: "var(--card-shadow)",
  };

  const headingStyle = {
    marginTop: 0,
    marginBottom: "1rem",
    fontSize: "1.8rem",
    fontWeight: 800,
    lineHeight: 1.3,
    color: "var(--text)",
  };

  const paragraphStyle = {
    margin: "0 0 1.25rem",
    fontSize: "1rem",
    lineHeight: 1.5,
    color: "var(--text)",
    opacity: 0.8,
    maxWidth: 480,
    marginLeft: "auto",
    marginRight: "auto",
  };

  // Botón: todo a variables del tema,
  // sin hover con JS (menos parpadeos al cambiar tema)
  const btnStyle = {
    display: "inline-block",
    fontSize: "1rem",
    fontWeight: 500,
    lineHeight: 1.3,
    padding: "10px 16px",
    borderRadius: 6,
    border: "1px solid rgba(0,0,0,.2)",
    background: "var(--link)",
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0,0,0,.4)",
    transition: "filter .15s ease, box-shadow .15s ease",
  };

  return (
    <>
      <PublicHeader />

      <main style={mainStyle}>
        <div style={cardStyle}>
          <h1 style={headingStyle}>
            Bienvenid@ a {clinicName}
          </h1>

          <p style={paragraphStyle}>
            Gestiona profesionales, pacientes, citas y adjuntos
            de forma sencilla.
          </p>

          <button
            onClick={ir}
            style={btnStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = "brightness(1.05)";
              e.currentTarget.style.boxShadow =
                "0 6px 14px rgba(0,0,0,.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "";
              e.currentTarget.style.boxShadow =
                "0 4px 10px rgba(0,0,0,.4)";
            }}
          >
            Entrar
          </button>
        </div>
      </main>
    </>
  );
}
