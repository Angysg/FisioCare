// client/src/components/vacations/VacationForm.jsx

// Hooks de React para gestionar estado y efectos
import { useEffect, useState } from "react";
// Llamada al backend para crear vacaciones
import { apiCreateVacation } from "../../api";

export default function VacationForm({ onCreated, role, fisios = [] }) {
  // Solo los administradores pueden crear vacaciones
  const isAdmin = (role || "").toLowerCase() === "admin";
  if (!isAdmin) return null; // si no es admin, no mostramos nada

  // Estados del formulario
  const [startDate, setStartDate] = useState(""); // fecha inicio vacaciones
  const [endDate, setEndDate] = useState("");     // fecha fin vacaciones
  const [notes, setNotes] = useState("");         // notas opcionales

  const [fisioId, setFisioId] = useState("");     // fisioterapeuta seleccionado
  const [loading, setLoading] = useState(false);  // estado de carga del botón
  const [error, setError] = useState("");         // errores de validación o servidor

  // Cuando se cargan los fisios, seleccionamos el primero automáticamente
  useEffect(() => {
    if (!fisioId && fisios?.length) setFisioId(fisios[0]._id);
  }, [fisios, fisioId]);

  // Manejo del envío del formulario
  async function handleSubmit(e) {
    e.preventDefault(); // evita recargar la página
    if (!isAdmin) return;

    setError("");

    // Validación mínima
    if (!startDate || !endDate || !fisioId) {
      setError("Selecciona fisio e introduce fechas de inicio y fin");
      return;
    }

    setLoading(true); // muestra "Guardando…"

    try {
      // Petición al backend para crear vacaciones
      await apiCreateVacation({ startDate, endDate, notes, fisioId });

      // Limpiamos el formulario después de guardar
      setStartDate("");
      setEndDate("");
      setNotes("");
      if (fisios?.length) setFisioId(fisios[0]._id || "");

      // Avisamos al padre (Vacaciones.jsx) para refrescar listados/calendario
      onCreated?.();
    } catch (err) {
      setError(err?.message || "Error al crear vacaciones");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Añadimos 'vac-form' para aplicar estilos globales desde app.css */}
      <form onSubmit={handleSubmit} className="vac-form space-y-4">
        
        {/* Fila de 4 columnas: fisio, inicio, fin, notas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-5">
          
          {/* Selector de fisioterapeuta */}
          <div className="md:col-span-1">
            <label className="block text-sm text-[var(--muted)] mb-1">
              Fisioterapeuta
            </label>
            <select
              className="w-full rounded-md border px-3 py-2 bg-[var(--input-bg)] text-[var(--input-text)]"
              value={fisioId}
              onChange={(e) => setFisioId(e.target.value)}
              disabled={loading || !(fisios?.length)}
            >
              {(fisios || []).map((f) => (
                <option key={f._id} value={f._id}>
                  {f.nombre} {f.apellidos}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha de inicio */}
          <div className="md:col-span-1">
            <label className="block text-sm text-[var(--muted)] mb-1">Inicio</label>
            <input
              type="date"
              className="w-full rounded-md border px-3 py-2 bg-[var(--input-bg)] text-[var(--input-text)]"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Fecha de fin */}
          <div className="md:col-span-1">
            <label className="block text-sm text-[var(--muted)] mb-1">Fin</label>
            <input
              type="date"
              className="w-full rounded-md border px-3 py-2 bg-[var(--input-bg)] text-[var(--input-text)]"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Campo de notas opcionales */}
          <div className="md:col-span-1">
            <label className="block text-sm text-[var(--muted)] mb-1">
              Notas (opcional)
            </label>
            <input
              type="text"
              placeholder="p. ej., puente, congreso…"
              className="w-full rounded-md border px-3 py-2 bg-[var(--input-bg)] text-[var(--input-text)]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Mensaje de error en rojo */}
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

        {/* Botón de guardar */}
        <div style={{ marginTop: 10 }}>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-md bg-[rgb(69,108,241)] text-white font-medium shadow hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </>
  );
}
