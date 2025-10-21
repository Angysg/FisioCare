// client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard.jsx";
import Pacientes from "./pages/Pacientes";
import EditPaciente from "./pages/EditPaciente.jsx";

import Citas from "./pages/Citas.jsx";
import Seguimiento from "./pages/Seguimiento.jsx";
import Pilates from "./pages/Pilates.jsx";

import Fisioterapeutas from "./pages/Fisioterapeutas.jsx";
import EditFisioterapeuta from "./pages/EditFisioterapeuta.jsx";

// Pequeño helper para no repetir Layout + ProtectedRoute en cada ruta
function Protected({ children }) {
  return (
    <Layout>
      <ProtectedRoute>{children}</ProtectedRoute>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/login" element={<Layout><Login /></Layout>} />

        {/* Privadas (todas pasan por Layout + ProtectedRoute) */}
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />

        {/* Pacientes */}
        <Route path="/pacientes" element={<Protected><Pacientes /></Protected>} />
        <Route path="/pacientes/:id/editar" element={<Protected><EditPaciente /></Protected>} />

        {/* Citas / Seguimiento / Pilates */}
        <Route path="/citas" element={<Protected><Citas /></Protected>} />
        <Route path="/seguimiento" element={<Protected><Seguimiento /></Protected>} />
        <Route path="/pilates" element={<Protected><Pilates /></Protected>} />

        {/* Fisioterapeutas */}
        <Route path="/fisioterapeutas" element={<Protected><Fisioterapeutas /></Protected>} />
        <Route path="/fisioterapeutas/:id/editar" element={<Protected><EditFisioterapeuta /></Protected>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
