// frontend/src/pages/EditPaciente.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { apiGetPaciente, apiUpdatePaciente } from "../api";

/* ===== Botón accesible con variantes y modo claro/oscuro ===== */
function Btn({ variant = "primary", children, disabled, onClick, type = "button" }) {
  // paleta basada en variables existentes del tema
  const palette =
    variant === "secondary"
      ? {
          // texto y borde sutil; fondo muy leve
          color: "var(--link)",
          border: "1px solid color-mix(in srgb, var(--link) 45%, transparent)",
          bg: "color-mix(in srgb, var(--link) 8%, transparent)",
          bgHover: "color-mix(in srgb, var(--link) 16%, transparent)",
          focus: "0 0 0 3px color-mix(in srgb, var(--link) 32%, transparent)",
        }
      : {
          // primario más marcado (relleno)
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

export default function EditPaciente() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    fecha_nacimiento: "",
    antecedentes_medicos: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await apiGetPaciente(id);
        setForm({
          nombre: p?.nombre || "",
          apellidos: p?.apellidos || "",
          email: p?.email || "",
          telefono: p?.telefono || "",
          fecha_nacimiento: p?.fecha_nacimiento
            ? new Date(p.fecha_nacimiento).toISOString().slice(0, 10)
            : "",
          antecedentes_medicos: p?.antecedentes_medicos || "",
        });
      } catch (e) {
        console.error(e);
        alert("No se pudo cargar el paciente");
        navigate("/pacientes");
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
      await apiUpdatePaciente(id, {
        ...form,
        fecha_nacimiento: form.fecha_nacimiento || null,
      });
      alert("Paciente actualizado");
      navigate("/pacientes");
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar el paciente");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Cargando...</div>;

  // estilos de inputs consistentes con claro/oscuro
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
        <h1 className="page-title" style={{ margin: 0 }}>Editar paciente</h1>
        <Link to="/pacientes" className="text-sm underline">Volver</Link>
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
        <div style={field}>
          <label style={label}>Nombre</label>
          <input name="nombre" value={form.nombre} onChange={onChange} required style={input} />
        </div>

        <div style={field}>
          <label style={label}>Apellidos</label>
          <input name="apellidos" value={form.apellidos} onChange={onChange} required style={input} />
        </div>

        <div style={field}>
          <label style={label}>Email</label>
          <input type="email" name="email" value={form.email} onChange={onChange} style={input} />
        </div>

        <div style={field}>
          <label style={label}>Teléfono</label>
          <input name="telefono" value={form.telefono} onChange={onChange} style={input} />
        </div>

        <div style={field}>
          <label style={label}>Fecha de nacimiento</label>
          <input
            type="date"
            name="fecha_nacimiento"
            value={form.fecha_nacimiento || ""}
            onChange={onChange}
            style={input}
          />
        </div>

        <div style={field}>
          <label style={label}>Antecedentes médicos</label>
          <textarea
            name="antecedentes_medicos"
            value={form.antecedentes_medicos}
            onChange={onChange}
            rows={5}
            style={{ ...input, resize: "vertical" }}
          />
        </div>

        {/* Botonera */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Link to="/pacientes" style={{ textDecoration: "none" }}>
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
