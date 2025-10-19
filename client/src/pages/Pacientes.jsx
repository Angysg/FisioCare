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

  // Crear paciente:
  // 1) lo selecciona automáticamente
  // 2) si ya hay un archivo elegido, lo sube al nuevo paciente
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

  // Subir adjunto manual (cuando quieras)
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
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto", fontFamily:"system-ui, sans-serif" }}>
      {/* Cabecera */}
      <header style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 16 }}>
        <h2 style={{ margin:0 }}>Pacientes</h2>
        <div>
          <span style={{ marginRight: 12, opacity:.8 }}>{user?.name} ({user?.role})</span>
          <button onClick={salir}>Salir</button>
        </div>
      </header>

      {/* Buscador + selector de orden */}
      <div style={{ marginBottom: 16, display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
        <input
          placeholder="Buscar por nombre/apellidos/email…"
          value={query}
          onChange={(e)=>setQuery(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border:"1px solid var(--border)", width: 320 }}
        />
        <button onClick={load}>Buscar</button>

        <div style={{ marginLeft: 8, display:"flex", gap:6, alignItems:"center" }}>
          <span style={{ opacity:.7 }}>Orden:</span>
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
      <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap: 24 }}>
        {/* LISTADO + DETALLE */}
        <div>
          <h3>Listado</h3>
          <ul style={{ listStyle:"none", padding:0 }}>
            {list.map(p=>(
              <li
                key={p._id}
                onClick={() =>
                  // Toggle: si hago click otra vez en el mismo, se deselecciona
                  setSelected(prev => (prev?._id === p._id ? null : p))
                }
                style={{
                  padding:10,
                  border:"1px solid #e5e7eb",
                  borderRadius:10,
                  marginBottom:8,
                  background: selected?._id===p._id ? "#ecfdf5" : "white",
                  cursor:"pointer"
                }}
              >
                <strong>{p.nombre} {p.apellidos}</strong><br/>
                <small>{p.email} · {p.telefono}</small>
              </li>
            ))}
          </ul>

          {/* Panel detalle del paciente seleccionado */}
          {selected && (
            <div className="card" style={{ marginTop: 16 }}>
              <h4 style={{ marginTop:0 }}>
                Detalle de {selected.nombre} {selected.apellidos}
              </h4>

              {/* Antecedentes */}
              <div style={{ marginBottom:12 }}>
                <div style={{ fontWeight:600, marginBottom:6 }}>Antecedentes médicos</div>
                <div style={{ whiteSpace:"pre-wrap", opacity:.9 }}>
                  {selected.antecedentes_medicos?.trim()
                    ? selected.antecedentes_medicos
                    : <i>Sin antecedentes</i>}
                </div>
              </div>

              {/* Adjuntos */}
              <div>
                <div style={{ fontWeight:600, marginBottom:6 }}>Adjuntos</div>
                {attachments.length === 0 ? (
                  <i>No hay adjuntos</i>
                ) : (
                  <ul style={{ listStyle:"none", padding:0, margin:0 }}>
                    {attachments.map(a => (
                      <li
                        key={a._id}
                        style={{
                          display:"flex",
                          justifyContent:"space-between",
                          alignItems:"center",
                          padding:"6px 0",
                          borderBottom:"1px solid var(--border)"
                        }}
                      >
                        <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth: "70%" }}>
                          {a.originalName} <small style={{ opacity:.7 }}>({a.mimeType})</small>
                        </span>
                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={()=>descargarAdjunto(a)}>Descargar</button>
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
          <form onSubmit={crearPaciente} style={{ display:"grid", gap:8, marginBottom: 24 }}>
            <input
              placeholder="Nombre"
              value={form.nombre}
              onChange={e=>setForm({ ...form, nombre:e.target.value })}
            />
            <input
              placeholder="Apellidos"
              value={form.apellidos}
              onChange={e=>setForm({ ...form, apellidos:e.target.value })}
            />
            <input
              placeholder="Email"
              value={form.email}
              onChange={e=>setForm({ ...form, email:e.target.value })}
            />
            <input
              placeholder="Teléfono"
              value={form.telefono}
              onChange={e=>setForm({ ...form, telefono:e.target.value })}
            />
            <textarea
              placeholder="Antecedentes médicos (opcional)"
              value={form.antecedentes_medicos}
              onChange={e=>setForm({ ...form, antecedentes_medicos: e.target.value })}
              rows={4}
              style={{ resize:"vertical", padding:10, borderRadius:8, border:"1px solid var(--border)" }}
            />
            <button type="submit">Crear</button>
          </form>

          <h3>Adjuntar archivo al seleccionado</h3>
          <div style={{ marginBottom: 6 }}>
            {selected
              ? <span>Paciente: <b>{selected.nombre} {selected.apellidos}</b></span>
              : <i>Sin seleccionar</i>}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e)=>setFile(e.target.files?.[0] || null)}
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