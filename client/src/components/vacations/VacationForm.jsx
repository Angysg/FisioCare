import { useEffect, useState } from "react";
import { apiCreateVacation, apiListFisioterapeutasSimple } from "../../api";

export default function VacationForm({ onCreated, role }) {
  const isAdmin = (role || "").toLowerCase() === "admin";

  // si no es admin, no mostramos el formulario
  if (!isAdmin) {
    return null;
  }

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate]     = useState("");
  const [notes, setNotes]         = useState("");

  const [fisioId, setFisioId]     = useState("");
  const [fisios, setFisios]       = useState([]);

  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => {
    (async () => {
      try {
        const list = await apiListFisioterapeutasSimple();
        setFisios(list || []);
        if (list && list.length && !fisioId) {
          setFisioId(list[0]._id);
        }
      } catch (err) {
        console.error("No se pudieron cargar fisios para el formulario", err);
      }
    })();
  }, [fisioId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isAdmin) return; // seguridad extra front

    setError("");

    if (!startDate || !endDate || !fisioId) {
      setError("Selecciona fisio e introduce fechas de inicio y fin");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        startDate,
        endDate,
        notes,
        fisioId,
      };

      await apiCreateVacation(payload);

      setStartDate("");
      setEndDate("");
      setNotes("");
      if (fisios.length) {
        setFisioId(fisios[0]._id || "");
      }

      onCreated?.();
    } catch (err) {
      setError(err?.message || "Error al crear vacaciones");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-10 rounded-2xl p-5 md:p-6 border bg-[var(--panel)]"
    >
      <h3 className="text-lg font-semibold mb-3">
        Añadir vacaciones
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-5">
        <div className="md:col-span-1">
          <label className="block text-sm text-[var(--muted)] mb-1">
            Fisioterapeuta
          </label>
          <select
            className="w-full rounded-md border px-3 py-2 bg-white text-black"
            value={fisioId}
            onChange={(e) => setFisioId(e.target.value)}
            disabled={loading}
          >
            {fisios.map((f) => (
              <option key={f._id} value={f._id}>
                {f.nombre} {f.apellidos}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-1">
          <label className="block text-sm text-[var(--muted)] mb-1">
            Inicio
          </label>
          <input
            type="date"
            className="w-full rounded-md border px-3 py-2 bg-white text-black"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="md:col-span-1">
          <label className="block text-sm text-[var(--muted)] mb-1">
            Fin
          </label>
          <input
            type="date"
            className="w-full rounded-md border px-3 py-2 bg-white text-black"
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
            className="w-full rounded-md border px-3 py-2 bg-white text-black"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}

      <div className="mt-4">
        <button
          disabled={loading}
          className="px-4 py-2 rounded-md bg-[rgb(69,108,241)] text-white font-medium shadow hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
