// client/src/components/vacations/VacationsList.jsx

import { useEffect, useMemo, useState } from "react";
import { apiListVacations, apiDeleteVacation } from "../../api";

/* === Botón suave (evita el estilo global de <button>) === */
function SoftButton({ children, onClick, variant = "action" }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
    boxSizing: "border-box",
    borderRadius: 12,
    padding: "8px 12px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    outline: "none",
    transition: "background 0.2s, box-shadow 0.2s",
  };

  // Dos estilos: normal (links) y "delete" (rojo)
  const palette =
    variant === "delete"
      ? {
          color: "#b91c1c",
          border: "1px solid rgba(185,28,28,0.35)",
          background: "rgba(185,28,28,0.05)",
          hoverBg: "rgba(185,28,28,0.12)",
          focusRing: "0 0 0 3px rgba(185,28,28,0.25)",
        }
      : {
          color: "var(--link)",
          border:
            "1px solid color-mix(in srgb, var(--link) 45%, transparent)",
          background: "color-mix(in srgb, var(--link) 6%, transparent)",
          hoverBg: "color-mix(in srgb, var(--link) 15%, transparent)",
          focusRing:
            "0 0 0 3px color-mix(in srgb, var(--link) 35%, transparent)",
        };

  const [bg, setBg] = useState(palette.background);

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(e);
        }
      }}
      onMouseEnter={() => setBg(palette.hoverBg)}
      onMouseLeave={() => setBg(palette.background)}
      onFocus={() => setBg(palette.hoverBg)}
      onBlur={() => setBg(palette.background)}
      style={{
        ...base,
        color: palette.color,
        background: bg,
        border: palette.border,
      }}
      onMouseDown={(e) => (e.currentTarget.style.boxShadow = palette.focusRing)}
      onMouseUp={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      {children}
    </span>
  );
}

/* === Utilidades de formato === */
function fmtDate(d) {
  if (!d) return "—";
  try {
    // Fecha corta en español
    return new Date(d).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

/* === días naturales (por si lo quieres usar en algún momento) === */
function daysBetween(a, b) {
  try {
    const d1 = new Date(a);
    const d2 = new Date(b);
    return Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);
  } catch {
    return null;
  }
}

/* === Cálculo de días laborables (excluye fines de semana y festivos) === */
const HOLIDAYS_2025 = new Set([
  "2025-01-01",
  "2025-01-06",
  "2025-05-01",
  "2025-08-15",
  "2025-10-12",
  "2025-11-01",
  "2025-12-06",
  "2025-12-08",
  "2025-12-25",
]);

// Pasa una fecha a formato ISO (YYYY-MM-DD) sin zona horaria
function toISO(d) {
  const date = d instanceof Date ? d : new Date(d);
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  )
    .toISOString()
    .slice(0, 10);
}

// Recorre día a día entre start y end y cuenta solo laborables
function countWorkingDays(
  startDate,
  endDate,
  holidays = HOLIDAYS_2025,
  weekend = new Set([0, 6])
) {
  if (!startDate || !endDate) return 0;
  const s0 = new Date(startDate);
  const e0 = new Date(endDate);
  const s = new Date(s0.getFullYear(), s0.getMonth(), s0.getDate());
  const e = new Date(e0.getFullYear(), e0.getMonth(), e0.getDate());

  let count = 0;
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const day = d.getDay(); // 0=dom, 6=sáb
    const iso = toISO(d);
    if (!weekend.has(day) && !holidays.has(iso)) count++;
  }
  return count;
}

/* ======================================================================== */

