// client/src/pages/AnaliticaDolencias.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../api";

// Recharts
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell
} from "recharts";

export default function AnaliticaDolencias() {
  const [range, setRange] = useState("quarter"); // week | quarter | half
  const [data, setData] = useState([]);          // [{ zone, count }]
  const [fromTo, setFromTo] = useState({ from: null, to: null });
  const [loading, setLoading] = useState(false);

  async function load(rg = range) {
    setLoading(true);
    try {
      const res = await api.get(`/api/analytics/body-zones?range=${rg}`);
      const payload = res.data || {};
      const rows = (payload.data || []).sort((a, b) => b.count - a.count);
      setData(rows);
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

  // Colores consistentes para barras y porciones
  const colors = [
    "#4c78a8", "#f58518", "#54a24b", "#e45756", "#72b7b2",
    "#f2cf5b", "#b279a2", "#ff9da6", "#9d755d", "#bab0ac"
  ];

  // Datos con etiqueta legible
  const dataPretty = useMemo(
    () => data.map((d) => ({ ...d, label: String(d.zone).replaceAll("_", " ") })),
    [data]
  );

  return (
    <main className="container" style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1 className="page-title" style={{ marginBottom: 8 }}>ANALÍTICA DE DOLENCIAS</h1>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <label>Rango:</label>
        <select
          value={range}
          onChange={(e) => { setRange(e.target.value); load(e.target.value); }}
        >
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

      {loading ? (
        <p>Cargando…</p>
      ) : (
        <>
          {/* ===== GRÁFICO DE BARRAS (Recharts) ===== */}
          <section style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Barras</h3>
            {dataPretty.length === 0 ? (
              <p style={{ opacity: 0.7 }}>Sin datos.</p>
            ) : (
              <div style={{ width: "100%", height: Math.max(260, 40 * dataPretty.length) }}>
                <ResponsiveContainer width="100%" height="100%">
                  {/* De lado para labels largos: layout vertical (y=labels) */}
                  <BarChart
                    data={dataPretty}
                    layout="vertical"
                    margin={{ top: 8, right: 24, left: 24, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={180}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Casos">
                      {dataPretty.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* ===== GRÁFICO CIRCULAR (Recharts) ===== */}
          <section
            style={{
              background: "var(--panel)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Circular</h3>
            {total === 0 ? (
              <p style={{ opacity: 0.7 }}>Sin datos.</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(280px, 420px) 1fr",
                  gap: 16,
                  alignItems: "center",
                }}
              >
                {/* ==== Donut ==== */}
                <div style={{ width: "100%", height: 340 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 16, right: 30, bottom: 16, left: 30 }}>
                      <Tooltip formatter={(v) => [`${v}`, "Casos"]} />
                      {/* ❌ Eliminamos <Legend /> */}
                      <Pie
                        data={dataPretty}
                        dataKey="count"
                        nameKey="label"
                        outerRadius={120}
                        innerRadius={70}
                        labelLine={false}
                        label={({ value }) => value} // solo número dentro
                      >
                        {dataPretty.map((_, i) => (
                          <Cell key={`slice-${i}`} fill={colors[i % colors.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* ==== Leyenda personalizada ==== */}
                <ul
                  style={{
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    display: "grid",
                    gap: 6,
                  }}
                >
                  {dataPretty.map((d, i) => {
                    const pct = total ? Math.round((d.count * 100) / total) : 0;
                    return (
                      <li
                        key={d.zone}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 14,
                        }}
                      >
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            background: colors[i % colors.length],
                            borderRadius: 2,
                            display: "inline-block",
                          }}
                        />
                        <span style={{ flex: 1 }}>{d.label}</span>
                        <span style={{ opacity: 0.8 }}>{d.count} · {pct}%</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>


          {/* ===== TABLA ===== */}
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
                {dataPretty.length === 0 ? (
                  <tr><td colSpan={2} style={{ padding: 12, opacity: 0.7 }}>Sin datos.</td></tr>
                ) : dataPretty.map((row) => (
                  <tr key={row.zone}>
                    <td style={{ padding: "8px 0" }}>{row.label}</td>
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
