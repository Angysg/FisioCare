/**
 * Aquí es donde se crea el token JWT cuando un usuario inicia sesión.
Primero preparo el payload con los datos del usuario, y luego lo firmo con jwt.sign().
Este token se envía al frontend y servirá para autenticar al usuario en cada petición.
 */

// Login y perfil
import { Router } from 'express';
import bcrypt from 'bcrypt';               // Para encriptar y comprobar contraseñas
import jwt from 'jsonwebtoken';            // Para generar el token JWT
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Crear admin por defecto si no existe
async function ensureAdminSeed() {
  const exists = await User.findOne({ role: 'admin' });
  if (!exists) {
    // Hash de la contraseña inicial del admin
    const passwordHash = await bcrypt.hash('admin123', 10);
    await User.create({ 
      name: 'Admin', 
      email: 'admin@clinica.com', 
      passwordHash,         // Contraseña encriptada almacenada en la BD
      role: 'admin' 
    });
    console.log('🔑 Admin creado: admin@clinica.com / admin123');
  }
}
ensureAdminSeed();

// ----------------- LOGIN -----------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ 
      error: { code: 'BAD_REQUEST', message: 'Email y contraseña son obligatorios' } 
    });
  }

  // Buscar usuario por email
  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user) {
    return res.status(401).json({ 
      error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas' } 
    });
  }

  // Comparar la contraseña introducida con el hash almacenado
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ 
      error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas' } 
    });
  }

  // Crear payload con la información mínima del usuario
  const payload = { 
    id: user._id.toString(), 
    name: user.name, 
    email: user.email, 
    role: user.role 
  };

  // Generar token JWT (válido 1 hora)
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Devolver token y datos del usuario
  res.json({ accessToken, user: payload });
});

// Ruta para obtener el perfil del usuario autenticado
router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

export default router;
