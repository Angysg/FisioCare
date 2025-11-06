// client/src/components/appointments/BodyZonesSelect.jsx
import { useMemo } from "react";

const GROUPS = {
  "Cabeza y cuello": [
    "cabeza","art temporomandibular","cara","cuello","columna cervical",
  ],
  "Tronco": [
    "columna dorsal","columna lumbar","torax dcho","torax izq","abdomen","pelvis",
  ],
  "Miembro superior (MMSS)": [
    "hombro dcho","hombro izq","brazo sup ant dcho","brazo sup pos dcho",
    "brazo sup ant izq","brazo sup pos izq","antebrazo dcho","antebrazo izq",
    "codo dcho","codo izq","muñeca dcha","muñeca izq","dedos manos",
  ],
  "Miembro inferior (MMII)": [
    "ingle dcha","ingle izq","cadera dcha","cadera izq","gluteo dcho","gluteo izq",
    "pierna sup pos dcha","pierna sup ant dcha","pierna sup pos izq","pierna sup ant izq",
    "pierna inf dcha","pierna inf izq","rodilla dcha","rodilla izq",
    "tobillo dcho","tobillo izq","pie dcho","pie izq","dedos pies",
  ],
};

export default function BodyZonesSelect({
  value = [],
  onChange,
  title = null,
  defaultOpen = "Tronco",
}) {
  const groups = useMemo(() => Object.entries(GROUPS), []);

  const toggle = (zone) => {
    const s = new Set(value);
    s.has(zone) ? s.delete(zone) : s.add(zone);
    onChange(Array.from(s));
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {title && <label style={{ fontWeight: 500, marginBottom: 2 }}>{title}</label>}

      {groups.map(([group, zones]) => (
        <details
          key={group}
          open={group === defaultOpen}
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
              boxShadow: "none",
              outline: "none",
            }}
          >
            <span>{group}</span>
            <span aria-hidden style={{ fontSize: 12, opacity: 0.7 }}>▾</span>
          </summary>

          {/* ======== BLOQUE CAMBIADO: rejilla estable y cada opción con 2 columnas ======== */}
          <div
            style={{
              padding: "8px 12px 12px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
              gap: 10,
              alignItems: "start",
            }}
          >
            {zones.map((z) => (
              <label
                key={z}
                style={{
                  display: "grid",
                  gridTemplateColumns: "18px 1fr", // checkbox | texto
                  alignItems: "start",
                  columnGap: 8,
                  lineHeight: 1.25,
                  fontWeight: 400,
                }}
              >
                <input
                  type="checkbox"
                  checked={value.includes(z)}
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
                  {z.replaceAll("_", " ")}
                </span>
              </label>
            ))}
          </div>
          {/* ========================================================================= */}
        </details>
      ))}
    </div>
  );
}
