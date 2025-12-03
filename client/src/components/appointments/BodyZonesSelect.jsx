// client/src/components/appointments/BodyZonesSelect.jsx

// useMemo se usa para memorizar valores derivados (no recalcular en cada render)
import { useMemo } from "react";
// Constante con todas las zonas corporales permitidas (enum)
import BODY_ZONES from "../../constants/bodyZones.js";

/** 
 * GROUPS: agrupaciones lógicas de zonas del cuerpo.
 * Las claves son los títulos visibles y los valores son los IDs en snake_case
 * que coinciden con los valores del enum BODY_ZONES.
 */
const GROUPS = {
  "Cabeza y cuello": [
    "cabeza",
    "articulacion_temporomandibular",
    "cara",
    "cuello_columna_cervical",
  ],
  "Tronco": [
    "columna_dorsal",
    "columna_lumbar",
    "torax_pecho_dcho",
    "torax_pecho_izq",
    "abdomen",
    "pelvis",
  ],
  "Miembro superior (MMSS)": [
    "hombro_dcho",
    "hombro_izq",
    "brazo_sup_ant_dcho",
    "brazo_sup_pos_dcho",
    "brazo_sup_ant_izq",
    "brazo_sup_pos_izq",
    "antebrazo_dcho",
    "antebrazo_izq",
    "codo_dcho",
    "codo_izq",
    "muneca_dcha",
    "muneca_izq",
    "dedos_manos",
  ],
  "Miembro inferior (MMII)": [
    "ingle_dcha",
    "ingle_izq",
    "cadera_dcha",
    "cadera_izq",
    "gluteo_dcho",
    "gluteo_izq",
    "pierna_sup_pos_dcha",
    "pierna_sup_ant_dcha",
    "pierna_sup_pos_izq",
    "pierna_sup_ant_izq",
    "pierna_inf_dcha",
    "pierna_inf_izq",
    "rodilla_dcha",
    "rodilla_izq",
    "tobillo_dcho",
    "tobillo_izq",
    "pie_dcho",
    "pie_izq",
    "dedos_pies",
  ],
};

/** 
 * GRID_TEMPLATES: permite personalizar el número de columnas por grupo.
 * Si un grupo no está aquí, se usa la plantilla por defecto.
 */
const GRID_TEMPLATES = {
  // Fuerza 1 sola columna para evitar cortes de texto en este grupo
  "Cabeza y cuello": "1fr",
};

/** 
 * labelFor: convierte el identificador en snake_case a una etiqueta legible.
 * También corrige algunas palabras con tildes.
 */
function labelFor(z) {
  let s = String(z).replaceAll("_", " ");
  s = s.replace(/\bmuneca\b/gi, "muñeca");
  s = s.replace(/\barticulacion\b/gi, "articulación");
  s = s.replace(/\btorax\b/gi, "tórax");
  return s;
}

/**
 * BodyZonesSelect:
 * Componente reutilizable para seleccionar una o varias zonas del cuerpo.
 * Props:
 *   - value: array de zonas seleccionadas (snake_case)
 *   - onChange: callback que recibe el nuevo array de zonas seleccionadas
 *   - title: texto opcional que se muestra arriba del componente
 *   - defaultOpen: nombre del grupo que aparecerá desplegado por defecto
 */
export default function BodyZonesSelect({
  value = [],
  onChange,
  title = null,
  defaultOpen = null, // todo cerrado por defecto
}) {
  // safeValue: filtramos el value para asegurarnos de que solo haya zonas válidas
  const safeValue = useMemo(
    () => (Array.isArray(value) ? value.filter((z) => BODY_ZONES.includes(z)) : []),
    [value]
  );

  // groups: convertimos el objeto GROUPS en array de [nombreGrupo, zonas]
  // Esto solo se calcula una vez porque la dependencia es un array vacío
  const groups = useMemo(() => Object.entries(GROUPS), []);

  // toggle: añade o quita una zona del conjunto seleccionado
  const toggle = (zone) => {
    const s = new Set(safeValue); // Set para poder añadir/quitar fácilmente
    s.has(zone) ? s.delete(zone) : s.add(zone);
    onChange(Array.from(s)); // devolvemos un array actualizado al padre
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {/* Título opcional del bloque completo */}
      {title && <label style={{ fontWeight: 500, marginBottom: 2 }}>{title}</label>}

      {/* Recorremos cada grupo (Cabeza y cuello, Tronco, etc.) */}
      {groups.map(([group, zones]) => (
        <details
          key={group}
          // Si viene defaultOpen, solo ese grupo aparece desplegado inicialmente
          open={defaultOpen ? (group === defaultOpen) : undefined}
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {/* Cabecera del grupo, clickable para desplegar/plegar */}
          <summary
            style={{
              listStyle: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              margin: 0,
              cursor: "pointer",
              fontWeight: 500,
              background: "transparent",
              border: "none",
            }}
          >
            <span>{group}</span>
            {/* Flechita indicadora de desplegable */}
            <span aria-hidden style={{ fontSize: 12, opacity: 0.7 }}>▾</span>
          </summary>

          {/* Contenedor de las checkboxes de ese grupo */}
          <div
            style={{
              padding: "8px 12px 12px",
              display: "grid",
              // Usamos plantilla personalizada si existe, si no una grid responsive por defecto
              gridTemplateColumns:
                GRID_TEMPLATES[group] || "repeat(auto-fill, minmax(210px, 1fr))",
              gap: 10,
              alignItems: "start",
            }}
          >
            {/* Pintamos una checkbox por cada zona del grupo */}
            {zones.map((z) => (
              <label
                key={z}
                style={{
                  display: "grid",
                  gridTemplateColumns: "18px 1fr",
                  alignItems: "start",
                  columnGap: 8,
                  lineHeight: 1.25,
                  fontWeight: 400,
                }}
              >
                <input
                  type="checkbox"
                  checked={safeValue.includes(z)} // checked si está en la selección
                  onChange={() => toggle(z)}       // alterna selección al hacer clic
                  style={{ width: 16, height: 16, marginTop: 2 }}
                />
                <span
                  style={{
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                >
                  {/* Texto legible para el usuario */}
                  {labelFor(z)}
                </span>
              </label>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
