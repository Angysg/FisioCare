import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import Pacientes from "./pages/Pacientes.jsx";
import Citas from "./pages/Citas.jsx";
import Pilates from "./pages/Pilates.jsx";
import Fisioterapeutas from "./pages/Fisioterapeutas.jsx";
import Vacaciones from "./pages/Vacaciones.jsx";

import EditPaciente from "./pages/EditPaciente.jsx";
import EditFisioterapeuta from "./pages/EditFisioterapeuta.jsx";

import Seguimientos from "./pages/Seguimientos.jsx";
import EditSeguimiento from "./pages/EditSeguimiento.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

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
          <Route path="/pilates" element={<Pilates />} />
          <Route path="/vacaciones" element={<Vacaciones />} />
          <Route path="/fisioterapeutas" element={<Fisioterapeutas />} />
          <Route path="/fisioterapeutas/:id/editar" element={<EditFisioterapeuta />} />
          <Route path="/seguimientos" element={<Seguimientos />} />
          <Route path="/seguimientos/:id/editar" element={<EditSeguimiento />} />
          <Route path="/seguimiento" element={<Navigate to="/seguimientos" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
