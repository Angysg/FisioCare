import { useState } from "react";
import api from "../api";
import { saveSession } from "../auth";
import { useNavigate } from "react-router-dom";
import PublicHeader from "../components/PublicHeader.jsx";

export default function Login() {
  const [email, setEmail] = useState("admin@clinica.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const nav = useNavigate();

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

  // Igual que en Home corregida:
  // main no fuerza color de fondo. El body (via tema) pinta var(--bg).
  const mainStyle = {
    minHeight: "calc(100vh - 60px)",
    display: "grid",
    placeItems: "center",
    padding: "2rem 1rem 3rem",
  };

  // Tarjeta de login: usa variables del tema
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

  // Botón 🤫 mostrar/ocultar contraseña.
  // Ya no dependemos de darkNow; usamos solo variables,
  // y un pequeño efecto hover que ajusta brightness.
  const faceBtnBaseStyle = {
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
    boxShadow: "0 1px 4px rgba(0,0,0,.4)",
    transition: "filter .15s ease, box-shadow .15s ease, background .15s ease",
  };

  // Botón submit
  // Usa las mismas variables globales que ya definimos en app.css para botones,
  // pero reforzamos ancho y tipografía aquí.
  const submitBtnStyle = {
    width: "100%",
    fontSize: "1.1rem",
    fontWeight: 500,
    lineHeight: 1.3,
    padding: "12px 16px",
    marginTop: 4,
    opacity: loading ? 0.6 : 1,
    borderRadius: 8,
    border: "1px solid var(--btn-border)",
    background: "var(--btn-bg)",
    color: "var(--btn-text)",
    cursor: loading ? "default" : "pointer",
    boxShadow: "0 2px 6px rgba(0,0,0,.4)",
    transition: "filter .15s ease, box-shadow .15s ease",
  };

  return (
    <>
      <PublicHeader />

      <main style={mainStyle}>
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
              style={faceBtnBaseStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = "brightness(1.07)";
                e.currentTarget.style.boxShadow =
                  "0 2px 6px rgba(0,0,0,.5)";
                e.currentTarget.style.background =
                  "color-mix(in srgb, var(--link) 8%, var(--panel))";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "";
                e.currentTarget.style.boxShadow =
                  "0 1px 4px rgba(0,0,0,.4)";
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

          <button
            type="submit"
            style={submitBtnStyle}
            disabled={loading}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.filter = "brightness(1.05)";
                e.currentTarget.style.boxShadow =
                  "0 3px 8px rgba(0,0,0,.55)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "";
              e.currentTarget.style.boxShadow =
                "0 2px 6px rgba(0,0,0,.4)";
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </main>
    </>
  );
}
