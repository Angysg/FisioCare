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
          border: "1px solid color-mix(in srgb, var(--link) 45%, transparent)",
          background: "color-mix(in srgb, var(--link) 6%, transparent)",
          hoverBg: "color-mix(in srgb, var(--link) 15%, transparent)",
          focusRing: "0 0 0 3px color-mix(in srgb, var(--link) 35%, transparent)",
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
      style={{ ...base, color: palette.color, background: bg, border: palette.border }}
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
    return new Date(d).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}
function daysBetween(a, b) {
  try {
    const d1 = new Date(a);
    const d2 = new Date(b);
    return Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);
  } catch {
    return null;
  }
}

export default function VacationsList({ reloadKey }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sorted = useMemo(
    () => [...items].sort((a, b) => new Date(b.startDate) - new Date(a.startDate)),
    [items]
  );

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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  async function handleDelete(id) {
    if (!confirm("¿Eliminar estas vacaciones?")) return;
    try {
      await apiDeleteVacation(id);
      setItems((prev) => prev.filter((x) => x._id !== id));
    } catch (err) {
      alert(err?.message || "No autorizado o error al eliminar");
    }
  }

  const Wrapper = ({ children }) => (
    <section className="rounded-2xl border bg-[var(--panel)] p-5 md:p-6">
      <h2 className="sec-title sec-title--big">Listado</h2>
      {children}
    </section>
  );

  if (loading) return <Wrapper><p className="text-[var(--muted)]">Cargando…</p></Wrapper>;
  if (error)   return <Wrapper><p className="text-red-500">{error}</p></Wrapper>;
  if (!sorted.length) return <Wrapper><p className="text-[var(--muted)]">No hay vacaciones registradas.</p></Wrapper>;

  return (
    <Wrapper>
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
            (v.fisio?.nombre || "") + (v.fisio?.apellidos ? " " + v.fisio.apellidos : "");
          const inicio = fmtDate(v.startDate);
          const fin    = fmtDate(v.endDate);
          const ndias  = daysBetween(v.startDate, v.endDate);

          return (
            <li
              key={v._id}
              className="pac-item"
              style={{
                borderRadius: 12,
                background: "var(--panel)",
                border: "1px solid var(--border)",
                boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
              }}
            >
              {/* Fila */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",   // <-- centra verticalmente
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "12px 14px",
                  minHeight: 64,          // <-- altura consistente como el resto de listas
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 16 }}>
                    {nombre || "Fisioterapeuta"}
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    {inicio} &nbsp;→&nbsp; {fin}
                    {typeof ndias === "number" && <> &nbsp;·&nbsp; {ndias} {ndias === 1 ? "día" : "días"}</>}
                    {v.notes?.trim() && <> &nbsp;·&nbsp;Notas: {v.notes.trim()}</>}
                  </div>
                </div>

                {/* Botón suave: alineado, sin “descuadre” */}
                <SoftButton variant="delete" onClick={() => handleDelete(v._id)}>
                  Eliminar
                </SoftButton>
              </div>
            </li>
          );
        })}
      </ul>
    </Wrapper>
  );
}
