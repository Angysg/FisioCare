// CRUD de pacientes + adjuntos
import { Router } from 'express';
import { Paciente } from '../models/Paciente.js';
import { Attachment } from '../models/Attachment.js';
import { requireAuth } from '../middleware/auth.js';
// import { requireRole } from '../middleware/rbac.js'; // ya no lo usamos aquí
import { upload } from '../middleware/upload.js';
import fs from 'fs';

const router = Router();

/**
 * Autorización de escritura para admin y fisioterapeuta
 * (crear/editar/eliminar pacientes y adjuntos)
 */
const ensureWriter = (req, res, next) => {
  const role = req?.user?.role;
  if (role === 'admin' || role === 'fisioterapeuta') return next();
  return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'No autorizado' } });
};

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
    sort = { nombre: 1, apellidos: 1 }; // Por orden alfabético por nombre
  }

  const pacientes = await Paciente
    .find(filter)
    .collation({ locale: 'es', strength: 1 })  // ordena bien con acentos
    .sort(sort)
    .limit(200);

  res.json({ data: pacientes });
});

// Crear (admin y fisioterapeuta)
router.post('/', requireAuth, ensureWriter, async (req, res) => {
  const { nombre, apellidos, email, telefono, fecha_nacimiento, antecedentes_medicos } = req.body || {};
  if (!nombre || !apellidos) {
    return res.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'Nombre y apellidos son obligatorios' }
    });
  }
  const created = await Paciente.create({
    nombre, apellidos, email, telefono, fecha_nacimiento, antecedentes_medicos
  });
  res.status(201).json({ data: created });
});

// Detalle
router.get('/:id', requireAuth, async (req, res) => {
  const p = await Paciente.findById(req.params.id);
  if (!p) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Paciente no encontrado' } });
  res.json({ data: p });
});

// Editar (admin y fisioterapeuta)
router.put('/:id', requireAuth, ensureWriter, async (req, res) => {
  const updated = await Paciente.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!updated) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Paciente no encontrado' } });
  res.json({ data: updated });
});

// Borrar paciente (admin y fisioterapeuta) + borrado en cascada de adjuntos
router.delete('/:id', requireAuth, ensureWriter, async (req, res) => {
  const { id } = req.params;

  const paciente = await Paciente.findById(id);
  if (!paciente) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Paciente no encontrado' } });
  }

  // 1) Buscar y borrar adjuntos (doc + fichero si local)
  const attachments = await Attachment.find({ ownerType: 'paciente', ownerId: id });
  for (const a of attachments) {
    try {
      if (a.storage === 'local' && a.pathOrUrl && fs.existsSync(a.pathOrUrl)) {
        fs.unlinkSync(a.pathOrUrl);
      }
    } catch (e) {
      // Registramos pero no abortamos
      console.error('No se pudo borrar el fichero:', a.pathOrUrl, e?.message);
    }
  }
  await Attachment.deleteMany({ ownerType: 'paciente', ownerId: id });

  // 2) Borrar paciente
  await Paciente.findByIdAndDelete(id);

  res.json({ ok: true, deletedId: id });
});

// Subir adjunto (admin y fisioterapeuta)
router.post('/:id/adjuntos', requireAuth, ensureWriter, upload.single('file'), async (req, res) => {
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
    storage: 'local',             // si tu modelo lo usa, explícitalo
    uploadedBy: req.user.id
  });
  res.status(201).json({ data: doc });
});

// Listar adjuntos
router.get('/:id/adjuntos', requireAuth, async (req, res) => {
  const items = await Attachment
    .find({ ownerType: 'paciente', ownerId: req.params.id })
    .sort({ createdAt: -1 });
  res.json({ data: items });
});

// Descargar adjunto
router.get('/adjuntos/:adjuntoId', requireAuth, async (req, res) => {
  const a = await Attachment.findById(req.params.adjuntoId);
  if (!a) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Adjunto no encontrado' } });
  if (a.storage !== 'local') {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Storage no soportado en demo' } });
  }
  if (!fs.existsSync(a.pathOrUrl)) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Archivo no existe' } });
  }

  // Esta línea hace que, al descargar, te proponga el nombre original (ej. "Informe.pdf")
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(a.originalName)}"`);
  res.type(a.mimeType);
  fs.createReadStream(a.pathOrUrl).pipe(res);
});

// Borrar adjunto (admin y fisioterapeuta)
router.delete('/adjuntos/:adjuntoId', requireAuth, ensureWriter, async (req, res) => {
  const a = await Attachment.findById(req.params.adjuntoId);
  if (!a) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Adjunto no encontrado' } });

  // Borrar fichero si es local
  try {
    if (a.storage === 'local' && a.pathOrUrl && fs.existsSync(a.pathOrUrl)) {
      fs.unlinkSync(a.pathOrUrl);
    }
  } catch (e) {
    console.error('No se pudo borrar el fichero:', a.pathOrUrl, e?.message);
  }

  await Attachment.findByIdAndDelete(a._id);
  res.json({ ok: true, deletedId: a._id.toString() });
});

export default router;
