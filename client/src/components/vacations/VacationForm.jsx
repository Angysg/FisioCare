import { useEffect, useState } from "react";
import { apiCreateVacation } from "../../api";

export default function VacationForm({ onCreated, role, fisios = [] }) {
  const isAdmin = (role || "").toLowerCase() === "admin";
  if (!isAdmin) return null;

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const [fisioId, setFisioId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // cuando llegan/actualizan los fisios, preselecciona el primero
  useEffect(() => {
    if (!fisioId && fisios?.length) setFisioId(fisios[0]._id);
  }, [fisios, fisioId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isAdmin) return;

    setError("");
    if (!startDate || !endDate || !fisioId) {
      setError("Selecciona fisio e introduce fechas de inicio y fin");
      return;
    }

    setLoading(true);
    try {
      await apiCreateVacation({ startDate, endDate, notes, fisioId });
      setStartDate("");
      setEndDate("");
      setNotes("");
      if (fisios?.length) setFisioId(fisios[0]._id || "");
      onCreated?.();
    } catch (err) {
      setError(err?.message || "Error al crear vacaciones");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* añadimos 'vac-form' para que aplique el margen del botón desde app.css */}
      <form onSubmit={handleSubmit} className="vac-form space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-5">
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

        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

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
