// client/src/components/appointments/BodyZonesSelect.jsx
import { useMemo } from "react";
import BODY_ZONES from "../../constants/bodyZones.js";

/** Grupos usando los valores exactos del enum (snake_case) */
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

/** Plantillas de columnas por grupo */
const GRID_TEMPLATES = {
  "Cabeza y cuello": "repeat(2, minmax(220px, 1fr))", // 2 columnas fijas (2+2)
};

/** Etiqueta visible a partir de snake_case */
function labelFor(z) {
  let s = String(z).replaceAll("_", " ");
  s = s.replace(/\bmuneca\b/gi, "muñeca");
  s = s.replace(/\barticulacion\b/gi, "articulación");
  s = s.replace(/\btorax\b/gi, "tórax");
  return s;
}

export default function BodyZonesSelect({
  value = [],
  onChange,
  title = null,
  defaultOpen = null, // todo cerrado por defecto
}) {
  const safeValue = useMemo(
    () => (Array.isArray(value) ? value.filter((z) => BODY_ZONES.includes(z)) : []),
    [value]
  );

  const groups = useMemo(() => Object.entries(GROUPS), []);

  const toggle = (zone) => {
    const s = new Set(safeValue);
    s.has(zone) ? s.delete(zone) : s.add(zone);
    onChange(Array.from(s));
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {title && <label style={{ fontWeight: 500, marginBottom: 2 }}>{title}</label>}

      {groups.map(([group, zones]) => (
        <details
          key={group}
          open={defaultOpen ? (group === defaultOpen) : undefined}
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
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
            <span aria-hidden style={{ fontSize: 12, opacity: 0.7 }}>▾</span>
          </summary>

          <div
            style={{
              padding: "8px 12px 12px",
              display: "grid",
              gridTemplateColumns:
                GRID_TEMPLATES[group] || "repeat(auto-fill, minmax(210px, 1fr))",
              gap: 10,
              alignItems: "start",
            }}
          >
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
                  checked={safeValue.includes(z)}
                  onChange={() => toggle(z)}
                  style={{ width: 16, height: 16, marginTop: 2 }}
                />
                <span
                  style={{
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                >
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
