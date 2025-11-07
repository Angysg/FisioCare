import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "../auth";
import BODY_ZONES from "../constants/bodyZones.js";
import BodyZonesSelect from "../components/appointments/BodyZonesSelect.jsx";

import {
  apiListSeguimientos,
  apiCreateSeguimiento,
  apiDeleteSeguimiento,
  apiListFisioterapeutasSimple,
} from "../api";

/* ===== Botón suave reutilizado ===== */
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
      onMouseDown={(e) => {
        e.currentTarget.style.boxShadow = palette.focusRing;
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {children}
    </span>
  );
}

/* ===== Row con acordeón ===== */
function SeguimientoRow({ item, isOpen, onToggle, onEdit, onDelete }) {
  const wrapRef = useRef(null);
  const [h, setH] = useState(0);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (isOpen) setH(el.scrollHeight);
    else setH(0);
  }, [isOpen, item?.comentario, item?.bodyZones, item?.primeraConsulta]);

  const fechaStr = useMemo(() => {
    try {
      const d = new Date(item.fecha);
      return d.toLocaleDateString();
    } catch {
      return item.fecha;
    }
  }, [item.fecha]);

  const nombrePaciente =
    item?.paciente
      ? `${item.paciente?.nombre || ""} ${item.paciente?.apellidos || ""}`.trim()
      : (item?.pacienteNombre || "—");

  const nombreFisio =
    item?.fisio ? `${item.fisio?.nombre || ""} ${item.fisio?.apellidos || ""}`.trim() : "—";

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
          <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 16 }}>
            {nombrePaciente}
          </div>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>
            {fechaStr} · {nombreFisio}
            {item.primeraConsulta ? " · Primera consulta" : ""}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--link)", userSelect: "none" }}>
            {isOpen ? "Ocultar" : "Ver detalle"}
          </span>
          <AdjButton onClick={(e) => { e.stopPropagation(); onEdit?.(item); }}>Editar</AdjButton>
          <AdjButton variant="delete" onClick={(e) => { e.stopPropagation(); onDelete?.(item); }}>
            Eliminar
          </AdjButton>
        </div>
      </button>

      <div style={{ height: h, overflow: "hidden", transition: "height 300ms" }}>
        <div ref={wrapRef}>
          <div style={{ padding: "0 14px 14px 14px", fontSize: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Zonas del cuerpo</div>
            {Array.isArray(item.bodyZones) && item.bodyZones.length > 0
              ? <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {item.bodyZones.map(z => (
                  <span key={z} style={{ fontSize: 12, padding: "2px 6px", border: "1px solid var(--border)", borderRadius: 6 }}>
                    {String(z).replaceAll("_", " ")}
                  </span>
                ))}
              </div>
              : <i style={{ color: "var(--muted)" }}>—</i>
            }

            <div style={{ fontWeight: 600, marginTop: 12, marginBottom: 6 }}>Comentario</div>
            <div style={{ whiteSpace: "pre-wrap" }}>
              {item.comentario?.trim() ? item.comentario : <i style={{ color: "var(--muted)" }}>—</i>}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

/* ===== Página Seguimientos ===== */
export default function Seguimientos() {
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fisioId, setFisioId] = useState("");
  const [fisios, setFisios] = useState([]);

  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({
    pacienteNombre: "",
    fisioId: "",
    fecha: "",
    comentario: "",
    primeraConsulta: false,
    bodyZones: [],
  });

  const nav = useNavigate();
  const user = getUser();
  const canEdit = true;
  const canDelete = true;

  useEffect(() => {
    (async () => {
      try {
        const fs = await apiListFisioterapeutasSimple();
        setFisios(fs || []);
      } catch (e) {
        console.error("Error cargando fisioterapeutas", e);
        alert("No se pudieron cargar los fisioterapeutas");
        setFisios([]);
      }
    })();
  }, []);

  async function load() {
    try {
      const items = await apiListSeguimientos({
        q: query,
        fisioId: fisioId || undefined,
        from: from || undefined,
        to: to || undefined,
        sort: "date",
      });
      setList(items);
    } catch (e) {
      console.error(e);
      alert("No se pudieron cargar los seguimientos");
      setList([]);
    }
  }

  useEffect(() => {
    load().catch(() => { });
  }, []);

  async function crearSeguimiento(e) {
    e.preventDefault();
    if (!form.pacienteNombre.trim()) return alert("Escribe el nombre del paciente.");
    if (!form.fisioId) return alert("Selecciona un fisioterapeuta.");
    if (!form.fecha) return alert("Indica la fecha del seguimiento.");

    const payload = {
      pacienteNombre: form.pacienteNombre.trim(),
      fisioId: form.fisioId,
      fecha: form.fecha,
      comentario: form.comentario || "",
      primeraConsulta: !!form.primeraConsulta,
      bodyZones: form.bodyZones || [],
    };

    try {
      const nuevo = await apiCreateSeguimiento(payload);
      setList(prev => [nuevo, ...prev]);
      setForm({ pacienteNombre: "", fisioId: "", fecha: "", comentario: "", primeraConsulta: false, bodyZones: [] });
      load().catch(() => { });
      setSelected(nuevo);
      alert("Seguimiento creado");
    } catch (e) {
      console.error(e);
      alert("No se pudo crear el seguimiento");
    }
  }

  function editarSeguimiento(it) {
    nav(`/seguimientos/${it._id}/editar`);
  }

  async function eliminarSeguimiento(it) {
    const ok = confirm("¿Eliminar este seguimiento? Esta acción no se puede deshacer.");
    if (!ok) return;
    await apiDeleteSeguimiento(it._id);
    setList(prev => prev.filter(x => x._id !== it._id));
    setSelected(prev => (prev?._id === it._id ? null : prev));
    alert("Seguimiento eliminado");
  }

  return (
    <main className="container" style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1 className="page-title" style={{ marginBottom: 16 }}>SEGUIMIENTO Y VALORACIÓN</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          alignItems: "end",
          gap: 24,
          marginBottom: 8,
        }}
      >
        <h3 style={{ margin: 0 }}>Filtros</h3>
        <h3 style={{ margin: 0 }}>Crear seguimiento</h3>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
        {/* Columna izquierda */}
        <div>
          <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
            <input
              placeholder="Buscar por paciente, fisio o comentario..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ color: "var(--muted)", fontWeight: 600 }}>Desde</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ color: "var(--muted)", fontWeight: 600 }}>Hasta</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ color: "var(--muted)", fontWeight: 600 }}>Fisio</label>
              <select value={fisioId} onChange={(e) => setFisioId(e.target.value)}>
                <option value="">Todos</option>
                {fisios.map(f => (
                  <option key={f._id} value={f._id}>
                    {f.nombre} {f.apellidos || ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button onClick={load}>Buscar</button>
            </div>
          </div>

          {/* Listado */}
          <h3>Listado</h3>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gap: 12,
            }}
          >
            {list.map((it) => {
              const open = selected?._id === it._id;
              return (
                <SeguimientoRow
                  key={it._id}
                  item={it}
                  isOpen={open}
                  onToggle={() => setSelected(prev => (prev?._id === it._id ? null : it))}
                  onEdit={editarSeguimiento}
                  onDelete={eliminarSeguimiento}
                />
              );
            })}
          </ul>
        </div>

        {/* Columna derecha: Crear */}
        <div>
          <form
            onSubmit={crearSeguimiento}
            className="card"
            style={{ display: "grid", gap: 10, marginBottom: 24, padding: 16 }}
          >
            <div className="form-field">
              <label>Paciente</label>
              <input
                placeholder="Nombre y apellidos..."
                value={form.pacienteNombre}
                onChange={(e) => setForm({ ...form, pacienteNombre: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label>Fecha</label>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label>Fisioterapeuta</label>
              <select
                value={form.fisioId}
                onChange={(e) => setForm({ ...form, fisioId: e.target.value })}
              >
                <option value="">Selecciona…</option>
                {fisios.map(f => (
                  <option key={f._id} value={f._id}>
                    {f.nombre} {f.apellidos || ""}
                  </option>
                ))}
              </select>
            </div>

            {/* PRIMERA CONSULTA (una sola línea) */}
<div className="form-field" style={{ marginTop: 6 }}>
  <label
    htmlFor="primeraConsulta"
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      margin: 0,
      fontWeight: 400,
      whiteSpace: "nowrap",   // <- evita salto de línea
      cursor: "pointer",
    }}
  >
    <input
      id="primeraConsulta"
      type="checkbox"
      checked={!!form.primeraConsulta}
      onChange={(e) => setForm({ ...form, primeraConsulta: e.target.checked })}
      style={{ margin: 0 }}
    />
    ¿Primera consulta?
  </label>
</div>


            {/* Zonas del cuerpo */}
            <div className="form-field" style={{ marginTop: 8 }}>
              <label style={{ display: "block", fontWeight: 500, marginBottom: 6 }}>
                Zonas del cuerpo
              </label>

              <BodyZonesSelect
                value={form.bodyZones || []}
                onChange={(v) => setForm({ ...form, bodyZones: v })}
              
              // title={null}
              />
            </div>

            <div className="form-field">
              <label>Comentario</label>
              <textarea
                rows={5}
                placeholder="Escribe la valoración / seguimiento…"
                value={form.comentario}
                onChange={(e) => setForm({ ...form, comentario: e.target.value })}
              />
            </div>

            <button type="submit" style={{ width: "100%" }}>
              Crear
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
