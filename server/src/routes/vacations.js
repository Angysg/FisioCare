import { Router } from 'express';
import { Vacation } from '../models/Vacation.js';
import { Fisio } from '../models/Fisio.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function normalizeDate(d) {
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? null : x;
}

// helper para query (?start&end) que arregla el '+' -> ' ' de la URL
function parseQDate(v) {
  if (!v) return null;
  const s = String(v).replace(' ', '+');
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

function canDelete(user, vacation) {
  if (user.role === 'admin') return true;
  return String(vacation.fisio) === String(user.id);
}

/**
 * GET /api/vacations
 * - Admin: ve todas
 * - Fisioterapeuta: solo las suyas
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'fisioterapeuta') {
      const fisioDoc = await Fisio.findOne({ email: req.user.email }).lean();
      if (!fisioDoc?._id) return res.json({ ok: true, data: [] });
      filter = { fisio: fisioDoc._id };
    }

    const items = await Vacation.find(filter)
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
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, notes, title, color, fisioId } = req.body;
    const start = normalizeDate(startDate);
    const end   = normalizeDate(endDate);
    if (!start || !end) return res.status(400).json({ ok: false, error: 'Fechas inválidas' });
    if (start > end)    return res.status(400).json({ ok: false, error: 'Fecha inicio posterior a fin' });

    let fisioToUse = null;
    if (req.user.role === 'admin') {
      if (!fisioId) return res.status(400).json({ ok: false, error: 'falta fisioId' });
      fisioToUse = fisioId;
    } else {
      const fisioDoc = await Fisio.findOne({ email: req.user.email }).lean();
      if (!fisioDoc?._id) return res.status(400).json({ ok: false, error: 'No se encontró tu ficha de fisio' });
      fisioToUse = fisioDoc._id;
    }

    const overlap = await Vacation.findOne({
      fisio: fisioToUse,
      $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }],
    }).lean();
    if (overlap) return res.status(409).json({ ok: false, error: 'Rango solapado para ese fisioterapeuta' });

    const newVac = await Vacation.create({
      fisio: fisioToUse,
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

/**
 * GET /api/vacations/events
 * Devuelve vacaciones como background para FullCalendar
 */
router.get('/events', requireAuth, async (req, res) => {
  try {
    const startD = parseQDate(req.query.start);
    const endD   = parseQDate(req.query.end);
    if (!startD || !endD) return res.status(400).json({ ok:false, error:'start/end inválidos' });

    const items = await Vacation.find({
      startDate: { $lt: endD },
      endDate:   { $gt: startD }
    })
    .populate('fisio','nombre apellidos')
    .lean();

    const events = items.map(v => ({
      id: `vac-${v._id}`,
      title: `Vacaciones —  ${`${v?.fisio?.nombre ?? ''} ${v?.fisio?.apellidos ?? ''}`.trim() || 'Fisio'}`,
      start: v.startDate,
      end: v.endDate,
      display: 'background',
      overlap: false,
      extendedProps: { fisioId: v.fisio?._id }
    }));

    res.json(events);
  } catch (err) {
    console.error('GET /vacations/events', err);
    res.status(500).json({ ok:false, error:'Error al obtener eventos de vacaciones' });
  }
});

export default router;