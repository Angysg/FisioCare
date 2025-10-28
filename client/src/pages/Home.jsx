import { useNavigate } from "react-router-dom";
import { isLoggedIn } from "../auth";
import PublicHeader from "../components/PublicHeader.jsx";

// detecta si el tema activo es oscuro leyendo --bg
function isDarkThemeByVars() {
  const bg = getComputedStyle(document.body)
    .getPropertyValue("--bg")
    .trim();
  let r = 255, g = 255, b = 255;
  if (bg.startsWith("rgb")) {
    const nums = bg
      .replace(/rgba?\(/, "")
      .replace(")", "")
      .split(",")
      .map((n) => parseFloat(n.trim()));
    [r, g, b] = nums;
  } else if (bg.startsWith("#")) {
    const hex = bg.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length >= 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
  }
  const luminance =
    0.2126 * (r / 255) +
    0.7152 * (g / 255) +
    0.0722 * (b / 255);
  return luminance < 0.4;
}

export default function Home() {
  const nav = useNavigate();
  const darkNow = isDarkThemeByVars();

  function ir() {
    nav(isLoggedIn() ? "/pacientes" : "/login");
  }

  // Fondo general:
  // - En claro → ese azul clarito que ya usas en modo claro (var(--bg) ahora mismo es #e6f0ff)
  // - En oscuro → tu surface navy oscuro
  const pageBackgroundStyle = {
    backgroundColor: darkNow ? "var(--surface)" : "var(--bg)",
    minHeight: "calc(100vh - 60px)",
    display: "grid",
    placeItems: "center",
    padding: "2rem 1rem 3rem",
    transition: "background 0.4s ease",
  };

  // Card 
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

  // Botón 
  const btnStyle = {
    display: "inline-block",
    fontSize: "1rem",
    fontWeight: 500,
    lineHeight: 1.3,
    padding: "10px 16px",
    borderRadius: 6,
    border: "1px solid rgba(0,0,0,.2)",
    background: "var(--link)",
    color: "white",
    cursor: "pointer",
    transition: "background .2s ease, box-shadow .2s ease",
    boxShadow: darkNow
      ? "0 4px 10px rgba(0,0,0,.6)"
      : "0 4px 10px rgba(0,0,0,.15)",
  };

  const btnHoverBg = {
    background: "var(--link-hover)",
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

  const clinicName =
    import.meta.env.VITE_CLINIC_NAME || "Clínica FisioCare";

  return (
    <>
      {/* Header tipo segunda imagen */}
      <PublicHeader />

      {/* Fondo tipo primera imagen */}
      <main style={pageBackgroundStyle}>
        <div style={cardStyle}>
          {/* Título multilinea y negrita como la primera imagen */}
          <h1 style={headingStyle}>
            Bienvenid@ a {clinicName}
          </h1>

          <p style={paragraphStyle}>
            Gestiona profesionales, pacientes, citas y
            adjuntos de forma sencilla.
          </p>

          <button
            onClick={ir}
            style={btnStyle}
            onMouseEnter={(e) =>
              Object.assign(
                e.currentTarget.style,
                btnHoverBg
              )
            }
            onMouseLeave={(e) =>
              Object.assign(
                e.currentTarget.style,
                btnStyle
              )
            }
          >
            Entrar
          </button>
        </div>
      </main>
    </>
  );
}
