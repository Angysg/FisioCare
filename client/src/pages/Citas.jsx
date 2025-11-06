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

export default function Citas() {
  const calRef = useRef(null);

  const [fisios, setFisios] = useState([]);
  const [patients, setPatients] = useState([]); // ya no es necesario para el form, pero lo dejo si lo usas en otras partes
  const [selectedFisio, setSelectedFisio] = useState("");
  const [pagerIndex, setPagerIndex] = useState(0);

  const [list, setList] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [formInitial, setFormInitial] = useState(null);

  useEffect(() => {
    apiListFisioterapeutasSimple().then(setFisios).catch(() => setFisios([]));
    apiListPacientes().then(setPatients).catch(console.error);
  }, []);

  useEffect(() => {
    calRef.current?.getApi()?.refetchEvents();
  }, [selectedFisio, pagerIndex]);

  const activePhysioId = useMemo(() => {
    if (selectedFisio) return selectedFisio;
    if (!fisios.length) return "";
    return fisios[pagerIndex % fisios.length]?._id || "";
  }, [selectedFisio, fisios, pagerIndex]);

  const activePhysioName = useMemo(() => {
    if (!activePhysioId) return "";
    const f = fisios.find((x) => x._id === activePhysioId);
    return f ? `${f.nombre ?? ""} ${f.apellidos ?? ""}`.trim() : "";
  }, [activePhysioId, fisios]);

  const goPrevPhysio = () => {
    if (!fisios.length) return;
    setPagerIndex((i) => (i - 1 + fisios.length) % fisios.length);
  };
  const goNextPhysio = () => {
    if (!fisios.length) return;
    setPagerIndex((i) => (i + 1) % fisios.length);
  };

  const fetchEvents = useCallback(
    async (fetchInfo, success, failure) => {
      try {
        const startISO = fetchInfo.start.toISOString();
        const endISO = fetchInfo.end.toISOString();
        const physioParam = activePhysioId ? `&physio=${activePhysioId}` : "";

        const [appsResp, vacsResp] = await Promise.all([
          api.get(`/api/appointments/events?start=${startISO}&end=${endISO}${physioParam}`),
          api.get(`/api/vacations/events?start=${startISO}&end=${endISO}`),
        ]);

        const apps = Array.isArray(appsResp.data) ? appsResp.data : appsResp.data?.data || [];
        const vacs = Array.isArray(vacsResp.data) ? vacsResp.data : vacsResp.data?.data || [];

        const flat = [...apps]
          .sort((a, b) => new Date(a.start) - new Date(b.start))
          .map((e) => ({
            id: e.id,
            start: e.start,
            end: e.end,
            title: e.title, // paciente
            physioName: e.extendedProps?.physioName || "",
            patientName: e.extendedProps?.patientName || e.title,
            physio: e.extendedProps?.physioId || "",
            patient: e.extendedProps?.patientId || "",
            notes: e.extendedProps?.notes || "",
          }));
        setList(flat);

        success([...apps, ...vacs]);
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
    return { html: `<div><b>${arg.event.title}</b></div>` };
  };

  const openFormWith = (startDate, endDate) => {
    setFormInitial({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      durationMin: Math.max(15, Math.round((endDate - startDate) / 60000)),
      physio: selectedFisio || activePhysioId || "",
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

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ marginBottom: 12 }}>Citas</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <select
            value={selectedFisio}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedFisio(v);
              if (!v) calRef.current?.getApi()?.refetchEvents();
            }}
            style={{ minWidth: 260 }}
          >
            <option value="">Todos los fisios</option>
            {fisios.map((f) => (
              <option key={f._id} value={f._id}>
                {`${f.nombre ?? ""} ${f.apellidos ?? ""}`.trim()}
              </option>
            ))}
          </select>

          {!selectedFisio && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button className="btn-lite" onClick={goPrevPhysio}>◀︎</button>
              <div style={{ fontSize: 14, opacity: 0.8 }}>
                {fisios.length
                  ? `Mostrando: ${activePhysioName} (${(pagerIndex % fisios.length) + 1}/${fisios.length})`
                  : "Cargando fisios…"}
              </div>
              <button className="btn-lite" onClick={goNextPhysio}>▶︎</button>
            </div>
          )}
        </div>
      </div>

      {/* FILA 1: calendario + formulario */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 24 }}>
        <div style={{ background: "var(--card-bg, #fff)", borderRadius: 12, padding: 12 }}>
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
            selectable={true}
            select={(info) => openFormWith(info.start, info.end)}
            dateClick={(arg) => openFormWith(arg.date, new Date(arg.date.getTime() + 30 * 60000))}
          />
        </div>

        <div style={{ background: "var(--card-bg, #fff)", borderRadius: 12, padding: 12 }}>
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

      {/* FILA 2: listado a ancho completo */}
      <div style={{ background: "var(--card-bg, #fff)", borderRadius: 12, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>Próximas citas</h3>
        {list.length === 0 ? (
          <p style={{ opacity: 0.6, fontStyle: "italic" }}>Sin citas en el rango</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 12,
            }}
          >
            {list.map((i) => (
              <div
                key={i.id}
                style={{
                  border: "1px solid rgba(0,0,0,.06)",
                  borderRadius: 10,
                  padding: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ fontWeight: 600 }}>{i.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{new Date(i.start).toLocaleString()}</div>
                </div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Fisio: {i.physioName}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <button className="btn-lite" onClick={() => handleEdit(i)}>Editar</button>
                  <button className="btn-danger-lite" onClick={() => handleDelete(i.id)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
