import { useEffect, useRef, useState } from "react";
import api from "../api";
import { logout, getUser } from "../auth";
import { useNavigate } from "react-router-dom";

export default function Pacientes() {
  // --------- Estado base ---------
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState("alpha"); // 'alpha' | 'date'
  const [list, setList] = useState([]);

  const [form, setForm] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    antecedentes_medicos: "",
  });

  const [selected, setSelected] = useState(null);     // paciente seleccionado (o null)
  const [attachments, setAttachments] = useState([]); // adjuntos del seleccionado

  const [file, setFile] = useState(null);             // archivo elegido para subir
  const fileInputRef = useRef(null);

  const nav = useNavigate();
  const user = getUser();

  // --------- Cargas ---------
  useEffect(() => { load(); }, []);       // primera carga
  useEffect(() => { load(); }, [order]);  // recargar al cambiar el orden

  async function load() {
    const { data } = await api.get("/api/pacientes", {
      params: { q: query, sort: order },
    });
    setList(data.data);
  }

  // Cuando cambia la selección: cargar adjuntos o limpiar si se deseleccionó
  useEffect(() => {
    if (selected?._id) {
      loadAttachments(selected._id);
    } else {
      setAttachments([]);
    }
  }, [selected]);

  async function loadAttachments(id) {
    const { data } = await api.get(`/api/pacientes/${id}/adjuntos`);
    setAttachments(data.data);
  }

  // --------- Acciones ---------

  async function crearPaciente(e) {
    e.preventDefault();

    const { data } = await api.post("/api/pacientes", form);
    const nuevo = data.data;

    // Limpiar formulario
    setForm({
      nombre: "",
      apellidos: "",
      email: "",
      telefono: "",
      antecedentes_medicos: "",
    });

    // Seleccionar automáticamente al nuevo
    setSelected(nuevo);

    // Refrescar listado (manteniendo orden actual)
    load();

    // Si había un archivo ya elegido, súbelo automáticamente al nuevo paciente
    if (file) {
      const fd = new FormData();
      fd.append("file", file);

      await api.post(`/api/pacientes/${nuevo._id}/adjuntos`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Limpiar input y estado de archivo
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Recargar adjuntos del nuevo
      await loadAttachments(nuevo._id);

      alert("Paciente creado y adjunto subido");
    } else {
      alert("Paciente creado");
    }
  }

  // Subir adjunto manual
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

  // Descargar adjunto
  async function descargarAdjunto(adj) {
    const res = await api.get(`/api/pacientes/adjuntos/${adj._id}`, {
      responseType: "blob",
    });
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

  function salir() { logout(); nav("/login"); }

  const botonAdjuntoDeshabilitado = !selected || !file;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      {/* Cabecera */}
      <div className="page-header">
        <h1 className="page-title">PACIENTES</h1>
        <div className="page-header__actions">
          <span className="page-header__user">{user?.name} ({user?.role})</span>
          <button onClick={salir}>Salir</button>
        </div>
      </div>

      {/* Buscador + selector de orden */}
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
          <button
            onClick={() => setOrder('alpha')}
            disabled={order === 'alpha'}
            title="Alfabético (apellidos, nombre)"
          >Alfabético</button>
          <button
            onClick={() => setOrder('date')}
            disabled={order === 'date'}
            title="Fecha de creación (más nuevos primero)"
          >Fecha</button>
        </div>
      </div>

      {/* Layout principal */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
        {/* LISTADO + DETALLE */}
        <div>
          <h3>Listado</h3>

          {/* ✅ Contenedor con id para estilos */}
          <ul id="listaPacientes" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {list.map(p => {
              const isSel = selected?._id === p._id;
              return (
                <li
                  key={p._id}
                  className="pac-item" // ✅ clase para estilos
                  onClick={() =>
                    setSelected(prev => (prev?._id === p._id ? null : p))
                  }
                  style={{
                    cursor: "pointer",
                    // realce de seleccionado sin usar blancos: borde y leve fondo
                    borderColor: isSel ? "var(--link-hover)" : undefined,
                    boxShadow: isSel ? "0 0 0 2px color-mix(in oklab, var(--link) 45%, transparent)" : undefined
                  }}
                >
                  <div className="name">{p.nombre} {p.apellidos}</div>
                  <div className="meta">{p.email} · {p.telefono || "—"}</div>
                </li>
              );
            })}
          </ul>

          {/* Panel detalle del paciente seleccionado */}
          {selected && (
            <div className="card" style={{ marginTop: 16 }}>
              <h4 style={{ marginTop: 0 }}>
                Detalle de {selected.nombre} {selected.apellidos}
              </h4>

              {/* Antecedentes */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Antecedentes médicos</div>
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {selected.antecedentes_medicos?.trim()
                    ? selected.antecedentes_medicos
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
                    {attachments.map(a => (
                      <li
                        key={a._id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 0",
                          borderBottom: "1px solid var(--border)"
                        }}
                      >
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
                          {a.originalName} <small style={{ color: "var(--muted)" }}>({a.mimeType})</small>
                        </span>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => descargarAdjunto(a)}>Descargar</button>
                          {/* Aquí podrías añadir un botón "Eliminar" (DELETE) solo para admin */}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CREAR + SUBIR ADJUNTO */}
        <div>
          <h3>Crear paciente</h3>
          <form onSubmit={crearPaciente} className="card" style={{ display: "grid", gap: 10, marginBottom: 24 }}>
            <div className="form-field">
              <label>Nombre</label>
              <input
                placeholder="Nombre"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Apellidos</label>
              <input
                placeholder="Apellidos"
                value={form.apellidos}
                onChange={e => setForm({ ...form, apellidos: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Email</label>
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Teléfono</label>
              <input
                placeholder="Teléfono"
                value={form.telefono}
                onChange={e => setForm({ ...form, telefono: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Antecedentes médicos (opcional)</label>
              <textarea
                placeholder="Antecedentes médicos (opcional)"
                value={form.antecedentes_medicos}
                onChange={e => setForm({ ...form, antecedentes_medicos: e.target.value })}
                rows={4}
              />
            </div>
            <button type="submit" style={{ width: "100%" }}>Crear</button>
          </form>

          <h3>Adjuntar archivo al seleccionado</h3>
          <div style={{ marginBottom: 6 }}>
            {selected
              ? <span>Paciente: <b>{selected.nombre} {selected.apellidos}</b></span>
              : <i style={{ color: "var(--muted)" }}>Sin seleccionar</i>}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <div style={{ marginTop: 8 }}>
            <button onClick={subirAdjunto} disabled={botonAdjuntoDeshabilitado}>
              Subir adjunto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