// Etiquetas de los meses para los filtros
const MONTH_LABELS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export default function VacationsList({ reloadKey, role }) {
  const [items, setItems] = useState([]);     // lista de vacaciones
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = (role || "").toLowerCase() === "admin";
  const isFisio = (role || "").toLowerCase() === "fisioterapeuta";

  // Filtros de la parte superior
  const [selectedFisio, setSelectedFisio] = useState("ALL"); // solo admin lo usa
  const [selectedMonth, setSelectedMonth] = useState("ALL"); // ambos roles

  // Carga inicial de vacaciones desde la API
  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiListVacations();
      const list = Array.isArray(data) ? data : data?.items || data?.data || [];
      setItems(list || []);
    } catch {
      setError("No se pudieron cargar las vacaciones");
    } finally {
      setLoading(false);
    }
  }

  // Se dispara al montar el componente o cuando cambia reloadKey
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  // Opciones de fisioterapeuta (solo admin)
  const fisioOptions = useMemo(() => {
    if (!isAdmin) return [];
    const map = new Map();
    (items || []).forEach((v) => {
      const id = (
        v?.fisio?._id ||
        v?.fisio ||
        v?.fisioId ||
        ""
      ).toString();
      if (!id) return;
      const name =
        (v?.fisio?.nombre || "") +
        (v?.fisio?.apellidos ? " " + v.fisio.apellidos : "");
      if (!map.has(id)) {
        map.set(id, name || "Fisioterapeuta");
      }
    });
    // Devolvemos { id, name } únicos para el select
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [items, isAdmin]);

  // Opciones de mes a partir de startDate (para ambos roles)
  const monthOptions = useMemo(() => {
    const set = new Set();
    (items || []).forEach((v) => {
      const d = new Date(v.startDate);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, "0")}`;
      set.add(key);
    });
    return Array.from(set)
      .sort()
      .map((key) => {
        const [y, m] = key.split("-");
        const monthIndex = Number(m) - 1;
        const label = `${MONTH_LABELS[monthIndex] ?? m} ${y}`;
        return { value: key, label };
      });
  }, [items]);

  // Aplicamos filtros de fisio (admin) y mes (todos)
  const filteredItems = useMemo(() => {
    if (!items) return [];
    return (items || []).filter((v) => {
      // Filtro por fisio SOLO si es admin
      if (isAdmin && selectedFisio !== "ALL") {
        const id = (
          v?.fisio?._id ||
          v?.fisio ||
          v?.fisioId ||
          ""
        ).toString();
        if (id !== selectedFisio) return false;
      }
      // Filtro por mes (admin y fisio)
      if (selectedMonth !== "ALL") {
        const d = new Date(v.startDate);
        if (isNaN(d)) return false;
        const key = `${d.getFullYear()}-${String(
          d.getMonth() + 1
        ).padStart(2, "0")}`;
        if (key !== selectedMonth) return false;
      }
      return true;
    });
  }, [items, isAdmin, selectedFisio, selectedMonth]);

  // Ordenamos por fecha de inicio (las más recientes primero)
  const sorted = useMemo(
    () =>
      [...filteredItems].sort(
        (a, b) => new Date(b.startDate) - new Date(a.startDate)
      ),
    [filteredItems]
  );

  // Eliminar vacaciones (solo admin)
  async function handleDelete(id) {
    if (!isAdmin) {
      alert("No tienes permisos para eliminar vacaciones.");
      return;
    }

    if (!confirm("¿Eliminar estas vacaciones?")) return;
    try {
      await apiDeleteVacation(id);
      setItems((prev) => prev.filter((x) => x._id !== id));
    } catch (err) {
      alert(err?.message || "No autorizado o error al eliminar");
    }
  }

  // Wrapper para reutilizar el mismo layout en todos los estados
  const Wrapper = ({ children }) => (
    <section className="rounded-2xl border bg-[var(--panel)] p-5 md:p-6">
      <h2 className="sec-title sec-title--big">
        {isFisio && !isAdmin ? "Mis vacaciones" : "Listado de vacaciones"}
      </h2>
      {children}
    </section>
  );

  // Estado de carga
  if (loading)
    return (
      <Wrapper>
        <p className="text-[var(--muted)]">Cargando…</p>
      </Wrapper>
    );

  // Estado de error
  if (error)
    return (
      <Wrapper>
        <p className="text-red-500">{error}</p>
      </Wrapper>
    );

  // --- A partir de aquí SIEMPRE mostramos filtros, aunque no haya resultados ---
  return (
    <Wrapper>
      {/* Filtros:
          - Admin: fisio + mes
          - Fisio: solo mes */}
      {isAdmin && (
        <div
          className="filter-grid"
          style={{
            marginBottom: 16,
          }}
        >
          {/* Filtro por fisioterapeuta */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <label className="text-sm text-[var(--muted)]">
              Filtrar por fisioterapeuta
            </label>
            <select
              className="rounded-xl border bg-transparent px-3 py-2"
              value={selectedFisio}
              onChange={(e) => setSelectedFisio(e.target.value)}
            >
              <option value="ALL">Todos los fisioterapeutas</option>
              {fisioOptions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por mes (admin) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <label className="text-sm text-[var(--muted)]">
              Filtrar por mes
            </label>
            <select
              className="rounded-xl border bg-transparent px-3 py-2"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="ALL">Todos los meses</option>
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Filtro por mes para el rol fisioterapeuta */}
      {isFisio && !isAdmin && (
        <div
          style={{
            marginBottom: 16,
            maxWidth: 260,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <label className="text-sm text-[var(--muted)]">
            Filtrar por mes
          </label>
          <select
            className="rounded-xl border bg-transparent px-3 py-2"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="ALL">Todos los meses</option>
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Lista o mensaje si no hay resultados */}
      {sorted.length === 0 ? (
        <p className="text-[var(--muted)]">No hay vacaciones registradas.</p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "grid",
            gap: 12,
          }}
        >
          {sorted.map((v) => {
            const nombre =
              (v.fisio?.nombre || "") +
              (v.fisio?.apellidos ? " " + v.fisio.apellidos : "");
            const inicio = fmtDate(v.startDate);
            const fin = fmtDate(v.endDate);

            const workingDays = countWorkingDays(v.startDate, v.endDate);
            const naturalDays = daysBetween(v.startDate, v.endDate); // por si lo quieres mencionar

            return (
              <li
                key={v._id}
                className="pac-item"
                style={{
                  borderRadius: 12,
                  background: "var(--panel)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 1px 8px rgba(0, 0, 0, 0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "12px 14px",
                    minHeight: 64,
                  }}
                >
                  <div>
                    {isAdmin ? (
                      // Vista admin: nombre del fisio + fechas + días
                      <>
                        <div
                          style={{
                            fontWeight: 700,
                            color: "var(--text)",
                            fontSize: 18,
                          }}
                        >
                          {nombre || "Fisioterapeuta"}
                        </div>
                        <div
                          style={{
                            color: "var(--muted)",
                            fontSize: 16,
                          }}
                        >
                          {inicio} &nbsp;→&nbsp; {fin}
                          &nbsp;·&nbsp;
                          <strong>
                            {workingDays}{" "}
                            {workingDays === 1 ? "día" : "días"}
                          </strong>
                          {v.notes?.trim() && (
                            <>
                              {" "}
                              &nbsp;·&nbsp;Notas: {v.notes.trim()}
                            </>
                          )}
                        </div>
                      </>
                    ) : (
                      // Vista fisio: destaca los días arriba
                      <>
                        <div
                          style={{
                            fontWeight: 700,
                            color: "var(--text)",
                            fontSize: 18,
                          }}
                        >
                          <strong>
                            {workingDays}{" "}
                            {workingDays === 1 ? "día" : "días"}
                          </strong>
                        </div>
                        <div
                          style={{
                            color: "var(--muted)",
                            fontSize: 16,
                          }}
                        >
                          {inicio} &nbsp;→&nbsp; {fin}
                          {v.notes?.trim() && (
                            <>
                              {" "}
                              &nbsp;·&nbsp;Notas: {v.notes.trim()}
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Botón eliminar SOLO para admin */}
                  {isAdmin && (
                    <SoftButton
                      variant="delete"
                      onClick={() => handleDelete(v._id)}
                    >
                      Eliminar
                    </SoftButton>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Wrapper>
  );
}
