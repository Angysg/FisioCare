import { useState } from "react";
import api from "../api";
import { saveSession } from "../auth";
import { useNavigate } from "react-router-dom";
import PublicHeader from "../components/PublicHeader.jsx";

// Detecta si el tema activo es oscuro leyendo las variables CSS
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

export default function Login() {
  const [email, setEmail] = useState("admin@clinica.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const nav = useNavigate();
  const darkNow = isDarkThemeByVars();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", {
        email,
        password,
      });
      saveSession(data);
      nav("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.error?.message || "Error de login"
      );
    } finally {
      setLoading(false);
    }
  }

  // Fondo pantalla → azul claro igual que la landing
  const pageBackgroundStyle = {
    backgroundColor: darkNow
      ? "var(--surface)"
      : "#e6f0ff", // color azul claro del modo claro
    minHeight: "calc(100vh - 60px)",
    display: "grid",
    placeItems: "center",
    padding: "2rem 1rem 3rem",
    transition: "background 0.4s ease",
  };

  // Tarjeta (sin cambios)
  const cardStyle = {
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    borderRadius: 12,
    width: 380,
    maxWidth: "90vw",
    padding: "24px 24px 20px",
    boxShadow: "var(--card-shadow)",
  };

  // Input
  const inputStyle = {
    width: "100%",
    background: "var(--input-bg)",
    color: "var(--input-text)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: "1.1rem",
    lineHeight: 1.4,
    boxSizing: "border-box",
  };

  // Botón 🤫 mostrar/ocultar contraseña
  const faceBtnStyle = {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--panel)",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    userSelect: "none",
    lineHeight: 1,
    padding: 0,
    boxShadow: darkNow
      ? "0 1px 4px rgba(0,0,0,.6)"
      : "0 1px 4px rgba(0,0,0,.06)",
  };

  const submitBtnStyle = {
    width: "100%",
    fontSize: "1.1rem",
    fontWeight: 500,
    lineHeight: 1.3,
    padding: "12px 16px",
    marginTop: 4,
    opacity: loading ? 0.6 : 1,
  };

  return (
    <>
      <PublicHeader />
      <main style={pageBackgroundStyle}>
        <form onSubmit={onSubmit} style={cardStyle}>
          <h1
            style={{
              marginBottom: 16,
              fontSize: "1.6rem",
              fontWeight: 800,
              color: "var(--text)",
            }}
          >
            Iniciar sesión
          </h1>

          {/* EMAIL */}
          <label
            style={{
              display: "block",
              fontSize: "1.2rem",
              fontWeight: 500,
              color: "var(--text)",
            }}
          >
            Email:
          </label>

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ ...inputStyle, margin: "6px 0 12px" }}
            autoComplete="username"
          />

          {/* PASS */}
          <label
            style={{
              display: "block",
              fontSize: "1.2rem",
              fontWeight: 500,
              color: "var(--text)",
            }}
          >
            Contraseña:
          </label>

          <div
            style={{
              position: "relative",
              width: "100%",
              marginBottom: 16,
            }}
          >
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                ...inputStyle,
                paddingRight: 44,
              }}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              title={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              style={faceBtnStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "color-mix(in srgb, var(--link) 8%, var(--panel))";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--panel)";
              }}
            >
              <span style={{ fontSize: 20 }}>
                {showPass ? "🙂" : "🤫"}
              </span>
            </button>
          </div>

          {error && (
            <div
              style={{
                color: "#f87171",
                marginBottom: 10,
                fontSize: "0.9rem",
                lineHeight: 1.4,
              }}
            >
              {error}
            </div>
          )}

          <button type="submit" style={submitBtnStyle} disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </main>
    </>
  );
}
