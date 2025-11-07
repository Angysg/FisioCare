import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import api, {
  apiListPacientes,
  apiCreateAppointment,
  apiListFisioterapeutasSimple,
  apiUpdateAppointment,
  apiDeleteAppointment,
} from "../api";
import AppointmentForm from "../components/appointments/AppointmentForm.jsx";
import "../App.css";

/* ===== Botón suave reutilizable (igual estilo que en Fisioterapeutas) ===== */
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

export default function Citas() {
  const calRef = useRef(null);

  const [fisios, setFisios] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedFisio, setSelectedFisio] = useState(""); // fisio activo (sin "Todos")
  const [pagerIndex, setPagerIndex] = useState(0);

  const [list, setList] = useState([]);
  const [currentRange, setCurrentRange] = useState({ start: null, end: null });

  const [showForm, setShowForm] = useState(false);
  const [formInitial, setFormInitial] = useState(null);

  // --- CARGA INICIAL ---
  useEffect(() => {
    apiListFisioterapeutasSimple()
      .then((fs) => setFisios(fs || []))
      .catch(() => setFisios([]));
    apiListPacientes().then(setPatients).catch(console.error);
  }, []);

  // Al tener fisios y no haber seleccionado, elegimos el primero por defecto
  useEffect(() => {
    if (fisios.length && !selectedFisio) {
      setSelectedFisio(fisios[0]._id);
      setPagerIndex(0);
    }
  }, [fisios, selectedFisio]);

  // Refetch cuando cambia el seleccionado o el pager
  useEffect(() => {
    calRef.current?.getApi()?.refetchEvents();
  }, [selectedFisio, pagerIndex]);

  const activePhysioId = useMemo(() => {
    return selectedFisio || "";
  }, [selectedFisio]);

  const activePhysioName = useMemo(() => {
    if (!activePhysioId) return "";
    const f = fisios.find((x) => x._id === activePhysioId);
    return f ? `${f.nombre ?? ""} ${f.apellidos ?? ""}`.trim() : "";
  }, [activePhysioId, fisios]);

  const goPrevPhysio = () => {
    if (!fisios.length) return;
    setPagerIndex((i) => (i - 1 + fisios.length) % fisios.length);
    setSelectedFisio(fisios[(pagerIndex - 1 + fisios.length) % fisios.length]._id);
  };
  const goNextPhysio = () => {
    if (!fisios.length) return;
    setPagerIndex((i) => (i + 1) % fisios.length);
    setSelectedFisio(fisios[(pagerIndex + 1) % fisios.length]._id);
  };

  const fetchEvents = useCallback(
    async (fetchInfo, success, failure) => {
      try {
        setCurrentRange({ start: fetchInfo.start, end: fetchInfo.end });

        const startISO = fetchInfo.start.toISOString();
        const endISO = fetchInfo.end.toISOString();
        const physioParam = activePhysioId ? `&physio=${activePhysioId}` : "";

        const [appsResp, vacsResp] = await Promise.all([
          api.get(`/api/appointments/events?start=${startISO}&end=${endISO}${physioParam}`),
          api.get(`/api/vacations/events?start=${startISO}&end=${endISO}${physioParam}`),
        ]);

        const rawApps = Array.isArray(appsResp.data) ? appsResp.data : appsResp.data?.data || [];
        const rawVacs = Array.isArray(vacsResp.data) ? vacsResp.data : vacsResp.data?.data || [];

        const apps = rawApps.map((e) => ({
          ...e,
          title: (e?.title || e?.extendedProps?.patientName || "Sesión").trim(),
        }));

        const vacs = activePhysioId
          ? rawVacs.filter((v) => v?.extendedProps?.fisioId === activePhysioId)
          : rawVacs;

        const flat = [...apps]
          .sort((a, b) => new Date(a.start) - new Date(b.start))
          .map((e) => ({
            id: e.id,
            start: e.start,
            end: e.end,
            title: e.title || "Sesión",
            physioName: e.extendedProps?.physioName || "",
            patientName: e.extendedProps?.patientName || e.title || "Sesión",
            physio: e.extendedProps?.physioId || "",
            patient: e.extendedProps?.patientId || "",
            notes: e.extendedProps?.notes || "",
          }));
        setList(flat);

        success([
          ...apps,
          ...vacs.map((v) => ({ ...v, display: "background" })),
        ]);
      } catch (err) {
        console.error(err);
        failure(err);
      }
    },
    [activePhysioId]
  );

  const eventContent = (arg) => {
    if (arg.event.display === "background") {
      return { html: `<div style="font-weight:600; opacity:.8">${arg.event.title}</div>` };
    }
    const t = (arg.event.title || "Sesión").trim();
    return { html: `<div><b>${t}</b></div>` };
  };

  const openFormWith = (startDate, endDate) => {
    setFormInitial({
      id: undefined,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      durationMin: Math.max(15, Math.round((endDate - startDate) / 60000)),
      physio: activePhysioId || "",
      patientName: "",
      notes: "",
    });
    setShowForm(true);
    setTimeout(() => {
      document.getElementById("appointment-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const handleSubmit = async (payload) => {
    try {
      if (payload.id) {
        await apiUpdateAppointment(payload.id, {
          title: "Sesión",
          physio: payload.physio,
          start: payload.start,
          end: payload.end,
          notes: payload.notes || "",
          patientName: payload.patientName,
          createPatientIfMissing: payload.createPatientIfMissing,
        });
      } else {
        await apiCreateAppointment({
          title: "Sesión",
          physio: payload.physio,
          start: payload.start,
          end: payload.end,
          notes: payload.notes || "",
          patientName: payload.patientName,
          createPatientIfMissing: payload.createPatientIfMissing,
        });
      }
      setShowForm(false);
      setFormInitial(null);
      calRef.current?.getApi()?.refetchEvents();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || err.message || "No se pudo guardar la cita");
    }
  };

  const handleEdit = (item) => {
    setFormInitial({
      id: item.id,
      patientName: item.patientName || item.title || "",
      physio: item.physio || activePhysioId || "",
      start: new Date(item.start).toISOString(),
      end: new Date(item.end).toISOString(),
      durationMin: Math.max(15, Math.round((new Date(item.end) - new Date(item.start)) / 60000)),
      notes: item.notes,
    });
    setShowForm(true);
    setTimeout(() => document.getElementById("appointment-form")?.scrollIntoView({ behavior: "smooth" }), 0);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta cita?")) return;
    try {
      await apiDeleteAppointment(id);
      calRef.current?.getApi()?.refetchEvents();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || err.message || "No se pudo eliminar la cita");
    }
  };

  const goPrevWeek = () => calRef.current?.getApi()?.prev();
  const goNextWeek = () => calRef.current?.getApi()?.next();

  const weeklyList = useMemo(() => {
    if (!currentRange.start || !currentRange.end) return list;
    const s = +currentRange.start, e = +currentRange.end;
    return list.filter((x) => +new Date(x.start) >= s && +new Date(x.start) < e);
  }, [list, currentRange]);

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ marginBottom: 12 }}>Citas</h1>

        {/* Selector de fisio (sin "Todos") */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <select
            value={selectedFisio || ""}
            onChange={(e) => {
              setSelectedFisio(e.target.value);
              calRef.current?.getApi()?.refetchEvents();
            }}
            style={{ minWidth: 260 }}
            disabled={!fisios.length}
          >
            {!fisios.length ? (
              <option value="">Cargando fisios…</option>
            ) : (
              fisios.map((f) => (
                <option key={f._id} value={f._id}>
                  {`${f.nombre ?? ""} ${f.apellidos ?? ""}`.trim()}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* FILA 1: calendario + formulario */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 480px", gap: 24 }}>
        {/* Calendario */}
        <div style={{ background: "var(--card-bg, #fff)", borderRadius: 12, padding: 12 }}>
          {/* Controles de paginación de fisio */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 8px" }}>
            <button className="btn-lite" onClick={goPrevPhysio} aria-label="Fisio anterior">◀︎</button>
            <div style={{ fontSize: 14, opacity: 0.85 }}>
              {fisios.length ? `Mostrando: ${activePhysioName}` : "Cargando fisios…"}
            </div>
            <button className="btn-lite" onClick={goNextPhysio} aria-label="Fisio siguiente">▶︎</button>
          </div>

          <FullCalendar
            ref={calRef}
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            locale={esLocale}
            height="auto"
            nowIndicator
            slotMinTime="08:00:00"
            slotMaxTime="21:00:00"
            events={fetchEvents}
            eventContent={eventContent}
            selectable
            select={(info) => openFormWith(info.start, info.end)}
            dateClick={(arg) => openFormWith(arg.date, new Date(arg.date.getTime() + 30 * 60000))}
            datesSet={(info) => setCurrentRange({ start: info.start, end: info.end })}
          />
        </div>

        {/* Formulario */}
        <div style={{ background: "var(--card-bg, #fff)", borderRadius: 12, padding: 18 }}>
          <h3 style={{ marginTop: 0 }}>Nueva / editar cita</h3>
          {showForm ? (
            <AppointmentForm
              physios={fisios}
              initial={formInitial}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setFormInitial(null);
              }}
            />
          ) : (
            <p style={{ opacity: 0.7, fontStyle: "italic" }}>
              Selecciona un hueco en el calendario para crear una cita o pulsa “Editar” en la lista.
            </p>
          )}
        </div>
      </div>

      {/* Listado semanal */}
      <div style={{ background: "var(--card-bg, #fff)", borderRadius: 12, padding: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Próximas citas (semana visible)</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="btn-lite" onClick={goPrevWeek}>◀︎ Semana anterior</button>
            <button className="btn-lite" onClick={goNextWeek}>Siguiente semana ▶︎</button>
          </div>
        </div>

        {weeklyList.length === 0 ? (
          <p style={{ opacity: 0.6, fontStyle: "italic" }}>Sin citas en esta semana</p>
        ) : (
          <ul className="adj-list" style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12, marginTop: 15 }}>
            {weeklyList.map((i) => (
              <li
                key={i.id}
                style={{
                  borderRadius: 12,
                  background: "var(--panel)",
                  border: "1px solid var(--border)",
                  padding: "12px 14px",
                  boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  {/* Izquierda: nombre paciente + fisio */}
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
                      {i.patientName || i.title}
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
                      Fisio: {i.physioName || "—"}
                    </div>
                  </div>

                  {/* Derecha: fecha/hora + botones */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>
                      {new Date(i.start).toLocaleString()}
                    </span>
                    <AdjButton title="Editar" onClick={() => handleEdit(i)}>Editar</AdjButton>
                    <AdjButton variant="delete" title="Eliminar" onClick={() => handleDelete(i.id)}>
                      Eliminar
                    </AdjButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
