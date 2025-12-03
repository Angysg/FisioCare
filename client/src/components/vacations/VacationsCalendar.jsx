// client/src/components/vacations/VacationsCalendar.jsx

import { useMemo, useState } from "react";
// Componentes y utilidades de react-big-calendar
import { Calendar, Views, dateFnsLocalizer } from "react-big-calendar";
// Funciones de fecha de date-fns
import { format, parse, startOfWeek, getDay } from "date-fns";
// Locale en español para fechas
import es from "date-fns/locale/es";

// Configuración de locales para el calendar (en este caso solo 'es')
const locales = { es };
// Localizador que conecta react-big-calendar con date-fns
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // semana empieza en lunes
  getDay,
  locales,
});

// Función para obtener un índice de color a partir de un string (determinista)
function hashToIndex(str, modulo) {
  let h = 0;
  for (let i = 0; i < (str || "").length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h) % modulo;
}

// Paleta de colores para diferenciar fisioterapeutas
const palette = ["#60A5FA", "#F59E0B", "#34D399", "#F472B6", "#A78BFA", "#F87171", "#22D3EE", "#4ADE80"];

// Color especial para eventos del ADMIN
const ADMIN_COLOR = "#6B7280"; // gris

// Componente de calendario de vacaciones
export default function VacationsCalendar({ events }) {
  // Fecha actualmente visible en el calendario
  const [date, setDate] = useState(new Date());
  // Vista actual (mes, semana, día, agenda)
  const [view, setView] = useState(Views.MONTH);

  // Normalizamos los eventos para asegurarnos de que start/end son Date (no strings)
  const normalized = useMemo(() => {
    return (events || []).map((ev) => ({
      ...ev,
      start: ev.start instanceof Date ? ev.start : new Date(ev.start),
      end: ev.end instanceof Date ? ev.end : new Date(ev.end),
    }));
  }, [events]);

  // Definimos estilos de cada evento según el fisio (o según color que venga del backend)
  const eventPropGetter = (event) => {
    const name = (event.fisioName || event.title || "").toString().toLowerCase();

    let base;
    if (name === "admin") {
      // Si el evento es del admin, usamos el color fijo
      base = ADMIN_COLOR;
    } else {
      // Si hay color en el backend, lo respetamos; si no, elegimos uno en función del fisioId
      base =
        event.color ||
        palette[hashToIndex(event.fisioId || event.fisio?.toString?.() || "", palette.length)];
    }

    // react-big-calendar espera un objeto con style
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
        culture="es"                 // idioma/esquema cultural
        localizer={localizer}        // cómo formatear las fechas
        events={normalized}          // lista de eventos (vacaciones)
        startAccessor="start"        // campo que indica el inicio
        endAccessor="end"            // campo que indica el fin
        titleAccessor={(e) => e.fisioName || e.title || "Vacaciones"} // texto visible en cada evento
        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}    // vistas disponibles
        view={view}
        onView={(v) => setView(v)}   // cambio de vista (mes/semana/día/agenda)
        date={date}
        onNavigate={(newDate) => setDate(newDate)} // navegación entre meses/semanas
        popup                          // muestra eventos extra en popup si hay muchos
        eventPropGetter={eventPropGetter} // función para colorear los eventos
        style={{ height: 720 }}        // altura fija del calendario
      />
    </div>
  );
}
