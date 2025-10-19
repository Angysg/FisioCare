// Helpers para gestionar sesión en localStorage
export function saveSession({ accessToken, user }) {
  localStorage.setItem("token", accessToken);
  localStorage.setItem("user", JSON.stringify(user));
}
export function getUser() {
  const u = localStorage.getItem("user");
  return u ? JSON.parse(u) : null;
}
export function isLoggedIn() {
  return !!localStorage.getItem("token");
}
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
