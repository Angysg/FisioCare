// server/src/routes/analytics.js
import { Router } from "express";
import Seguimiento from "../models/Seguimiento.js";
import BODY_ZONES from "../constants/bodyZones.js";

const router = Router();

/**
 * =======================
 *   RUTA: GET /api/analytics/body-zones
 * =======================
 * Devuelve un resumen de cuántos seguimientos hay por zona corporal.
 *
 * SIN filtros de fecha: cuenta todo el histórico.
 *
 * Respuesta:
 * {
 *   data: [
 *     { zone: "columna_lumbar", count: 5 },
 *     { zone: "hombro_dcho", count: 3 },
 *     ...
 *   ]
 * }
 */
router.get("/body-zones", async (req, res) => {
  try {
    // Pipeline de agregación de MongoDB
    const pipeline = [
      // Solo documentos que tengan bodyZones y que no sea un array vacío
      { $match: { bodyZones: { $exists: true, $ne: [] } } },

      // Descompone el array "bodyZones" en varios documentos
      { $unwind: "$bodyZones" },

      // Nos aseguramos de que sea una zona válida del enum
      { $match: { bodyZones: { $in: BODY_ZONES } } },

      // Agrupa por nombre de zona y cuenta
      { $group: { _id: "$bodyZones", count: { $sum: 1 } } },

      // Orden descendente por número de casos
      { $sort: { count: -1 } },
    ];

    const rows = await Seguimiento.aggregate(pipeline);

    res.json({
      data: rows.map((r) => ({ zone: r._id, count: r.count })),
    });
  } catch (err) {
    console.error("[GET /analytics/body-zones]", err);
    res.status(500).json({ error: "No se pudo generar la analítica" });
  }
});

export default router;
