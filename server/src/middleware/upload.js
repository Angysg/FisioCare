// Subida de archivos a carpeta local /uploads
import multer from 'multer';
import fs from 'fs';

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/\s+/g, '_');
    cb(null, `${ts}__${safe}`);
  }
});

function fileFilter(req, file, cb) {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Tipo de archivo no permitido'));
}

export const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
