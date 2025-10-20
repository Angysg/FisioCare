import { useEffect, useRef, useState, useLayoutEffect } from "react";
import api from "../api";
import { logout, getUser } from "../auth";
import { useNavigate } from "react-router-dom";
import { apiListPacientes, apiDeletePaciente } from "../api";

/* ===== Botón suave que NO es <button> para evitar estilos globales ===== */
function AdjButton({ children, onClick, variant = "action" }) {
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
    cursor: "pointer",
    outline: "none",
    transition: "background 0.25s, box-shadow 0.25s",
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

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(e);
        }
      }}
      onMouseEnter={() => setBg(palette.hoverBg)}
      onMouseLeave={() => setBg(palette.background)}
      onFocus={() => setBg(palette.hoverBg)}
      onBlur={() => setBg(palette.background)}
      style={{
        ...base,
        color: palette.color,
        background: bg,
        border: palette.border,
      }}
      onMouseDown={(e) => { e.currentTarget.style.boxShadow = palette.focusRing; }}
      onMouseUp={(e) => { e.currentTarget.style.boxShadow = "none"; }}
    >
      {children}
    </span>
  );
}

/* ============ Fila de paciente con acordeón (height + overflow) ============ */
function PacienteRow({
  paciente,
  isOpen,
  onToggle,
  attachments = [],
  onVerAdjunto,
  onDescargarAdjunto,
  onEliminarAdjunto,
  onEliminarPaciente,
  onEditarPaciente,
  canDelete,
  canEdit,
}) {
  const wrapRef = useRef(null);
  const [h, setH] = useState(0);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (isOpen) setH(el.scrollHeight);
    else setH(0);
  }, [isOpen, attachments.length, paciente.antecedentes_medicos]);

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
      className="pac-item"
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
      {/* Cabecera clicable */}
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
        <div>
          <div className="name" style={{ fontWeight: 600 }}>
            {paciente.nombre} {paciente.apellidos}
          </div>
        </div>

        {/* Lado derecho: Ver/Ocultar + botones de acción */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--link)",
              userSelect: "none",
            }}
          >
            {isOpen ? "Ocultar" : "Ver detalle"}
          </span>

          {canEdit && (
            <AdjButton
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onEditarPaciente?.(paciente);
              }}
            >
              Editar
            </AdjButton>
          )}

          {canDelete && (
            <AdjButton
              variant="delete"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onEliminarPaciente?.(paciente);
              }}
            >
              Eliminar
            </AdjButton>
          )}
        </div>
      </button>

      {/* Cuerpo con animación por altura */}
      <div style={{ height: h, overflow: "hidden", transition: "height 300ms" }}>
        <div ref={wrapRef}>
          <div className="detalle" style={{ padding: "0 14px 14px 14px", fontSize: 14 }}>
            <div className="meta" style={{ color: "var(--muted)", marginBottom: 8 }}>
              {paciente.email || "—"} · {paciente.telefono || "—"}
            </div>

            {/* Antecedentes */}
            <div style={{ marginTop: 6, marginBottom: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Antecedentes médicos</div>
              <div style={{ whiteSpace: "pre-wrap" }}>
                {paciente.antecedentes_medicos?.trim()
                  ? paciente.antecedentes_medicos
                  : <i style={{ color: "var(--muted)" }}>Sin antecedentes</i>}
              </div>
            </div>

            {/* Adjuntos */}
            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Adjuntos</div>
              {attachments.length === 0 ? (
                <i style={{ color: "var(--muted)" }}>No hay adjuntos</i>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {attachments.map((a) => (
                    <li
                      key={a._id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "6px 0",
                        borderBottom: "1px solid var(--border)",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "60%",
                        }}
                        title={a.originalName}
                      >
                        {a.originalName}{" "}
                        <small style={{ color: "var(--muted)" }}>({a.mimeType})</small>
                      </span>

                      <div style={{ display: "flex", gap: 8 }}>
                        <AdjButton onClick={() => onVerAdjunto(a)}>Ver</AdjButton>
                        <AdjButton onClick={() => onDescargarAdjunto(a)}>Descargar</AdjButton>
                        {canDelete && (
                          <AdjButton variant="delete" onClick={() => onEliminarAdjunto(a)}>
                            Eliminar
                          </AdjButton>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

/* ============ Página ============ */
export default function Pacientes() {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState("alpha");
  const [list, setList] = useState([]);

  const [form, setForm] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    fecha_nacimiento: "",       // 👈 añadido
    antecedentes_medicos: "",
  });

  const [selected, setSelected] = useState(null);
  const [attachmentsById, setAttachmentsById] = useState({});

  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const nav = useNavigate();
  const user = getUser();
  const roleLower = user?.role?.toLowerCase?.() || "";
  const canDelete = ["admin", "administrador", "fisioterapeuta"].includes(roleLower);
  const canEdit   = ["admin", "administrador", "fisioterapeuta"].includes(roleLower);

  useEffect(() => { load(); }, []);
  useEffect(() => { load(); }, [order]);

  async function load() {
    const items = await apiListPacientes({ q: query, sort: order });
    setList(items);
  }

  useEffect(() => {
    const id = selected?._id;
    if (id && !attachmentsById[id]) loadAttachments(id);
  }, [selected]); // eslint-disable-line

  async function loadAttachments(id) {
    const { data } = await api.get(`/api/pacientes/${id}/adjuntos`);
    setAttachmentsById((prev) => ({ ...prev, [id]: data.data }));
  }

  async function crearPaciente(e) {
    e.preventDefault();

    const payload = {
      ...form,
      fecha_nacimiento: form.fecha_nacimiento || null,
    };

    const { data } = await api.post("/api/pacientes", payload);
    const nuevo = data.data;

    setForm({
      nombre: "",
      apellidos: "",
      email: "",
      telefono: "",
      fecha_nacimiento: "",
      antecedentes_medicos: "",
    });

    await load();
    setSelected(nuevo);

    if (file) {
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/api/pacientes/${nuevo._id}/adjuntos`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadAttachments(nuevo._id);
      alert("Paciente creado y adjunto subido");
    } else {
      alert("Paciente creado");
    }
  }

  async function subirAdjunto() {
    if (!selected?._id) return alert("Selecciona un paciente primero.");
    if (!file) return alert("Selecciona un archivo.");

    const fd = new FormData();
    fd.append("file", file);
    await api.post(`/api/pacientes/${selected._id}/adjuntos`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    await loadAttachments(selected._id);
    alert("Adjunto subido");
  }

  async function verAdjunto(adj) {
    const res = await api.get(`/api/pacientes/adjuntos/${adj._id}`, { responseType: "blob" });
    const type = adj.mimeType || "application/octet-stream";
    const blob = new Blob([res.data], { type });
    const url = URL.createObjectURL(blob);

    if (type.startsWith("image/") || type === "application/pdf") {
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } else {
      const a = document.createElement("a");
      a.href = url;
      a.download = adj.originalName || "archivo";
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    }
  }

  async function descargarAdjunto(adj) {
    const res = await api.get(`/api/pacientes/adjuntos/${adj._id}`, { responseType: "blob" });
    const blob = new Blob([res.data], { type: adj.mimeType || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = adj.originalName || "archivo";
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  }

  async function eliminarAdjunto(adj) {
    if (!selected?._id) return;
    const ok = confirm(`¿Eliminar "${adj.originalName}"? Esta acción no se puede deshacer.`);
    if (!ok) return;
    await api.delete(`/api/pacientes/adjuntos/${adj._id}`);
    await loadAttachments(selected._id);
    alert("Adjunto eliminado");
  }

  async function eliminarPaciente(p) {
    const ok = confirm(`¿Eliminar al paciente "${p.nombre} ${p.apellidos}"? También se borrarán sus adjuntos.`);
    if (!ok) return;

    await apiDeletePaciente(p._id);

    setList((prev) => prev.filter((x) => x._id !== p._id));
    setAttachmentsById((prev) => {
      const next = { ...prev };
      delete next[p._id];
      return next;
    });
    setSelected((prev) => (prev?._id === p._id ? null : prev));

    alert("Paciente eliminado");
  }

  function editarPaciente(p) {
    if (!p?._id) return;
    nav(`/pacientes/${p._id}/editar`);
  }

  function salir() { logout(); nav("/login"); }

  const botonAdjuntoDeshabilitado = !selected || !file;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div className="page-header">
        <h1 className="page-title">PACIENTES</h1>
        <div className="page-header__actions">
          <span className="page-header__user">{user?.name} ({user?.role})</span>
          <button onClick={salir}>Salir</button>
        </div>
      </div>

      <div style={{ marginBottom: 16, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input
          placeholder="Buscar por nombre/apellidos/email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: 380 }}
        />
        <button onClick={load}>Buscar</button>
        <div style={{ marginLeft: 8, display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ color: "var(--muted)" }}>Orden:</span>
          <button onClick={() => setOrder("alpha")} disabled={order === "alpha"}>Alfabético</button>
          <button onClick={() => setOrder("date")} disabled={order === "date"}>Fecha</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
        <div>
          <h3>Listado</h3>
          <ul id="listaPacientes" style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
            {list.map((p) => {
              const open = selected?._id === p._id;
              return (
                <PacienteRow
                  key={p._id}
                  paciente={p}
                  isOpen={open}
                  attachments={attachmentsById[p._id] || []}
                  onToggle={() => setSelected((prev) => (prev?._id === p._id ? null : p))}
                  onVerAdjunto={verAdjunto}
                  onDescargarAdjunto={descargarAdjunto}
                  onEliminarAdjunto={eliminarAdjunto}
                  onEliminarPaciente={eliminarPaciente}
                  onEditarPaciente={editarPaciente}
                  canDelete={canDelete}
                  canEdit={canEdit}
                />
              );
            })}
          </ul>
        </div>

        <div>
          <h3>Crear paciente</h3>
          <form onSubmit={crearPaciente} className="card" style={{ display: "grid", gap: 10, marginBottom: 24 }}>
            <div className="form-field">
              <label>Nombre</label>
              <input placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Apellidos</label>
              <input placeholder="Apellidos" value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Email</label>
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Teléfono</label>
              <input placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Fecha de nacimiento</label>
              <input
                type="date"
                value={form.fecha_nacimiento || ""}
                onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Antecedentes médicos (opcional)</label>
              <textarea
                placeholder="Antecedentes médicos (opcional)"
                value={form.antecedentes_medicos}
                onChange={(e) => setForm({ ...form, antecedentes_medicos: e.target.value })}
                rows={4}
              />
            </div>
            <button type="submit" style={{ width: "100%" }}>Crear</button>
          </form>

          <h3>Adjuntar archivo al seleccionado</h3>
          <div style={{ marginBottom: 6 }}>
            {selected ? <span>Paciente: <b>{selected.nombre} {selected.apellidos}</b></span>
                      : <i style={{ color: "var(--muted)" }}>Sin seleccionar</i>}
          </div>

          <input type="file" ref={fileInputRef} onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <div style={{ marginTop: 8 }}>
            <button onClick={subirAdjunto} disabled={botonAdjuntoDeshabilitado}>Subir adjunto</button>
          </div>
        </div>
      </div>
    </div>
  );
}
