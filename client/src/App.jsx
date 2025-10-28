// client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import Pacientes from "./pages/Pacientes.jsx";
import Citas from "./pages/Citas.jsx";
import Seguimiento from "./pages/Seguimiento.jsx";
import Pilates from "./pages/Pilates.jsx";
import Fisioterapeutas from "./pages/Fisioterapeutas.jsx";
import Vacaciones from "./pages/Vacaciones.jsx";

import EditPaciente from "./pages/EditPaciente.jsx";
import EditFisioterapeuta from "./pages/EditFisioterapeuta.jsx";

import "react-big-calendar/lib/css/react-big-calendar.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas (sin barra) */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* Privadas (barra + protección) */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/pacientes/:id/editar" element={<EditPaciente />} />

          <Route path="/citas" element={<Citas />} />
          <Route path="/seguimiento" element={<Seguimiento />} />
          <Route path="/pilates" element={<Pilates />} />

          <Route path="/vacaciones" element={<Vacaciones />} />

          <Route path="/fisioterapeutas" element={<Fisioterapeutas />} />
          <Route
            path="/fisioterapeutas/:id/editar"
            element={<EditFisioterapeuta />}
          />

          {/* ruta desconocida estando logado → dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* ruta desconocida NO logado → login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
