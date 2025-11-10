// server/src/routes/analytics.js
import { Router } from "express";
import Seguimiento from "../models/Seguimiento.js";
import BODY_ZONES from "../constants/bodyZones.js";

const router = Router();

/**
 * Función auxiliar: determina el rango de fechas según el parámetro recibido.
 * - week   → últimos 7 días
 * - quarter → últimos 3 meses (valor por defecto)
 * - half   → últimos 6 meses
 */
function parseRange(range) {
  const now = new Date();
  let from;

  if (range === "week") {
    from = new Date(now);
    from.setDate(now.getDate() - 7);
  } else if (range === "half") {
    from = new Date(now);
    from.setMonth(now.getMonth() - 6);
  } else {
    // Si no se especifica o no coincide, por defecto últimos 3 meses
    from = new Date(now);
    from.setMonth(now.getMonth() - 3);
  }

  return { from, to: now };
}

/**
 * =======================
 *   RUTA: GET /api/analytics/body-zones
 * =======================
 * Devuelve un resumen de cuántos seguimientos hay por zona corporal,
 * dentro de un rango de fechas determinado.
 *
 * Parámetros:
 *   - range: "week" | "quarter" | "half"
 *   - from (opcional): fecha inicio (YYYY-MM-DD)
 *   - to   (opcional): fecha fin (YYYY-MM-DD)
 *
 * Respuesta:
 * {
 *   from: "2025-08-01T00:00:00.000Z",
 *   to: "2025-11-10T23:59:59.999Z",
 *   data: [
 *     { zone: "columna_lumbar", count: 5 },
 *     { zone: "hombro_dcho", count: 3 },
 *     ...
 *   ]
 * }
 *
 * Esta información la usa el frontend (React con Recharts)
 * para dibujar los gráficos de barras y pastel.
 */
router.get("/body-zones", async (req, res) => {
  try {
    const { range, from: f, to: t } = req.query;

    //Calculamos rango base según "range"
    let { from, to } = parseRange(range);

    // Si vienen fechas concretas (from/to), las usamos en lugar del rango automático
    if (f) from = new Date(`${f}T00:00:00.000Z`);
    if (t) to = new Date(`${t}T23:59:59.999Z`);

    // Pipeline de agregación de MongoDB
    // - Filtra seguimientos por fecha
    // - Descompone el array "bodyZones" en varios documentos
    // - Agrupa por nombre de zona
    // - Cuenta cuántas veces aparece cada una
    const pipeline = [
      { $match: { fecha: { $gte: from, $lte: to } } },
      { $unwind: "$bodyZones" },
      { $match: { bodyZones: { $in: BODY_ZONES } } },
      { $group: { _id: "$bodyZones", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ];

    // Ejecutamos la consulta
    const rows = await Seguimiento.aggregate(pipeline);

    // Formateamos la respuesta
    res.json({
      from: from.toISOString(),
      to: to.toISOString(),
      data: rows.map((r) => ({ zone: r._id, count: r.count })),
    });
  } catch (err) {
    // Si algo falla (error en base de datos, etc.)
    console.error("[GET /analytics/body-zones]", err);
    res.status(500).json({ error: "No se pudo generar la analítica" });
  }
});

export default router;
