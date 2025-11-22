// src/components/appointments/AppointmentForm.jsx
import { useEffect, useState } from "react";
import dayjs from "dayjs";

export default function AppointmentForm({ physios = [], initial, onSubmit, onCancel }) {
  const buildState = (init) => {
    const start = init?.start ? dayjs(init.start) : dayjs().minute(0).second(0);
    const end = init?.end ? dayjs(init.end) : start.add(30, "minute");

    return {
      physio: init?.physio || "",
      patientName: init?.patientName || "",
      createPatientIfMissing: !!init?.createPatientIfMissing,
      // guardamos fecha y hora por separado para poder editarlas
      date: start.format("YYYY-MM-DD"), // para <input type="date">
      time: start.format("HH:mm"),      // para <input type="time">
      durationMin: end.diff(start, "minute") || 30,
      notes: init?.notes || "",
      id: init?.id,
    };
  };

  const [form, setForm] = useState(buildState(initial));

  useEffect(() => {
    setForm(buildState(initial)); // reset al cambiar initial (nueva / editar)
  }, [initial]);

  const change = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const submit = (e) => {
    e.preventDefault();

    // Construimos el start a partir de date + time
    if (!form.date || !form.time) return;

    const start = dayjs(`${form.date}T${form.time}:00`);
    const duration = form.durationMin || 30;
    const end = start.add(duration, "minute");

    onSubmit({
      id: form.id,
      physio: form.physio,
      patientName: form.patientName.trim(),
      createPatientIfMissing: !!form.createPatientIfMissing,
      start: start.toISOString(),
      end: end.toISOString(),
      notes: form.notes || "",
    });
  };

  return (
    <form
      id="appointment-form"
      onSubmit={submit}
      style={{ display: "grid", gap: 14 }}
    >
      <div>
        <label className="block text-sm mb-1">Fisioterapeuta</label>
        <select
          className="w-full"
          value={form.physio}
          onChange={(e) => change("physio", e.target.value)}
          required
        >
          <option value="">— Selecciona —</option>
          {physios.map((p) => (
            <option key={p._id} value={p._id}>
              {p.nombre} {p.apellidos}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm mb-1">Paciente</label>
        <input
          className="w-full"
          placeholder="Nombre y apellidos…"
          value={form.patientName}
          onChange={(e) => change("patientName", e.target.value)}
          required
        />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
          <input
            id="autoCreatePatient"
            type="checkbox"
            checked={form.createPatientIfMissing}
            onChange={(e) => change("createPatientIfMissing", e.target.checked)}
            style={{ width: 18, height: 18 }}
          />
          <label htmlFor="autoCreatePatient" style={{ margin: 0, cursor: "pointer" }}>
            Crear paciente automáticamente si no existe
          </label>
        </div>
      </div>

      {/* Ahora día y hora SON EDITABLES */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="block text-sm mb-1">Día</label>
          <input
            type="date"
            className="w-full"
            value={form.date}
            onChange={(e) => change("date", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Hora</label>
          <input
            type="time"
            className="w-full"
            value={form.time}
            onChange={(e) => change("time", e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">Duración (min)</label>
        <input
          type="number"
          min={15}
          step={15}
          className="w-full"
          value={form.durationMin}
          onChange={(e) =>
            change("durationMin", parseInt(e.target.value || "30", 10))
          }
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Observaciones</label>
        <textarea
          className="w-full"
          rows={5}
          value={form.notes}
          onChange={(e) => change("notes", e.target.value)}
        />
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
        <button type="button" onClick={onCancel} className="btn-outline">
          Cancelar
        </button>
        <button type="submit" className="btn-primary">
          Guardar
        </button>
      </div>
    </form>
  );
}
