// Gestiona la sesión y el rol del usuario desde localStorage.
// Compatible con tu estructura actual { token, user: { role: 'admin' | 'fisioterapeuta' } }

export function getUserSafe() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getRole() {
  const u = getUserSafe();
  const role = u?.role?.toLowerCase?.() || "fisioterapeuta"; // por defecto
  return role === "admin" ? "admin" : "fisioterapeuta";
}

export function isAdmin() {
  return getRole() === "admin";
}

export function isLoggedIn() {
  return !!localStorage.getItem("token");
}
