import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
// import { requireRole } from '../middleware/rbac.js'; // si lo tienes, úsalo para limitar creación/edición a admin
import { Vacation } from '../models/Vacation.js';
import { Fisio } from '../models/Fisio.js';

const router = Router();

/**
 * GET /api/vacations
 * - Admin: lista de todas las vacaciones (opcionalmente por rango ?from=YYYY-MM-DD&to=YYYY-MM-DD)
 * - Fisio: también puede ver todas (lectura) para ver el calendario global
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { from, to, fisioId } = req.query;

    const filter = {};
    if (fisioId) filter.fisio = fisioId;
    if (from || to) {
      filter.$and = [];
      if (from) filter.$and.push({ endDate:   { $gte: new Date(from) } });
      if (to)   filter.$and.push({ startDate: { $lte: new Date(to) } });
      if (!filter.$and.length) delete filter.$and;
    }

    const rows = await Vacation.find(filter).populate('fisio', 'nombre apellidos email').lean();
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message || 'Error listando vacaciones' });
  }
});

/**
 * GET /api/fisios/:fisioId/vacations
 * Lista las vacaciones de un fisio
 */
router.get('/fisios/:fisioId', requireAuth, async (req, res) => {
  try {
    const { fisioId } = req.params;
    const rows = await Vacation.find({ fisio: fisioId }).lean();
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message || 'Error listando vacaciones del fisio' });
  }
});

/**
 * POST /api/fisios/:fisioId/vacations
 * body: { startDate, endDate, title?, color? }
 * (recomendado: restringir a admin con requireRole('admin'))
 */
router.post('/fisios/:fisioId', requireAuth, /*requireRole('admin'),*/ async (req, res) => {
  try {
    const { fisioId } = req.params;
    const { startDate, endDate, title, color } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ ok: false, error: 'startDate y endDate son obligatorios' });
    }
    const fisio = await Fisio.findById(fisioId);
    if (!fisio) return res.status(404).json({ ok: false, error: 'Fisio no encontrado' });

    const row = await Vacation.create({
      fisio: fisioId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      title: title?.trim() || 'Vacaciones',
      color: color || '',
      createdBy: req.user?._id,
    });

    res.status(201).json({ ok: true, data: row });
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message || 'Error creando vacaciones' });
  }
});

/**
 * DELETE /api/fisios/:fisioId/vacations/:vacId
 * (recomendado: solo admin)
 */
router.delete('/fisios/:fisioId/:vacId', requireAuth, /*requireRole('admin'),*/ async (req, res) => {
  try {
    const { fisioId, vacId } = req.params;
    const found = await Vacation.findOne({ _id: vacId, fisio: fisioId });
    if (!found) return res.status(404).json({ ok: false, error: 'Registro no encontrado' });

    await Vacation.deleteOne({ _id: vacId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message || 'Error eliminando vacaciones' });
  }
});

export default router;
