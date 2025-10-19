// CRUD de pacientes + adjuntos
import { Router } from 'express';
import { Paciente } from '../models/Paciente.js';
import { Attachment } from '../models/Attachment.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { upload } from '../middleware/upload.js';
import fs from 'fs';

const router = Router();

// Listar (búsqueda ?q= ) con orden configurable (?sort=alpha | date)
router.get('/', requireAuth, async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  const sortMode = (req.query.sort || 'alpha').toString(); // alpha por defecto

  const filter = q
    ? { $or: [
        { nombre:    new RegExp(q, 'i') },
        { apellidos: new RegExp(q, 'i') },
        { email:     new RegExp(q, 'i') },
      ] }
    : {};

  // Orden
  let sort = {};
  if (sortMode === 'date') {
    sort = { createdAt: -1 }; // más recientes primero
  } else {
   sort = { nombre: 1, apellidos: 1 }; //Por orden alfabético por nombre
  }

  const pacientes = await Paciente
    .find(filter)
    .collation({ locale: 'es', strength: 1 })  // ordena bien con acentos
    .sort(sort)
    .limit(200);

  res.json({ data: pacientes });
});

// Crear
router.post('/', requireAuth, async (req, res) => {
  const { nombre, apellidos, email, telefono, fecha_nacimiento, antecedentes_medicos } = req.body || {};
  if (!nombre || !apellidos) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Nombre y apellidos son obligatorios' } });
  const created = await Paciente.create({ nombre, apellidos, email, telefono, fecha_nacimiento, antecedentes_medicos });
  res.status(201).json({ data: created });
});

// Detalle
router.get('/:id', requireAuth, async (req, res) => {
  const p = await Paciente.findById(req.params.id);
  if (!p) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Paciente no encontrado' } });
  res.json({ data: p });
});

// Editar
router.put('/:id', requireAuth, async (req, res) => {
  const updated = await Paciente.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Paciente no encontrado' } });
  res.json({ data: updated });
});

// Borrar (solo admin)
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const deleted = await Paciente.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Paciente no encontrado' } });
  res.json({ ok: true });
});

// Subir adjunto
router.post('/:id/adjuntos', requireAuth, upload.single('file'), async (req, res) => {
  const p = await Paciente.findById(req.params.id);
  if (!p) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Paciente no encontrado' } });
  if (!req.file) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Falta archivo' } });

  
  const doc = await Attachment.create({
    ownerType: 'paciente',
    ownerId: p._id,
    originalName: req.file.originalname,
    fileName: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size,
    pathOrUrl: req.file.path,
    uploadedBy: req.user.id
  });
  res.status(201).json({ data: doc });
});

// Listar adjuntos
router.get('/:id/adjuntos', requireAuth, async (req, res) => {
  const items = await Attachment.find({ ownerType: 'paciente', ownerId: req.params.id }).sort({ createdAt: -1 });
  res.json({ data: items });
});

// Descargar adjunto
router.get('/adjuntos/:adjuntoId', requireAuth, async (req, res) => {
  const a = await Attachment.findById(req.params.adjuntoId);
  if (!a) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Adjunto no encontrado' } });
  if (a.storage !== 'local') return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Storage no soportado en demo' } });
  if (!fs.existsSync(a.pathOrUrl)) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Archivo no existe' } });

  //Esta línea hace que, al descargar, te proponga el nombre original (ej. "Informe.pdf")
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(a.originalName)}"`);

  res.type(a.mimeType);
  fs.createReadStream(a.pathOrUrl).pipe(res);
});

// Borrar adjunto (solo admin)
router.delete('/adjuntos/:adjuntoId', requireAuth, requireRole('admin'), async (req, res) => {
  const a = await Attachment.findByIdAndDelete(req.params.adjuntoId);
  if (!a) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Adjunto no encontrado' } });
  if (a.storage === 'local' && fs.existsSync(a.pathOrUrl)) fs.unlinkSync(a.pathOrUrl);
  res.json({ ok: true });
});

export default router;
