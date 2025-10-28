// client/src/components/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";

// Ajusta esta función a tu lógica real de sesión si la tienes en otro sitio.
function isAuthenticated() {
  // Si tu login guarda el token en localStorage:
  const token = localStorage.getItem("token");
  // Si no usas token, puedes comprobar usuario/rol en sessionStorage, etc.
  return !!token;
}

/**
 * ProtectedRoute compatible:
 * - Si se usa como wrapper con <ProtectedRoute><Componente/></ProtectedRoute>, renderiza children.
 * - Si se usa anidado con rutas y <Outlet/>, renderiza <Outlet/>.
 */
export default function ProtectedRoute({ children }) {
  const authed = isAuthenticated();
  const location = useLocation();

  if (!authed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Compatibilidad: si hay children, devuelve children; si no, Outlet.
  return children ? children : <Outlet />;
}
