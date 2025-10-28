import { Router } from 'express';
import { Vacation } from '../models/Vacation.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// 🔸 utilidades
function normalizeDate(d) {
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? null : x;
}

function canDelete(user, vacation) {
  if (user.role === 'admin') return true;
  return String(vacation.fisio) === String(user.id);
}

/**
 * GET /api/vacations
 * - Devuelve todas las vacaciones (admin y fisio)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const items = await Vacation.find({})
      .populate('fisio', 'nombre apellidos email telefono')
      .sort({ startDate: -1 })
      .lean();

    const mapped = items.map(v => ({
      ...v,
      my: String(v.fisio?._id) === String(req.user.id),
    }));

    res.json({ ok: true, data: mapped });
  } catch (err) {
    console.error('GET /vacations', err);
    res.status(500).json({ ok: false, error: 'Error al listar vacaciones' });
  }
});

/**
 * POST /api/vacations
 * Admin puede crear para cualquier fisio (con fisioId)
 * Fisio crea solo las suyas
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, notes, title, color, fisioId } = req.body;
    const start = normalizeDate(startDate);
    const end = normalizeDate(endDate);
    if (!start || !end) return res.status(400).json({ ok: false, error: 'Fechas inválidas' });
    if (start > end) return res.status(400).json({ ok: false, error: 'Fecha inicio posterior a fin' });

    let fisio = req.user.id;
    if (req.user.role === 'admin' && fisioId) {
      fisio = fisioId;
    }

    // evitar solapes del mismo fisio
    const overlap = await Vacation.findOne({
      fisio,
      $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }],
    }).lean();
    if (overlap) {
      return res.status(409).json({ ok: false, error: 'Rango solapado para ese fisioterapeuta' });
    }

    const newVac = await Vacation.create({
      fisio,
      title: title || 'Vacaciones',
      startDate: start,
      endDate: end,
      color: color || '',
      notes: notes || '',
    });

    const populated = await newVac.populate('fisio', 'nombre apellidos email telefono');
    res.status(201).json({ ok: true, data: populated });
  } catch (err) {
    console.error('POST /vacations', err);
    res.status(500).json({ ok: false, error: 'Error al crear vacaciones' });
  }
});

/**
 * DELETE /api/vacations/:id
 * - Admin puede eliminar cualquiera
 * - Fisio solo las suyas
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const vac = await Vacation.findById(req.params.id);
    if (!vac) return res.status(404).json({ ok: false, error: 'No encontrado' });

    if (!canDelete(req.user, vac)) {
      return res.status(403).json({ ok: false, error: 'No autorizado' });
    }

    await Vacation.deleteOne({ _id: vac._id });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /vacations/:id', err);
    res.status(500).json({ ok: false, error: 'Error al eliminar vacaciones' });
  }
});

export default router;
