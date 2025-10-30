// client/src/pages/Fisioterapeutas.jsx
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  apiListFisios,
  apiCreateFisio,
  apiDeleteFisio,
  apiCreateFisioAccess,
} from "../api";

/* ===== Botón suave reutilizable ===== */
function AdjButton({ children, onClick, variant = "action", disabled = false, title }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    userSelect: "none",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 16,
    lineHeight: 1,
    cursor: disabled ? "not-allowed" : "pointer",
    outline: "none",
    transition: "background 0.25s, box-shadow 0.25s, opacity 0.2s",
    opacity: disabled ? 0.6 : 1,
  };
  const palette =
    variant === "delete"
      ? {
          color: "#b91c1c",
          border: "1px solid rgba(185,28,28,0.35)",
          background: "rgba(185,28,28,0.05)",
          hoverBg: "rgba(185,28,28,0.12)",
          focusRing: "0 0 0 3px rgba(185,28,28,0.25)",
        }
      : {
          color: "var(--link)",
          border: "1px solid color-mix(in srgb, var(--link) 45%, transparent)",
          background: "color-mix(in srgb, var(--link) 6%, transparent)",
          hoverBg: "color-mix(in srgb, var(--link) 15%, transparent)",
          focusRing: "0 0 0 3px color-mix(in srgb, var(--link) 35%, transparent)",
        };
  const [bg, setBg] = useState(palette.background);
  const safe = (fn) => (e) => { if (!disabled) fn?.(e); };

  return (
    <span
      role="button"
      tabIndex={disabled ? -1 : 0}
      title={title}
      onClick={safe(onClick)}
      onKeyDown={safe((e) => { if (["Enter", " "].includes(e.key)) { e.preventDefault(); onClick?.(e); } })}
      onMouseEnter={() => !disabled && setBg(palette.hoverBg)}
      onMouseLeave={() => !disabled && setBg(palette.background)}
      onFocus={() => !disabled && setBg(palette.hoverBg)}
      onBlur={() => setBg(palette.background)}
      style={{ ...base, color: palette.color, background: bg, border: palette.border }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.boxShadow = palette.focusRing; }}
      onMouseUp={(e) => { e.currentTarget.style.boxShadow = "none"; }}
    >
      {children}
    </span>
  );
}

