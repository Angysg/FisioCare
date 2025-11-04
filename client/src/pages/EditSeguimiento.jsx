import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { apiGetSeguimiento, apiUpdateSeguimiento, apiListFisioterapeutasSimple } from "../api";

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

export default function EditSeguimiento() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [fisios, setFisios] = useState([]);
  const [form, setForm] = useState({
    pacienteNombre: "",
    fisioId: "",
    fecha: "",
    comentario: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await apiGetSeguimiento(id);
        const nombreDesdeRef = s?.paciente ? `${s.paciente?.nombre || ""} ${s.paciente?.apellidos || ""}`.trim() : "";
        setForm({
          pacienteNombre: s?.pacienteNombre || nombreDesdeRef || "",
          fisioId: s.fisio?._id || "",
          fecha: s.fecha ? new Date(s.fecha).toISOString().slice(0, 10) : "",
          comentario: s.comentario || "",
        });
        const fs = await apiListFisioterapeutasSimple();
        setFisios(fs || []);
      } catch (e) {
        console.error(e);
        alert("No se pudo cargar el seguimiento");
        navigate("/seguimientos");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.pacienteNombre.trim()) return alert("Escribe el nombre del paciente.");
    setSaving(true);
    try {
      await apiUpdateSeguimiento(id, {
        pacienteNombre: form.pacienteNombre.trim(),
        fisioId: form.fisioId,
        fecha: form.fecha || null,
        comentario: form.comentario,
      });
      alert("Seguimiento actualizado");
      navigate("/seguimientos");
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar el seguimiento");
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
        <h1 className="page-title" style={{ margin: 0 }}>Editar seguimiento</h1>
        <Link to="/seguimientos" className="text-sm" style={{ textDecoration: "underline", color: "var(--link)", fontWeight: 600 }}>
          Volver
        </Link>
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
        <div style={field}>
          <label style={label}>Paciente (texto libre)</label>
          <input
            placeholder="Nombre y apellidos…"
            value={form.pacienteNombre}
            onChange={(e) => setForm((s) => ({ ...s, pacienteNombre: e.target.value }))}
            style={input}
          />
        </div>

        <div style={field}>
          <label style={label}>Fecha</label>
          <input
            type="date"
            value={form.fecha || ""}
            onChange={(e) => setForm((s) => ({ ...s, fecha: e.target.value }))}
            style={input}
          />
        </div>

        <div style={field}>
          <label style={label}>Fisioterapeuta</label>
          <select
            value={form.fisioId}
            onChange={(e) => setForm((s) => ({ ...s, fisioId: e.target.value }))}
            style={input}
          >
            <option value="">Selecciona…</option>
            {fisios.map(f => (
              <option key={f._id} value={f._id}>
                {f.nombre} {f.apellidos || ""}
              </option>
            ))}
          </select>
        </div>

        <div style={field}>
          <label style={label}>Comentario</label>
          <textarea
            rows={6}
            value={form.comentario}
            onChange={(e) => setForm((s) => ({ ...s, comentario: e.target.value }))}
            style={{ ...input, resize: "vertical" }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Link to="/seguimientos" style={{ textDecoration: "none" }}>
            <Btn variant="secondary">Cancelar</Btn>
          </Link>
          <Btn type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Btn>
        </div>
      </form>
    </div>
  );
}
