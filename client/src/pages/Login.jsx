import { useState } from "react";
import api from "../api";
import { saveSession } from "../auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("admin@clinica.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      // IMPORTANTE: que saveSession guarde { user: { role: 'admin' | 'fisioterapeuta', ... }, token: '...' }
      saveSession(data);
      nav("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Error de login");
    } finally {
      setLoading(false);
    }
  }

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
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", margin: "6px 0 16px" }}
          autoComplete="current-password"
        />

        {error && <div style={{ color: "#f87171", marginBottom: 10 }}>{error}</div>}

        <button type="submit" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
