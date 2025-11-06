import { Router } from "express";
import Seguimiento from "../models/Seguimiento.js";
import BODY_ZONES from "../constants/bodyZones.js";

const router = Router();

function parseRange(range) {
  const now = new Date();
  let from;
  if (range === "week") {
    from = new Date(now); from.setDate(now.getDate() - 7);
  } else if (range === "half") {
    from = new Date(now); from.setMonth(now.getMonth() - 6);
  } else {
    // "quarter" por defecto
    from = new Date(now); from.setMonth(now.getMonth() - 3);
  }
  return { from, to: now };
}

/**
 * GET /api/analytics/body-zones?range=week|quarter|half
 *     (opcional) from=YYYY-MM-DD  to=YYYY-MM-DD
 * Devuelve: { from, to, data: [{ zone, count }] }
 */
router.get("/body-zones", async (req, res) => {
  try {
    const { range, from: f, to: t } = req.query;
    let { from, to } = parseRange(range);
    if (f) from = new Date(`${f}T00:00:00.000Z`);
    if (t) to   = new Date(`${t}T23:59:59.999Z`);

    const pipeline = [
      { $match: { fecha: { $gte: from, $lte: to } } },
      { $unwind: "$bodyZones" },
      { $match: { bodyZones: { $in: BODY_ZONES } } },
      { $group: { _id: "$bodyZones", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ];

    const rows = await Seguimiento.aggregate(pipeline);
    res.json({
      from, to,
      data: rows.map(r => ({ zone: r._id, count: r.count }))
    });
  } catch (err) {
    console.error("[GET /analytics/body-zones]", err);
    res.status(500).json({ error: "No se pudo generar la analítica" });
  }
});

export default router;
