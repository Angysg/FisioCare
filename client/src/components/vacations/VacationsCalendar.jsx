import { useMemo, useState } from 'react';
import { Calendar, Views, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import es from 'date-fns/locale/es';

const locales = { es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Color por fisio (determinista)
function hashToIndex(str, modulo) {
  let h = 0;
  for (let i = 0; i < (str || '').length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h) % modulo;
}

const palette = [
  '#60A5FA', '#F59E0B', '#34D399', '#F472B6',
  '#A78BFA', '#F87171', '#22D3EE', '#4ADE80',
];

export default function VacationCalendar({ events }) {
  // events: [{ title, start, end, fisioId, fisioName, color? }, ...]
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState(Views.MONTH);

  // Normalizar eventos a Date reales (por si vienen como string)
  const normalized = useMemo(() => {
    return (events || []).map(ev => ({
      ...ev,
      start: ev.start instanceof Date ? ev.start : new Date(ev.start),
      end:   ev.end   instanceof Date ? ev.end   : new Date(ev.end),
    }));
  }, [events]);

  // Colorear por fisio (prioriza ev.color si viene del backend)
  const eventPropGetter = (event) => {
    const base = event.color ||
      palette[hashToIndex(event.fisioId || event.fisio?.toString?.() || '', palette.length)];
    return {
      style: {
        backgroundColor: base,
        borderColor: 'transparent',
        color: 'white',
      },
    };
  };

  // Leyenda sencilla de colores por fisio
  const legend = useMemo(() => {
    const byFisio = new Map();
    normalized.forEach(ev => {
      const id = ev.fisioId || ev.fisio?.toString?.() || 'unknown';
      const name = ev.fisioName || ev.fisioNombre || ev.fisio?.nombre || 'Fisio';
      const color = ev.color || palette[hashToIndex(id, palette.length)];
      byFisio.set(id, { name, color });
    });
    return Array.from(byFisio.values());
  }, [normalized]);

  return (
  <div className="vac-calendar rounded-2xl p-5 md:p-6 border bg-[var(--panel)]">
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <h2 className="text-lg font-medium">Calendario</h2>
      {legend.length > 0 && (
        <div className="ml-auto flex flex-wrap gap-3">
          {legend.map((l, i) => (
            <span key={i} className="inline-flex items-center text-sm">
              <span className="w-3 h-3 rounded-sm mr-1" style={{ backgroundColor: l.color }} />
              {l.name}
            </span>
          ))}
        </div>
      )}
    </div>

    <Calendar
      culture="es"
      localizer={localizer}
      events={normalized}
      startAccessor="start"
      endAccessor="end"
      titleAccessor={(e) =>
        e.title || (e.fisioName ? `${e.fisioName} — Vacaciones` : 'Vacaciones')
      }
      views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
      view={view}
      onView={(v) => setView(v)}
      date={date}
      onNavigate={(newDate) => setDate(newDate)}
      popup
      eventPropGetter={eventPropGetter}
      style={{ height: 720 }}
    />
  </div>
);

}
