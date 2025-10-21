import { Router } from 'express';
import { Fisio } from '../models/Fisio.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/fisios?q=&sort=alpha|date
router.get('/', requireAuth, async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const sortMode = (req.query.sort || 'alpha').toString();

    const filter = q
      ? {
          $or: [
            { nombre:    new RegExp(q, 'i') },
            { apellidos: new RegExp(q, 'i') },
            { email:     new RegExp(q, 'i') },
            { telefono:  new RegExp(q, 'i') },
            // En arrays de strings, un $regex directo funciona (match si algún elemento coincide)
            { especialidades: new RegExp(q, 'i') },
          ],
        }
      : {};

    let sort = { apellidos: 1, nombre: 1 };
    if (sortMode === 'date') sort = { createdAt: -1 };

    const fisios = await Fisio.find(filter).sort(sort).lean();
    res.json({ ok: true, data: fisios });
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message || 'Error listando fisios' });
  }
});

// GET /api/fisios/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const item = await Fisio.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ ok: false, error: 'No encontrado' });
    res.json({ ok: true, data: item });
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message || 'Error obteniendo fisio' });
  }
});

// POST /api/fisios
router.post('/', requireAuth, async (req, res) => {
  try {
    const { nombre, apellidos, email, telefono, especialidades, activo } = req.body;
    if (!nombre || !apellidos || !email) {
      return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios' });
    }

    const espArray = Array.isArray(especialidades)
      ? especialidades.filter(Boolean).map((s) => s.trim())
      : (especialidades
          ? String(especialidades).split(',').map((s) => s.trim()).filter(Boolean)
          : []);

    const nuevo = await Fisio.create({
      nombre, apellidos, email,
      telefono: telefono || '',
      especialidades: espArray,
      activo: typeof activo === 'boolean' ? activo : true,
    });

    res.status(201).json({ ok: true, data: nuevo });
  } catch (err) {
    if (err?.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'campo';
      return res.status(409).json({ ok: false, error: `Duplicado en ${field}` });
    }
    res.status(500).json({ ok: false, error: err?.message || 'Error creando fisio' });
  }
});

// PUT /api/fisios/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { nombre, apellidos, email, telefono, especialidades, activo } = req.body;

    const espArray = Array.isArray(especialidades)
      ? especialidades.filter(Boolean).map((s) => s.trim())
      : (especialidades
          ? String(especialidades).split(',').map((s) => s.trim()).filter(Boolean)
          : undefined); // si no viene, no lo pisamos

    const payload = {
      ...(nombre !== undefined ? { nombre } : {}),
      ...(apellidos !== undefined ? { apellidos } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(telefono !== undefined ? { telefono } : {}),
      ...(espArray !== undefined ? { especialidades: espArray } : {}),
      ...(activo !== undefined ? { activo } : {}),
    };

    const updated = await Fisio.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    ).lean();

    if (!updated) return res.status(404).json({ ok: false, error: 'No encontrado' });
    res.json({ ok: true, data: updated });
  } catch (err) {
    if (err?.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'campo';
      return res.status(409).json({ ok: false, error: `Duplicado en ${field}` });
    }
    res.status(500).json({ ok: false, error: err?.message || 'Error actualizando fisio' });
  }
});

// DELETE /api/fisios/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await Fisio.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ ok: false, error: 'No encontrado' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message || 'Error eliminando fisio' });
  }
});

export default router;