// Login y perfil
import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Crea admin si no existe (admin@clinica.com / admin123)
async function ensureAdminSeed() {
  const exists = await User.findOne({ role: 'admin' });
  if (!exists) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await User.create({ name: 'Admin', email: 'admin@clinica.com', passwordHash, role: 'admin' });
    console.log('🔑 Admin creado: admin@clinica.com / admin123');
  }
}
ensureAdminSeed();

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Email y contraseña son obligatorios' } });

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas' } });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas' } });

  const payload = { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ accessToken, user: payload });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

export default router;
