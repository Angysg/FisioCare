// server/routes/analytics.js
import { Router } from "express";
import Seguimiento from "../models/Seguimiento.js";

const router = Router();

/**
 * Convierte "YYYY-MM-DD" en Date.
 * Si endOfDay = true, devuelve las 23:59:59.999 de ese día (UTC).
 */
function toDateFromYMD(value, endOfDay = false) {
  if (!value) return null;
  const [y, m, d] = String(value).split("-").map(Number);
  if (!y || !m || !d) return null;

  if (endOfDay) {
    return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
  }
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

/**
 * Calcula from/to a partir de:
 *  - range: week, month, quarter, half, year, 2024, 2025, all
 *  - o bien from/to libres (YYYY-MM-DD)
 */
function getDateRange({ range = "quarter", from, to }) {
  // Si vienen from/to manuales, tienen prioridad
  if (from || to) {
    const fromDate = from ? toDateFromYMD(from, false) : null;
    const toDate = to ? toDateFromYMD(to, true) : null;
    return { fromDate, toDate };
  }

  const now = new Date();

  const startOfTodayUtc = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0, 0, 0, 0
  ));
  const endOfTodayUtc = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    23, 59, 59, 999
  ));

  let fromDate = null;
  let toDate = endOfTodayUtc;

  switch (range) {
    case "week": {
      const d = new Date(startOfTodayUtc);
      d.setUTCDate(d.getUTCDate() - 7);
      fromDate = d;
      break;
    }
    case "month": {
      const d = new Date(startOfTodayUtc);
      d.setUTCMonth(d.getUTCMonth() - 1);
      fromDate = d;
      break;
    }
    case "quarter": {
      const d = new Date(startOfTodayUtc);
      d.setUTCMonth(d.getUTCMonth() - 3);
      fromDate = d;
      break;
    }
    case "half": {
      const d = new Date(startOfTodayUtc);
      d.setUTCMonth(d.getUTCMonth() - 6);
      fromDate = d;
      break;
    }
    case "year": {
      const d = new Date(startOfTodayUtc);
      d.setUTCFullYear(d.getUTCFullYear() - 1);
      fromDate = d;
      break;
    }
    case "2024": {
      fromDate = new Date(Date.UTC(2024, 0, 1, 0, 0, 0, 0));
      toDate   = new Date(Date.UTC(2024, 11, 31, 23, 59, 59, 999));
      break;
    }
    case "2025": {
      fromDate = new Date(Date.UTC(2025, 0, 1, 0, 0, 0, 0));
      toDate   = new Date(Date.UTC(2025, 11, 31, 23, 59, 59, 999));
      break;
    }
    case "all":
    default:
      fromDate = null;
      toDate = null;
      break;
  }

  return { fromDate, toDate };
}

/**
 * GET /api/analytics/body-zones
 * Respuesta:
 *  {
 *    from: Date | null,
 *    to:   Date | null,
 *    data: [{ zone: string, count: number }]
 *  }
 */
router.get("/body-zones", async (req, res) => {
  try {
    const { range = "quarter", from, to } = req.query;

    const { fromDate, toDate } = getDateRange({ range, from, to });

    const match = {};
    if (fromDate || toDate) {
      match.fecha = {};
      if (fromDate) match.fecha.$gte = fromDate;
      if (toDate)   match.fecha.$lte = toDate;
    }

    const rows = await Seguimiento.aggregate([
      { $match: match },
      { $unwind: "$bodyZones" },
      {
        $group: {
          _id: "$bodyZones",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const payload = {
      from: fromDate,
      to:   toDate,
      data: rows.map((r) => ({
        zone: r._id,
        count: r.count,
      })),
    };

    res.json(payload);
  } catch (e) {
    console.error("[GET /api/analytics/body-zones] Error:", e);
    res.status(500).json({ error: e.message || "No se pudo obtener la analítica" });
  }
});

export default router;
