// client/src/pages/AnaliticaDolencias.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../api";

// Recharts
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// === Helper para abreviar números en el eje X: 1200 -> 1.2k, 1_200_000 -> 1.2M ===
function formatShortNumber(value) {
  if (value == null) return "";
  if (value < 1000) return String(value);
  if (value < 1_000_000) {
    const v = value / 1000;
    return (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + "k";
  }
  const v = value / 1_000_000;
  return (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + "M";
}

export default function AnaliticaDolencias() {
  const [range, setRange] = useState("quarter"); // week | month | quarter | half | year | 2024 | 2025 | all
  const [data, setData] = useState([]); // [{ zone, count }]
  const [fromTo, setFromTo] = useState({ from: null, to: null });
  const [loading, setLoading] = useState(false);

  async function load(rg = range) {
    setLoading(true);
    try {
      const res = await api.get(`/api/analytics/body-zones?range=${rg}`);
      const payload = res.data || {};
      const rows = (payload.data || []).sort((a, b) => b.count - a.count);
      setData(rows);
      setFromTo({
        from: payload.from || null,
        to: payload.to || null,
      });
    } catch (e) {
      console.error(e);
      alert("No se pudo cargar la analítica");
      setData([]);
      setFromTo({ from: null, to: null });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = useMemo(
    () => data.reduce((s, d) => s + (d.count || 0), 0),
    [data]
  );

  const colors = [
    "#4c78a8",
    "#f58518",
    "#54a24b",
    "#e45756",
    "#72b7b2",
    "#f2cf5b",
    "#b279a2",
    "#ff9da6",
    "#9d755d",
    "#bab0ac",
  ];

  // Datos con etiqueta legible
  const dataPretty = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        label: String(d.zone || "").replaceAll("_", " "),
      })),
    [data]
  );

  return (
    <main
      className="container"
      style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}
    >
      <h1 className="page-title" style={{ marginBottom: 8 }}>
        GRÁFICOS ZONAS DE DOLOR
      </h1>

      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <label>Rango:</label>
        <select
          value={range}
          onChange={(e) => {
            const v = e.target.value;
            setRange(v);
            load(v);
          }}
        >
          <option value="week">Últimos 7 días</option>
          <option value="month">Últimos 30 días</option>
          <option value="quarter">Últimos 3 meses</option>
          <option value="half">Últimos 6 meses</option>
          <option value="year">Últimos 12 meses</option>
          <option value="2024">Año 2024</option>
          <option value="2025">Año 2025</option>
          <option value="all">Todo el histórico</option>
        </select>

        {fromTo.from && fromTo.to && (
          <small style={{ opacity: 0.8 }}>
            {new Date(fromTo.from).toLocaleDateString()} —{" "}
            {new Date(fromTo.to).toLocaleDateString()}
          </small>
        )}
      </div>

      {loading ? (
        <p>Cargando…</p>
      ) : (
        <>
          {/* ===== GRÁFICO DE BARRAS ===== */}
          <section
            style={{
              background: "var(--panel)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Barras</h3>
            {dataPretty.length === 0 ? (
              <p style={{ opacity: 0.7 }}>Sin datos.</p>
            ) : (
              <div
                style={{
                  width: "100%",
                  height: Math.max(260, 40 * dataPretty.length),
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dataPretty}
                    layout="vertical"
                    margin={{ top: 8, right: 24, left: 24, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tickFormatter={formatShortNumber} // 🔹 1) abreviamos valores
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={180}
                    />
                    <Tooltip
                      // mostramos en el tooltip el valor "real", sin abreviar
                      formatter={(value) => [value, "Casos"]}
                    />
                    <Bar
                      dataKey="count"
                      name="Casos"
                      isAnimationActive={true} // 🔹 2) animación barras
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {dataPretty.map((_, i) => (
                        <Cell
                          key={`cell-bar-${i}`}
                          fill={colors[i % colors.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* ===== GRÁFICO CIRCULAR ===== */}
          <section
            style={{
              background: "var(--panel)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 32,
              marginBottom: 16,
            }}
          >
            <h3 style={{ marginTop: 0, textAlign: "center" }}>Circular</h3>

            {total === 0 ? (
              <p style={{ opacity: 0.7, textAlign: "center" }}>Sin datos.</p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 40,
                }}
              >
                {/* --- GRÁFICO --- */}
                <div
                  style={{
                    width: "100%",
                    maxWidth: 900,
                    height: 630,
                    margin: "0 auto",
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dataPretty}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={290}
                        labelLine={false}
                        isAnimationActive={true}      // 🔹 2) animación pastel
                        animationDuration={800}
                        animationEasing="ease-out"
                      >
                        {dataPretty.map((_, i) => (
                          <Cell
                            key={`cell-pie-${i}`}
                            fill={colors[i % colors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* --- LISTADO CENTRADO --- */}
                <div
                  style={{
                    width: "100%",
                    maxWidth: 850,
                    margin: "0 auto",
                    textAlign: "left",
                  }}
                >
                  <p
                    style={{
                      marginBottom: 50,
                      textAlign: "center",
                      fontSize: "1.4rem", // título grande
                      fontWeight: 300,
                    }}
                  >
                    Total de casos:{" "}
                    <strong style={{ fontSize: "1.4rem" }}>{total}</strong>
                  </p>

                  <ul
                    style={{
                      margin: "0 auto",
                      paddingLeft: 0,
                      listStyle: "none",
                      columnCount: 2,
                      columnGap: 50,
                      maxWidth: 850,
                    }}
                  >
                    {dataPretty.map((row, i) => (
                      <li
                        key={row.zone || i}
                        style={{
                          breakInside: "avoid",
                          marginBottom: 8,
                          fontSize: "1rem",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: 14,
                            height: 14,
                            borderRadius: 999,
                            backgroundColor: colors[i % colors.length],
                          }}
                        />
                        {row.label}: <strong>{row.count}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
