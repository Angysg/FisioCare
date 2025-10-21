// client/src/pages/EditFisioterapeuta.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { apiGetFisio, apiUpdateFisio } from "../api";

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

        {/* "Volver" con color forzado para tema oscuro */}
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
    </div>
  );
}
