import { useEffect, useState } from 'react';
import { apiListVacations, apiDeleteVacation } from '../../api';

export default function VacationsList({ reloadKey }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await apiListVacations();
      setItems(data);
    } catch {
      setError('No se pudieron cargar las vacaciones');
    } finally {
      setLoading(false); 
    }
  }

  useEffect(() => { load(); }, [reloadKey]);

  async function handleDelete(id) {
    if (!confirm('¿Eliminar vacaciones?')) return;
    try {
      await apiDeleteVacation(id);
      setItems(prev => prev.filter(x => x._id !== id));
    } catch (err) {
      alert(err.message || 'No autorizado o error al eliminar');
    }
  }

  if (loading) return <p className="text-[var(--muted)]">Cargando…</p>;
  if (error)   return <p className="text-red-500">{error}</p>;
  if (items.length === 0) return <p className="text-[var(--muted)]">No hay vacaciones registradas.</p>;

  return (
    <div className="rounded-2xl p-3 border bg-[var(--panel)]">
      <h3 className="text-base font-medium mb-3">Listado</h3>
      <div className="space-y-2">
        {items.map(v => (
          <div key={v._id}
               className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-3 rounded-xl border bg-[color:var(--panel,rgba(255,255,255,0.05))] hover:bg-[var(--panel-hover)]">
            <div className="space-y-1">
              <div className="text-sm">
                <span className="font-medium">
                  {v.fisio?.nombre} {v.fisio?.apellidos}
                </span>
                <span className="ml-2 text-[var(--muted)]">
                  {new Date(v.startDate).toLocaleDateString()} → {new Date(v.endDate).toLocaleDateString()}
                </span>
                {v.my && <span className="ml-2 text-xs px-2 py-0.5 rounded-full border">tuyas</span>}
              </div>
              {v.notes && <div className="text-sm text-[var(--muted)]">Notas: {v.notes}</div>}
            </div>

            <button onClick={() => handleDelete(v._id)}
                    className="self-start md:self-auto px-3 py-1.5 rounded-xl border hover:bg-[var(--panel-hover)]">
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
