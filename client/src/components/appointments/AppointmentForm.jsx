// src/components/appointments/AppointmentForm.jsx

// Hooks de React para manejar estado y efectos
import { useEffect, useState } from "react";
// Librería dayjs para trabajar cómodo con fechas y horas
import dayjs from "dayjs";

// Componente de formulario de cita.
// Props:
//   - physios: array de fisioterapeutas disponibles para elegir
//   - initial: datos iniciales de la cita (para modo edición) o undefined (para crear)
//   - onSubmit: función que se ejecuta al guardar la cita
//   - onCancel: función que se ejecuta al pulsar "Cancelar"
export default function AppointmentForm({ physios = [], initial, onSubmit, onCancel }) {
  // Función auxiliar para construir el estado inicial del formulario
  const buildState = (init) => {
    // Si viene una cita inicial, partimos de sus fechas; si no, usamos "ahora" redondeado a la hora en punto
    const start = init?.start ? dayjs(init.start) : dayjs().minute(0).second(0);
    // La hora de fin es la que venga en la cita o 30 minutos después del inicio
    const end = init?.end ? dayjs(init.end) : start.add(30, "minute");

    return {
      // Fisioterapeuta seleccionado (ID)
      physio: init?.physio || "",
      // Nombre del paciente que viene de la cita o vacío si es nueva
      patientName: init?.patientName || "",
      // Flag para indicar si se debe crear el paciente si no existe
      createPatientIfMissing: !!init?.createPatientIfMissing,
      // guardamos fecha y hora por separado para poder editarlas
      date: start.format("YYYY-MM-DD"), // para <input type="date">
      time: start.format("HH:mm"),      // para <input type="time">
      // Duración en minutos. Si no se puede calcular, por defecto 30.
      durationMin: end.diff(start, "minute") || 30,
      // Observaciones de la cita
      notes: init?.notes || "",
      // ID de la cita (solo en modo edición)
      id: init?.id,
    };
  };

  // Estado del formulario: un único objeto con todos los campos
  const [form, setForm] = useState(buildState(initial));

  // Cuando cambian las props "initial" (por ejemplo, si pasamos de crear a editar),
  // reseteamos el formulario con los nuevos datos
  useEffect(() => {
    setForm(buildState(initial)); // reset al cambiar initial (nueva / editar)
  }, [initial]);

  // Función genérica para actualizar cualquier campo del formulario
  // k = nombre del campo, v = valor nuevo
  const change = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  // Maneja el envío del formulario
  const submit = (e) => {
    e.preventDefault(); // evitamos que el navegador recargue la página al enviar

    // Construimos el start a partir de date + time
    if (!form.date || !form.time) return;

    // Juntamos la fecha y la hora del formulario
    const start = dayjs(`${form.date}T${form.time}:00`);
    const duration = form.durationMin || 30;
    const end = start.add(duration, "minute"); // calculamos hora de fin

    // Llamamos a la función onSubmit que viene del padre
    // y le pasamos los datos ya preparados (incluyendo fechas en ISO)
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

  // Render del formulario en JSX
  return (
    <form
      id="appointment-form"
      onSubmit={submit}
      style={{ display: "grid", gap: 14 }} // layout en grid con separación entre campos
    >
      {/* Selector de fisioterapeuta */}
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

      {/* Campo para escribir el nombre del paciente y checkbox para crear paciente automáticamente */}
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
      {/* Bloque con dos inputs: fecha y hora en dos columnas */}
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

      {/* Campo para definir la duración de la cita en minutos */}
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

      {/* Campo de texto para observaciones o notas de la cita */}
      <div>
        <label className="block text-sm mb-1">Observaciones</label>
        <textarea
          className="w-full"
          rows={5}
          value={form.notes}
          onChange={(e) => change("notes", e.target.value)}
        />
      </div>

      {/* Botones de acción: cancelar y guardar */}
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
