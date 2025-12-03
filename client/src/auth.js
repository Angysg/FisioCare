// client/src/auth.js
//Es el sistema de autenticación local de tu frontend.

// Guarda token y usuario tras iniciar sesión
export function saveSession({ accessToken, user }) {
  localStorage.setItem("token", accessToken);
  localStorage.setItem("user", JSON.stringify(user));
}

// Recupera el usuario guardado (si existe)
export function getUser() {
  const u = localStorage.getItem("user");
  return u ? JSON.parse(u) : null;
}

// Comprueba si hay un token en localStorage (usuario logueado)
export function isLoggedIn() {
  return !!localStorage.getItem("token");
}

// Elimina token y usuario → cierra sesión
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
