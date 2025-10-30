import { useMemo, useState } from "react";
import { Calendar, Views, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import es from "date-fns/locale/es";

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
  for (let i = 0; i < (str || "").length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h) % modulo;
}

const palette = ["#60A5FA", "#F59E0B", "#34D399", "#F472B6", "#A78BFA", "#F87171", "#22D3EE", "#4ADE80"];

export default function VacationsCalendar({ events }) {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState(Views.MONTH);

  // Normalizar eventos a Date reales (por si vienen como string)
  const normalized = useMemo(() => {
    return (events || []).map((ev) => ({
      ...ev,
      start: ev.start instanceof Date ? ev.start : new Date(ev.start),
      end: ev.end instanceof Date ? ev.end : new Date(ev.end),
    }));
  }, [events]);

  // Colorear por fisio (prioriza ev.color si viene del backend)
  const eventPropGetter = (event) => {
    const base =
      event.color ||
      palette[hashToIndex(event.fisioId || event.fisio?.toString?.() || "", palette.length)];
    return {
      style: {
        backgroundColor: base,
        borderColor: "transparent",
        color: "white",
      },
    };
  };

  return (
    <div className="vac-calendar rounded-2xl p-5 md:p-6 border bg-[var(--panel)]">
      <h2 className="sec-title sec-title--big">Calendario</h2>

      <Calendar
        culture="es"
        localizer={localizer}
        events={normalized}
        startAccessor="start"
        endAccessor="end"
        titleAccessor={(e) => e.fisioName || e.title || "Vacaciones"}
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
