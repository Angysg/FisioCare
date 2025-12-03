// Subida de archivos a carpeta local /uploads
import multer from 'multer';
import fs from 'fs';

// Carpeta donde se guardarán los archivos subidos.
// Toma la ruta desde variables de entorno o usa "uploads" por defecto.
const uploadDir = process.env.UPLOAD_DIR || 'uploads';

// Si la carpeta no existe, la crea automáticamente.
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Configuración del almacenamiento en disco
const storage = multer.diskStorage({
  // Destino donde se guardará cada archivo
  destination: (req, file, cb) => cb(null, uploadDir),

  // Nombre final del archivo subido
  filename: (req, file, cb) => {
    const ts = Date.now();                 // Marca de tiempo para evitar duplicados
    const safe = file.originalname.replace(/\s+/g, '_'); // Reemplaza espacios por "_"
    cb(null, `${ts}__${safe}`);            // Nombre final: 123456789__archivo.pdf
  }
});

// Filtro para permitir solo ciertos tipos de archivo
function fileFilter(req, file, cb) {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

  // Si el tipo MIME está permitido, aceptar. Si no, rechazar.
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Tipo de archivo no permitido'));
}

// Exporto la instancia configurada de multer
export const upload = multer({
  storage,                       // Uso de la configuración de almacenamiento
  fileFilter,                    // Validación de tipo de archivo
  limits: { fileSize: 10 * 1024 * 1024 } // Límite de tamaño: 10 MB
});
