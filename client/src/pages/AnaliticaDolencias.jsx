import { useEffect, useMemo, useState } from "react";
import api from "../api";

// Helpers para el pastel (SVG)
function arcPath(cx, cy, r, startAngle, endAngle) {
  const rad = (deg) => (deg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(startAngle));
  const y1 = cy + r * Math.sin(rad(startAngle));
  const x2 = cx + r * Math.cos(rad(endAngle));
  const y2 = cy + r * Math.sin(rad(endAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

export default function AnaliticaDolencias() {
  const [range, setRange] = useState("quarter"); // week | quarter | half
  const [data, setData] = useState([]);
  const [fromTo, setFromTo] = useState({ from: null, to: null });
  const [loading, setLoading] = useState(false);

  async function load(rg = range) {
    setLoading(true);
    try {
      const res = await api.get(`/api/analytics/body-zones?range=${rg}`);
      const payload = res.data || {};
      setData((payload.data || []).sort((a, b) => b.count - a.count));
      setFromTo({ from: payload.from, to: payload.to });
    } catch (e) {
      console.error(e);
      alert("No se pudo cargar la analítica");
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const total = useMemo(
    () => data.reduce((s, d) => s + (d.count || 0), 0),
    [data]
  );
  const maxCount = useMemo(
    () => data.reduce((m, d) => Math.max(m, d.count || 0), 0),
    [data]
  );

  // Paleta discreta para el pastel/barras (SVG, sin deps)
  const colors = [
    "#4c78a8","#f58518","#54a24b","#e45756","#72b7b2",
    "#f2cf5b","#b279a2","#ff9da6","#9d755d","#bab0ac"
  ];

  return (
    <main className="container" style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1 className="page-title" style={{ marginBottom: 8 }}>ANALÍTICA DE DOLENCIAS</h1>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <label>Rango:</label>
        <select value={range} onChange={(e) => { setRange(e.target.value); load(e.target.value); }}>
          <option value="week">Últimos 7 días</option>
          <option value="quarter">Últimos 3 meses</option>
          <option value="half">Últimos 6 meses</option>
        </select>
        {fromTo.from && fromTo.to && (
          <small style={{ opacity: 0.8 }}>
            {new Date(fromTo.from).toLocaleDateString()} — {new Date(fromTo.to).toLocaleDateString()}
          </small>
        )}
      </div>

      {loading ? (<p>Cargando…</p>) : (
        <>
          {/* GRÁFICO DE BARRAS */}
          <section style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Barras</h3>
            {data.length === 0 ? (
              <p style={{ opacity: 0.7 }}>Sin datos.</p>
            ) : (
              <svg width="100%" height={Math.max(140, 30 * data.length)} viewBox={`0 0 900 ${30 * data.length}`}>
                {data.map((d, i) => {
                  const label = String(d.zone).replaceAll("_", " ");
                  const w = maxCount ? (d.count / maxCount) * 650 : 0;
                  const y = i * 30 + 8;
                  const color = colors[i % colors.length];
                  return (
                    <g key={d.zone} transform={`translate(200, ${y})`}>
                      <rect x="0" y="0" width={w} height="16" fill={color} rx="4" />
                      <text x="-8" y="12" textAnchor="end" style={{ fontSize: 12, fill: "var(--text)" }}>
                        {label}
                      </text>
                      <text x={w + 8} y="12" style={{ fontSize: 12, fill: "var(--muted)" }}>
                        {d.count}
                      </text>
                    </g>
                  );
                })}
                {/* eje base */}
                <line x1="200" y1="2" x2="200" y2={30 * data.length} stroke="var(--border)"/>
              </svg>
            )}
          </section>

          {/* GRÁFICO CIRCULAR (PASTEL) */}
          <section style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Circular</h3>
            {total === 0 ? (
              <p style={{ opacity: 0.7 }}>Sin datos.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, alignItems: "center" }}>
                <svg width="320" height="320" viewBox="0 0 320 320">
                  {(() => {
                    const cx = 160, cy = 160, r = 120;
                    let acc = 0;
                    return data.map((d, i) => {
                      const frac = (d.count || 0) / total;
                      const angle = frac * 360;
                      const path = arcPath(cx, cy, r, acc, acc + angle);
                      acc += angle;
                      return <path key={d.zone} d={path} fill={colors[i % colors.length]} stroke="var(--surface)" strokeWidth="1"/>;
                    });
                  })()}
                  {/* agujero para donut (opcional): */}
                  {/* <circle cx="160" cy="160" r="70" fill="var(--surface)"/> */}
                </svg>

                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
                  {data.map((d, i) => {
                    const pct = total ? Math.round((d.count * 100) / total) : 0;
                    return (
                      <li key={d.zone} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 12, height: 12, background: colors[i % colors.length], borderRadius: 2, display: "inline-block" }} />
                        <span style={{ flex: 1 }}>{String(d.zone).replaceAll("_", " ")}</span>
                        <span style={{ opacity: 0.8 }}>{d.count} · {pct}%</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>

          {/* TABLA */}
          <section style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Detalle</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: "6px 0" }}>Zona</th>
                  <th style={{ textAlign: "right", borderBottom: "1px solid var(--border)", padding: "6px 0" }}>Casos</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={2} style={{ padding: 12, opacity: 0.7 }}>Sin datos.</td></tr>
                ) : data.map((row) => (
                  <tr key={row.zone}>
                    <td style={{ padding: "8px 0" }}>{String(row.zone).replaceAll("_"," ")}</td>
                    <td style={{ padding: "8px 0", textAlign: "right" }}>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  );
}
