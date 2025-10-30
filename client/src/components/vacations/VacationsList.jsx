import { useEffect, useState } from "react";
import { apiListVacations, apiDeleteVacation } from "../../api";

export default function VacationsList({ reloadKey }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiListVacations();
      const list = Array.isArray(data) ? data : data?.items || data?.data || [];
      setItems(list);
    } catch {
      setError("No se pudieron cargar las vacaciones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [reloadKey]);

  async function handleDelete(id) {
    if (!confirm("¿Eliminar vacaciones?")) return;
    try {
      await apiDeleteVacation(id);
      setItems((prev) => prev.filter((x) => x._id !== id));
    } catch (err) {
      alert(err?.message || "No autorizado o error al eliminar");
    }
  }

  if (loading) return <p className="text-[var(--muted)]">Cargando…</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (items.length === 0)
    return <p className="text-[var(--muted)]">No hay vacaciones registradas.</p>;

  return (
    <section>
      <h2 className="section-title">Listado</h2>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "grid",
          gap: 12,
        }}
      >
        {items.map((v) => {
          const nombre =
            (v.fisio?.nombre || "") +
            (v.fisio?.apellidos ? " " + v.fisio.apellidos : "");
          const rango =
            new Date(v.startDate).toLocaleDateString() +
            " → " +
            new Date(v.endDate).toLocaleDateString();

        return (
          <li
            key={v._id}
            className="vac-item"
            style={{
              background: "var(--panel)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              transition: "background .2s ease, border-color .2s ease",
            }}
          >
            <div>
              <div className="name" style={{ fontWeight: 700 }}>
                {nombre || "Fisioterapeuta"}
              </div>
              <div className="meta" style={{ color: "var(--muted)" }}>
                {rango}
                {v.notes ? ` · ${v.notes}` : ""}
              </div>
            </div>

            <button
              onClick={() => handleDelete(v._id)}
              className="px-3 py-1.5 rounded-xl border hover:bg-[var(--panel-hover)]"
              style={{ whiteSpace: "nowrap" }}
            >
              Eliminar
            </button>
          </li>
        );
        })}
      </ul>
    </section>
  );
}
