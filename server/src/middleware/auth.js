// Middleware que comprueba el token JWT del header Authorization
import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {

  //Obtener la cabecera Authorization: "Bearer <token>"
  const auth = req.headers.authorization || "";

  //Extraer el token si empieza por "Bearer "
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  //Si no hay token → no autorizado
  if (!token) {
    return res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Falta token" }
    });
  }

  try {
    //Verificar el token con la clave secreta del servidor
    req.user = jwt.verify(token, process.env.JWT_SECRET);

    //Continuar hacia la ruta protegida
    next();

  } catch {
    //Si el token está caducado o es inválido:rechazo de acceso
    return res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Token inválido o expirado" }
    });
  }
}
