// routes/fisio.access.routes.js
import { Router } from "express";
import bcrypt from "bcryptjs";
import { requireAuth } from "../middleware/auth.js";
import { Fisio } from "../models/Fisio.js";
import { User } from "../models/User.js";

const router = Router();

/** Crear acceso (usuario) para un fisio
 * POST /api/fisio-access/:id/create  body: { password?: string }
 */
router.post("/:id/create", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const fisio = await Fisio.findById(id).lean();
    if (!fisio) return res.status(404).json({ ok: false, error: "Fisio no encontrado" });
    if (!fisio.email) return res.status(400).json({ ok: false, error: "El fisio no tiene email" });

    const exists = await User.findOne({ email: fisio.email });
    if (exists) return res.status(409).json({ ok: false, error: "El usuario ya existe" });

    const plain = (password || Math.random().toString(36).slice(-10)).trim();
    const hash = await bcrypt.hash(plain, 10);

    await new User({
      name: `${fisio.nombre || ""} ${fisio.apellidos || ""}`.trim() || fisio.email,
      email: fisio.email,
      role: "fisioterapeuta",
      passwordHash: hash,
    }).save();

    res.json({ ok: true, data: { created: true, tempPassword: plain } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Error servidor" });
  }
});

/** Resetear contraseña del usuario del fisio
 * POST /api/fisio-access/:id/reset  body: { password?: string }
 */
router.post("/:id/reset", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const fisio = await Fisio.findById(id).lean();
    if (!fisio) return res.status(404).json({ ok: false, error: "Fisio no encontrado" });
    if (!fisio.email) return res.status(400).json({ ok: false, error: "El fisio no tiene email" });

    const user = await User.findOne({ email: fisio.email });
    if (!user) return res.status(404).json({ ok: false, error: "Usuario no existe" });

    const plain = (password || Math.random().toString(36).slice(-10)).trim();
    user.passwordHash = await bcrypt.hash(plain, 10);
    await user.save();

    res.json({ ok: true, data: { reset: true, tempPassword: plain } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Error servidor" });
  }
});

export default router;
