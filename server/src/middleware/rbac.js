// Permite pasar solo a ciertos roles
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Rol insuficiente' } });
  }
  next();
};
