import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { VacationRequest } from '../models/VacationRequest.js';
import { Vacation } from '../models/Vacation.js';
import { Fisio } from '../models/Fisio.js';

const router = Router();

function normalizeDate(d) {
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? null : x;
}

/**
 * POST /api/vacation-requests
 * (FISIOTERAPEUTA) crea una solicitud de vacaciones
 * body: { startDate, endDate, message }
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'fisioterapeuta') {
      return res.status(403).json({ ok: false, error: 'Solo fisioterapeutas pueden solicitar' });
    }

    const { startDate, endDate, message } = req.body || {};
    const start = normalizeDate(startDate);
    const end   = normalizeDate(endDate);

    if (!start || !end) {
      return res.status(400).json({ ok: false, error: 'Fechas inválidas' });
    }
    if (start > end) {
      return res.status(400).json({ ok: false, error: 'Fecha inicio posterior a fin' });
    }

    // validamos que ese user tiene un Fisio asociado
    // En tu app, el login va por User, pero las vacaciones van por Fisio,
    // así que necesitamos mapear: User.email == Fisio.email (esto ya pasa en fisio.access.routes)
    const fisioDoc = await Fisio.findOne({ email: req.user.email }).lean();
    if (!fisioDoc?._id) {
      return res.status(400).json({ ok: false, error: 'No se encontró el fisio asociado a este usuario' });
    }

    const created = await VacationRequest.create({
      fisio: fisioDoc._id,
      startDate: start,
      endDate: end,
      message: message || '',
      status: 'pending',
    });

    res.status(201).json({ ok: true, data: created });
  } catch (err) {
    console.error('POST /vacation-requests', err);
    res.status(500).json({ ok: false, error: 'Error al crear solicitud' });
  }
});

/**
 * GET /api/vacation-requests/mine
 * (FISIOTERAPEUTA) ver mis solicitudes y su estado
 */
router.get('/mine', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'fisioterapeuta') {
      return res.status(403).json({ ok: false, error: 'Solo fisioterapeutas' });
    }

    const fisioDoc = await Fisio.findOne({ email: req.user.email }).lean();
    if (!fisioDoc?._id) {
      return res.json({ ok: true, data: [] });
    }

    const list = await VacationRequest.find({ fisio: fisioDoc._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ ok: true, data: list });
  } catch (err) {
    console.error('GET /vacation-requests/mine', err);
    res.status(500).json({ ok: false, error: 'Error al listar tus solicitudes' });
  }
});

/**
 * GET /api/vacation-requests/pending
 * (ADMIN) bandeja de solicitudes pendientes
 */
router.get('/pending', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Solo admin' });
    }

    const list = await VacationRequest.find({ status: 'pending' })
      .populate('fisio', 'nombre apellidos email telefono')
      .sort({ createdAt: 1 })
      .lean();

    res.json({ ok: true, data: list });
  } catch (err) {
    console.error('GET /vacation-requests/pending', err);
    res.status(500).json({ ok: false, error: 'Error listando solicitudes pendientes' });
  }
});

/**
 * POST /api/vacation-requests/:id/resolve
 * (ADMIN) aprobar o rechazar
 * body: { action: "approve" | "reject" }
 *
 * - approve:
 *    -> crea Vacation real
 *    -> marca request como approved
 * - reject:
 *    -> marca request como rejected
 */
router.post('/:id/resolve', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Solo admin' });
    }

    const { action } = req.body || {};
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ ok: false, error: 'Acción inválida' });
    }

    const reqDoc = await VacationRequest.findById(req.params.id);
    if (!reqDoc) {
      return res.status(404).json({ ok: false, error: 'Solicitud no encontrada' });
    }
    if (reqDoc.status !== 'pending') {
      return res.status(409).json({ ok: false, error: 'Solicitud ya resuelta' });
    }

    if (action === 'reject') {
      reqDoc.status = 'rejected';
      await reqDoc.save();
      return res.json({ ok: true, data: reqDoc });
    }

    // action === 'approve'
    // Antes de crear Vacation real, comprobamos solape igual que en tu POST /vacations
    const start = reqDoc.startDate;
    const end   = reqDoc.endDate;

    const overlap = await Vacation.findOne({
      fisio: reqDoc.fisio,
      $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }],
    }).lean();

    if (overlap) {
      return res.status(409).json({
        ok: false,
        error: 'Rango solapado para ese fisio. No se puede aprobar.',
      });
    }

    const vac = await Vacation.create({
      fisio: reqDoc.fisio,
      title: 'Vacaciones',
      startDate: start,
      endDate: end,
      color: '',
      notes: reqDoc.message || '',
    });

    reqDoc.status = 'approved';
    await reqDoc.save();

    const populatedVac = await vac.populate('fisio', 'nombre apellidos email telefono');

    res.json({ ok: true, data: { request: reqDoc, vacation: populatedVac } });
  } catch (err) {
    console.error('POST /vacation-requests/:id/resolve', err);
    res.status(500).json({ ok: false, error: 'Error resolviendo solicitud' });
  }
});

export default router;
