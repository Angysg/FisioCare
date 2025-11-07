import { useEffect, useState } from "react";
import dayjs from "dayjs";

export default function AppointmentForm({ physios = [], initial, onSubmit, onCancel }) {
  const buildState = (init) => ({
    physio: init?.physio || "",
    patientName: init?.patientName || "",
    createPatientIfMissing: false,
    start: init?.start || dayjs().minute(0).second(0).toISOString(),
    durationMin: init ? dayjs(init.end).diff(dayjs(init.start), "minute") : 30,
    notes: init?.notes || "",
    id: init?.id,
  });

  const [form, setForm] = useState(buildState(initial));

  useEffect(() => {
    setForm(buildState(initial)); // reset duro al cambiar initial
  }, [initial]);

  const change = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    const start = dayjs(form.start);
    const end = start.add(form.durationMin || 30, "minute");
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

  // Más espacio y consistencia visual sin depender de utilidades externas
  return (
    <form
      id="appointment-form"
      onSubmit={submit}
      style={{ display: "grid", gap: 14 }}   // <- espacio vertical uniforme entre bloques
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="block text-sm mb-1">Día</label>
          <input className="w-full" value={dayjs(form.start).format("DD/MM/YYYY")} readOnly />
        </div>
        <div>
          <label className="block text-sm mb-1">Hora</label>
          <input className="w-full" value={dayjs(form.start).format("HH:mm")} readOnly />
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
          onChange={(e) => change("durationMin", parseInt(e.target.value || "30", 10))}
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
        <button type="button" onClick={onCancel} className="btn-outline">Cancelar</button>
        <button type="submit" className="btn-primary">Guardar</button>
      </div>
    </form>
  );
}
