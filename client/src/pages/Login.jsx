import { useState } from "react";
import api from "../api";
import { saveSession } from "../auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("admin@clinica.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false); // 👈 toggle

  const nav = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      saveSession(data);
      nav("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Error de login");
    } finally {
      setLoading(false);
    }
  }

  // estilos compactos para el botón del ojito/cara
  const faceBtn = {
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
    boxShadow: "0 1px 4px rgba(0,0,0,.06)",
    lineHeight: 1,
    padding: 0,
  };

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
      <form onSubmit={onSubmit} className="card" style={{ width: 380 }}>
        <h1 style={{ marginBottom: 16 }}>Iniciar sesión</h1>

        <label>Email:</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", margin: "6px 0 12px" }}
          autoComplete="username"
        />

        <label>Contraseña:</label>
        <div style={{ position: "relative", width: "100%", marginBottom: 16 }}>
          <input
            type={showPass ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", paddingRight: 44 }}
            autoComplete="current-password"
          />

          <button
            type="button"
            onClick={() => setShowPass((s) => !s)}
            aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
            title={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
            style={faceBtn}
            onMouseEnter={(e) => (e.currentTarget.style.background = "color-mix(in srgb, var(--link) 8%, var(--panel))")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--panel)")}
          >
            <span style={{ fontSize: 20 }}>{showPass ? "🙂" : "🤫"}</span>
          </button>
        </div>

        {error && <div style={{ color: "#f87171", marginBottom: 10 }}>{error}</div>}

        <button type="submit" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