/* ===== Fila de fisio con acordeón ===== */
function FisioRow({ fisio, isOpen, onToggle, onEdit, onDelete, deleting }) {
  const wrapRef = useRef(null);
  const [h, setH] = useState(0);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setH(isOpen ? el.scrollHeight : 0);
  }, [isOpen, fisio?.email, fisio?.especialidades?.length]);

  useEffect(() => {
    function onResize() {
      const el = wrapRef.current;
      if (el && isOpen) setH(el.scrollHeight);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isOpen]);

  return (
    <li
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
        borderRadius: 12,
        background: "var(--panel)",
        border: "1px solid var(--border)",
        transition: "box-shadow 200ms, border-color 200ms",
        boxShadow: isOpen
          ? "0 0 0 2px color-mix(in oklab, var(--link) 45%, transparent)"
          : "0 1px 8px rgba(0,0,0,0.06)",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          textAlign: "left",
          background: "transparent",
          border: "none",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          borderRadius: 12,
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              color: "var(--text)",
            }}
          >
            {(fisio?.nombre || "") + " " + (fisio?.apellidos || "")}
            {fisio?.telefono ? ` · ${fisio.telefono}` : ""}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--link)", userSelect: "none" }}>
            {isOpen ? "Ocultar" : "Ver detalle"}
          </span>
          <AdjButton title="Editar" onClick={(e) => { e.stopPropagation(); onEdit?.(fisio); }}>Editar</AdjButton>
          <AdjButton
            variant="delete"
            title="Eliminar"
            onClick={(e) => { e.stopPropagation(); onDelete?.(fisio); }}
            disabled={deleting}
          >
            {deleting ? "Eliminando…" : "Eliminar"}
          </AdjButton>
        </div>
      </button>

      <div style={{ height: h, overflow: "hidden", transition: "height 300ms" }}>
        <div ref={wrapRef}>
          <div style={{ padding: "0 14px 14px 14px", fontSize: 14 }}>
            <div style={{ color: "var(--muted)", marginBottom: 8 }}>
              {fisio?.email || "—"}
              {fisio?.telefono ? ` · ${fisio.telefono}` : ""}
            </div>
            <div style={{ marginTop: 6 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Especialidades</div>
              {Array.isArray(fisio?.especialidades) && fisio.especialidades.length > 0 ? (
                <div>{fisio.especialidades.join(", ")}</div>
              ) : (
                <i style={{ color: "var(--muted)" }}>Sin especialidades</i>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

/* ===== Página ===== */
export default function FisioterapeutasPage() {
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [sort, setSort] = useState("alpha");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    especialidades: "",
    createAccess: false,
    password: "",
  });

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function load() {
    setLoading(true);
    try {
      const items = await apiListFisios({ q, sort });
      setList(items);
    } finally {
      setLoading(false);
    }
  }

  async function buscar(e) {
    e.preventDefault();
    await load();
  }

  async function crearFisio(e) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.apellidos.trim() || !form.email.trim()) return;

    // 1) Crear el documento Fisio
    const payload = {
      nombre: form.nombre,
      apellidos: form.apellidos,
      email: form.email,
      telefono: form.telefono,
      especialidades: form.especialidades,
    };

    const nuevo = await apiCreateFisio(payload);

    // 2) Si se marcó el checkbox, crear acceso de usuario (ruta aparte)
    if (form.createAccess && nuevo?._id) {
      try {
        const r = await apiCreateFisioAccess(nuevo._id, form.password || undefined);
        if (r?.ok) {
          const tmp = r?.data?.tempPassword;
          alert(`Fisioterapeuta creado.\nAcceso creado.${tmp ? `\nContraseña temporal: ${tmp}` : ""}`);
        } else {
          alert(r?.error || "Fisioterapeuta creado, pero no se pudo crear el acceso.");
        }
      } catch (e) {
        alert("Fisioterapeuta creado, pero no se pudo crear el acceso.");
      }
    } else {
      alert("Fisioterapeuta creado.");
    }

    setForm({
      nombre: "", apellidos: "", email: "", telefono: "",
      especialidades: "", createAccess: false, password: ""
    });
    await load();
  }

  function onEdit(fisio) {
    navigate(`/fisioterapeutas/${fisio._id}/editar`);
  }

  async function onDelete(fisio) {
    if (!confirm(`¿Eliminar a ${fisio.nombre} ${fisio.apellidos}?`)) return;
    setDeletingId(fisio._id);
    try {
      await apiDeleteFisio(fisio._id);
      setList((prev) => prev.filter((x) => x._id !== fisio._id));
      if (selected?._id === fisio._id) setSelected(null);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="container" style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1 className="page-title">FISIOTERAPEUTAS</h1>

      <form
        onSubmit={buscar}
        style={{ marginBottom: 16, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}
      >
        <input
          placeholder="Buscar por nombre/apellidos/email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ width: 380 }}
        />
        <button disabled={loading} type="submit">{loading ? "Buscando…" : "Buscar"}</button>

        <div style={{ marginLeft: 8, display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ color: "var(--muted)" }}>Orden:</span>
          <button onClick={() => setSort("alpha")} type="button" disabled={sort === "alpha"}>Alfabético</button>
          <button onClick={() => setSort("date")} type="button" disabled={sort === "date"}>Fecha</button>
        </div>
      </form>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
        <div>
          <h3>Listado</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
            {loading && <li className="text-[var(--muted)]">Cargando…</li>}
            {!loading && list.length === 0 && <li className="text-[var(--muted)]">No hay fisioterapeutas registrados.</li>}
            {!loading &&
              list.map((f) => {
                const open = selected?._id === f._id;
                return (
                  <FisioRow
                    key={f._id}
                    fisio={f}
                    isOpen={open}
                    onToggle={() => setSelected((prev) => (prev?._id === f._id ? null : f))}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    deleting={deletingId === f._id}
                  />
                );
              })}
          </ul>
        </div>

        <div>
          <h3>Crear fisioterapeuta</h3>
          <form onSubmit={crearFisio} className="card" style={{ display: "grid", gap: 10, marginBottom: 24 }}>
            <div className="form-field">
              <label>Nombre</label>
              <input
                placeholder="Nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Apellidos</label>
              <input
                placeholder="Apellidos"
                value={form.apellidos}
                onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Email</label>
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Teléfono</label>
              <input
                placeholder="Teléfono"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Especialidades</label>
              <input
                placeholder="Terapia Manual, Osteopatía, Deportiva…"
                value={form.especialidades}
                onChange={(e) => setForm({ ...form, especialidades: e.target.value })}
              />
            </div>

            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginTop: 2 }}>
              <input
                id="crearAcceso"
                type="checkbox"
                checked={form.createAccess}
                onChange={(e) => setForm({ ...form, createAccess: e.target.checked })}
                style={{ width: 18, height: 18 }}
              />
              <label htmlFor="crearAcceso" style={{ margin: 0, cursor: "pointer" }}>
                Crear acceso a la app
              </label>
            </div>

            {form.createAccess && (
              <div className="form-field">
                <label>Contraseña (opcional)</label>
                <input
                  type="text"
                  placeholder="Déjalo vacío para generar una temporal"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            )}

            <button type="submit" style={{ width: "100%" }}>Crear</button>
          </form>
        </div>
      </div>
    </main>
  );
}
