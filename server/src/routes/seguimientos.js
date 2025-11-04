import { Router } from "express";
import mongoose from "mongoose";
import Seguimiento from "../models/Seguimiento.js";

// Pacientes
import * as PacienteMod from "../models/Paciente.js";
const Paciente = PacienteMod.default || PacienteMod.Paciente;

// Fisios (colección fisios)
import * as FisioMod from "../models/Fisio.js";
const Fisio = FisioMod.default || FisioMod.Fisio;

const router = Router();

/* ============ utils ============ */
async function resolverPacienteIdDesdeTexto(pacienteId, pacienteNombre) {
  if (pacienteId) return pacienteId;

  const texto = (pacienteNombre || "").trim();
  if (!texto) return null;

  // Email exacto
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(texto)) {
    const byEmail = await Paciente.findOne({ email: new RegExp("^" + texto + "$", "i") })
      .select("_id")
      .lean();
    if (byEmail?._id) return byEmail._id;
  }

  // Nombre + apellidos
  const parts = texto.split(/\s+/).filter(Boolean);
  if (parts.length >= 1) {
    const nombrePrimero = parts[0];
    const apellidosResto = parts.slice(1).join(" ");

    const rNombre = new RegExp("^" + nombrePrimero.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const cond = [{ nombre: rNombre }];
    if (apellidosResto) {
      const rApe = new RegExp(apellidosResto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      cond.push({ apellidos: rApe });
    }

    const byName = await Paciente.findOne({ $and: cond }).select("_id").lean();
    if (byName?._id) return byName._id;

    const rFull = new RegExp("^" + texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i");
    const candidats = await Paciente.find({
      $or: [{ nombre: rFull }, { apellidos: rFull }, { email: rFull }],
    })
      .select("_id nombre apellidos email")
      .lean();
    if (candidats?.[0]?._id) return candidats[0]._id;
  }

  return null;
}

function toDateOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

/* ============ RUTAS ============ */

/** LISTAR */
router.get("/", async (req, res) => {
  try {
    const {
      q = "",
      pacienteId,
      fisioId,
      from,
      to,
      page = 1,
      limit = 50,
      sort = "date",
    } = req.query;

    const find = {};
    if (from || to) {
      find.fecha = {};
      if (from) find.fecha.$gte = new Date(from + "T00:00:00.000Z");
      if (to) find.fecha.$lte = new Date(to + "T23:59:59.999Z");
    }
    if (pacienteId) find.paciente = pacienteId;
    if (fisioId) find.fisio = fisioId;

    if (q && q.trim().length >= 2) {
      const r = new RegExp(q.trim(), "i");

      const pacientesIds = await Paciente.find({
        $or: [{ nombre: r }, { apellidos: r }, { email: r }],
      })
        .select("_id")
        .lean();

      // Buscar también en "fisios" (NO en users)
      const fisiosIds = await Fisio.find({
        $or: [{ nombre: r }, { apellidos: r }, { email: r }],
      })
        .select("_id")
        .lean();

      const pIds = pacientesIds.map((x) => x._id);
      const fIds = fisiosIds.map((x) => x._id);

      find.$or = [{ pacienteNombre: r }, { comentario: r }];
      if (pIds.length) find.$or.push({ paciente: { $in: pIds } });
      if (fIds.length) find.$or.push({ fisio: { $in: fIds } });
    }

    const sortObj = sort === "date" ? { fecha: -1, _id: -1 } : { createdAt: -1, _id: -1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Seguimiento.find(find)
        .populate("paciente", "nombre apellidos email")
        .populate("fisio", "nombre apellidos email") // <- Fisio
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Seguimiento.countDocuments(find),
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum });
  } catch (e) {
    console.error("[GET /seguimientos] Error:", e);
    res.status(500).json({ error: e.message || "No se pudieron listar los seguimientos" });
  }
});

/** DETALLE */
router.get("/:id", async (req, res) => {
  try {
    const s = await Seguimiento.findById(req.params.id)
      .populate("paciente", "nombre apellidos email")
      .populate("fisio", "nombre apellidos email")
      .lean();
    if (!s) return res.status(404).json({ error: "No encontrado" });
    res.json({ data: s });
  } catch (e) {
    console.error("[GET /seguimientos/:id] Error:", e);
    res.status(500).json({ error: e.message || "No se pudo obtener el seguimiento" });
  }
});

/** CREAR */
router.post("/", async (req, res) => {
  try {
    let { pacienteId, pacienteNombre, fisioId, fecha, comentario } = req.body;

    if (!fisioId) return res.status(400).json({ error: "Falta 'fisioId'." });
    if (!fecha) return res.status(400).json({ error: "Falta 'fecha'." });
    if (!pacienteId && !pacienteNombre)
      return res.status(400).json({ error: "Debes indicar 'pacienteNombre' o 'pacienteId'." });

    if (!mongoose.isValidObjectId(fisioId)) {
      return res.status(400).json({ error: "El 'fisioId' no es un ObjectId válido." });
    }

    const fechaOk = toDateOrNull(fecha);
    if (!fechaOk) return res.status(400).json({ error: "La 'fecha' no es válida." });

    const resolvedPacienteId = await resolverPacienteIdDesdeTexto(pacienteId, pacienteNombre);

    const created = await Seguimiento.create({
      paciente: resolvedPacienteId || undefined,
      pacienteNombre: pacienteNombre || undefined,
      fisio: fisioId, // <- guarda id de Fisio
      fecha: fechaOk,
      comentario: comentario || "",
    });

    const data = await Seguimiento.findById(created._id)
      .populate("paciente", "nombre apellidos email")
      .populate("fisio", "nombre apellidos email")
      .lean();

    res.status(201).json({ data });
  } catch (e) {
    const isValidation =
      e?.name === "ValidationError" ||
      String(e?.message || "").toLowerCase().includes("validation");
    console.error("[POST /seguimientos] Error:", e);
    res.status(isValidation ? 400 : 500).json({
      error: e.message || "No se pudo crear el seguimiento",
    });
  }
});

/** ACTUALIZAR */
router.put("/:id", async (req, res) => {
  try {
    const { pacienteId, pacienteNombre, fisioId, fecha, comentario } = req.body;
    const update = {};

    const resolvedPacienteId = await resolverPacienteIdDesdeTexto(pacienteId, pacienteNombre);
    if (pacienteNombre !== undefined) update.pacienteNombre = pacienteNombre || undefined;
    if (resolvedPacienteId !== null) update.paciente = resolvedPacienteId || undefined;

    if (fisioId) {
      if (!mongoose.isValidObjectId(fisioId))
        return res.status(400).json({ error: "El 'fisioId' no es un ObjectId válido." });
      update.fisio = fisioId; // <- Fisio
    }

    if (fecha) {
      const fechaOk = toDateOrNull(fecha);
      if (!fechaOk) return res.status(400).json({ error: "La 'fecha' no es válida." });
      update.fecha = fechaOk;
    }

    if (comentario !== undefined) update.comentario = comentario;

    const doc = await Seguimiento.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate("paciente", "nombre apellidos email")
      .populate("fisio", "nombre apellidos email");

    if (!doc) return res.status(404).json({ error: "No encontrado" });
    res.json({ data: doc });
  } catch (e) {
    console.error("[PUT /seguimientos/:id] Error:", e);
    res.status(500).json({ error: e.message || "No se pudo actualizar el seguimiento" });
  }
});

/** ELIMINAR */
router.delete("/:id", async (req, res) => {
  try {
    const r = await Seguimiento.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: "No encontrado" });
    res.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /seguimientos/:id] Error:", e);
    res.status(500).json({ error: e.message || "No se pudo eliminar el seguimiento" });
  }
});

export default router;
