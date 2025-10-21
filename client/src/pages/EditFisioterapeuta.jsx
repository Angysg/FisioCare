// client/src/pages/EditFisioterapeuta.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { apiGetFisio, apiUpdateFisio, apiCreateFisioAccess, apiResetFisioPassword } from "../api";

function Btn({ variant = "primary", children, disabled, onClick, type = "button" }) {
  const palette =
    variant === "secondary"
      ? {
          color: "var(--link)",
          border: "1px solid color-mix(in srgb, var(--link) 45%, transparent)",
          bg: "color-mix(in srgb, var(--link) 8%, transparent)",
          bgHover: "color-mix(in srgb, var(--link) 16%, transparent)",
          focus: "0 0 0 3px color-mix(in srgb, var(--link) 32%, transparent)",
        }
      : variant === "danger"
      ? {
          color: "white",
          border: "1px solid rgba(185,28,28,.5)",
          bg: "rgba(185,28,28,.85)",
          bgHover: "rgba(185,28,28,.95)",
          focus: "0 0 0 3px rgba(185,28,28,.35)",
        }
      : {
          color: "white",
          border: "1px solid color-mix(in srgb, var(--link) 55%, black 0%)",
          bg: "color-mix(in srgb, var(--link) 72%, black 0%)",
          bgHover: "color-mix(in srgb, var(--link) 84%, black 0%)",
          focus: "0 0 0 3px color-mix(in srgb, var(--link) 40%, transparent)",
        };

  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "10px 16px",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    border: palette.border,
    background: palette.bg,
    color: palette.color,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    transition: "background 180ms, box-shadow 180ms, transform 60ms",
    textDecoration: "none",
    userSelect: "none",
    outline: "none",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={base}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = palette.bgHover)}
      onMouseLeave={(e) => (e.currentTarget.style.background = palette.bg)}
      onFocus={(e) => !disabled && (e.currentTarget.style.boxShadow = palette.focus)}
      onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "translateY(1px)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      {children}
    </button>
  );
}

export default function EditFisioterapeuta() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    especialidades: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Acceso a la app
  const [passAccion, setPassAccion] = useState(""); // texto de nueva contraseña (opcional)
  const [creatingAccess, setCreatingAccess] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const f = await apiGetFisio(id);
        setForm({
          nombre: f?.nombre || "",
          apellidos: f?.apellidos || "",
          email: f?.email || "",
          telefono: f?.telefono || "",
          especialidades: Array.isArray(f?.especialidades) ? f.especialidades.join(", ") : "",
        });
      } catch (e) {
        alert("No se pudo cargar el fisioterapeuta");
        navigate("/fisioterapeutas");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiUpdateFisio(id, { ...form }); // backend parsea especialidades
      alert("Fisioterapeuta actualizado");
      navigate("/fisioterapeutas");
    } catch (e) {
      alert(e?.response?.data?.error || "No se pudo actualizar el fisioterapeuta");
    } finally {
      setSaving(false);
    }
  }

  async function crearAcceso() {
    if (!confirm("¿Crear acceso de usuario para este fisioterapeuta?")) return;
    setCreatingAccess(true);
    try {
      const r = await apiCreateFisioAccess(id, passAccion || undefined);
      if (r?.ok) {
        const tmp = r?.data?.tempPassword;
        alert(`Acceso creado correctamente.${tmp ? `\nContraseña temporal: ${tmp}` : ""}`);
        setPassAccion("");
      } else {
        alert(r?.error || "No se pudo crear el acceso.");
      }
    } catch (e) {
      alert(e?.response?.data?.error || "No se pudo crear el acceso.");
    } finally {
      setCreatingAccess(false);
    }
  }

  async function resetPassword() {
    if (!confirm("¿Resetear la contraseña de este fisioterapeuta?")) return;
    setResetting(true);
    try {
      const r = await apiResetFisioPassword(id, passAccion || undefined);
      if (r?.ok) {
        const tmp = r?.data?.tempPassword;
        alert(`Contraseña restablecida.${tmp ? `\nContraseña temporal: ${tmp}` : ""}`);
        setPassAccion("");
      } else {
        alert(r?.error || "No se pudo resetear la contraseña.");
      }
    } catch (e) {
      alert(e?.response?.data?.error || "No se pudo resetear la contraseña.");
    } finally {
      setResetting(false);
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Cargando...</div>;

  const field = { display: "grid", gap: 6 };
  const label = { fontSize: 14, fontWeight: 600 };
  const input = {
    border: "1px solid var(--border)",
    background: "var(--surface, #fff)",
    color: "var(--text)",
    padding: "10px 12px",
    borderRadius: 10,
    outline: "none",
  };

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Editar fisioterapeuta</h1>

        <Link
          to="/fisioterapeutas"
          className="text-sm"
          style={{ textDecoration: "underline", color: "var(--link)", fontWeight: 600 }}
        >
          Volver
        </Link>
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
        <div className="grid" style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr" }}>
          <div style={field}>
            <label style={label}>Nombre</label>
            <input name="nombre" value={form.nombre} onChange={onChange} required style={input} />
          </div>
          <div style={field}>
            <label style={label}>Apellidos</label>
            <input name="apellidos" value={form.apellidos} onChange={onChange} required style={input} />
          </div>
        </div>

        <div className="grid" style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr" }}>
          <div style={field}>
            <label style={label}>Email</label>
            <input type="email" name="email" value={form.email} onChange={onChange} required style={input} />
          </div>
          <div style={field}>
            <label style={label}>Teléfono</label>
            <input name="telefono" value={form.telefono} onChange={onChange} style={input} />
          </div>
        </div>

        <div style={field}>
          <label style={label}>Especialidades</label>
          <input
            name="especialidades"
            value={form.especialidades}
            onChange={onChange}
            style={input}
            placeholder="Terapia Manual, Osteopatía, Deportiva…"
          />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Link to="/fisioterapeutas" style={{ textDecoration: "none" }}>
            <Btn variant="secondary">Cancelar</Btn>
          </Link>
          <Btn type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Btn>
        </div>
      </form>

      {/* ====== ACCESO A LA APP ====== */}
      <div className="card" style={{ marginTop: 20, padding: 16 }}>
        <h3 style={{ marginTop: 0, marginBottom: 10 }}>Acceso a la app</h3>

        <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
          <label style={label}>Nueva contraseña (opcional)</label>
          <input
            style={input}
            type="text"
            placeholder="Déjalo vacío para generar una temporal"
            value={passAccion}
            onChange={(e) => setPassAccion(e.target.value)}
          />
          <small style={{ color: "var(--muted)" }}>
            Si el usuario no existe aún, usa “Crear acceso”. Si ya existe, puedes “Resetear contraseña”.
          </small>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="secondary" onClick={crearAcceso} disabled={creatingAccess}>
            {creatingAccess ? "Creando acceso…" : "Crear acceso"}
          </Btn>
          <Btn variant="danger" onClick={resetPassword} disabled={resetting}>
            {resetting ? "Reseteando…" : "Resetear contraseña"}
          </Btn>
        </div>
      </div>
    </div>
  );
}
