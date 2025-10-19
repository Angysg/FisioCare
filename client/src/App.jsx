// Rutas de la app: /login y /pacientes (protegida)
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login";
import Pacientes from "./pages/Pacientes";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Inicio (si hay sesión, el botón te llevará a /pacientes) */}
        <Route path="/" element={<Layout><Home/></Layout>} />

        {/* Login (también bajo el layout para tener el header global con el toggle) */}
        <Route path="/login" element={<Layout><Login/></Layout>} />

        {/* Pacientes (protegida) */}
        <Route
          path="/pacientes"
          element={
            <Layout>
              <ProtectedRoute>
                <Pacientes/>
              </ProtectedRoute>
            </Layout>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
