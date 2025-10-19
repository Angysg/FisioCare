import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login";
import Pacientes from "./pages/Pacientes";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard.jsx";
import Citas from "./pages/Citas.jsx";
import Seguimiento from "./pages/Seguimiento.jsx";
import Pilates from "./pages/Pilates.jsx";
import Fisioterapeutas from "./pages/Fisioterapeutas.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Inicio */}
        <Route path="/" element={<Layout><Home /></Layout>} />

        {/* Login */}
        <Route path="/login" element={<Layout><Login /></Layout>} />

        {/* Dashboard (protegido) */}
        <Route
          path="/dashboard"
          element={
            <Layout>
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            </Layout>
          }
        />

        {/* Pacientes (protegida) */}
        <Route
          path="/pacientes"
          element={
            <Layout>
              <ProtectedRoute>
                <Pacientes />
              </ProtectedRoute>
            </Layout>
          }
        />

        {/* Citas (protegida) */}
        <Route
          path="/citas"
          element={
            <Layout>
              <ProtectedRoute>
                <Citas />
              </ProtectedRoute>
            </Layout>
          }
        />

        {/* Seguimiento (protegida) */}
        <Route
          path="/seguimiento"
          element={
            <Layout>
              <ProtectedRoute>
                <Seguimiento />
              </ProtectedRoute>
            </Layout>
          }
        />

        {/* Grupo Pilates (protegida) */}
        <Route
          path="/pilates"
          element={
            <Layout>
              <ProtectedRoute>
                <Pilates />
              </ProtectedRoute>
            </Layout>
          }
        />

        {/* Fisioterapeutas (protegida, visible solo en UI si admin) */}
        <Route
          path="/fisioterapeutas"
          element={
            <Layout>
              <ProtectedRoute>
                <Fisioterapeutas />
              </ProtectedRoute>
            </Layout>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
