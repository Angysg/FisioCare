import { useNavigate } from "react-router-dom";
import { isLoggedIn } from "../auth";

const clinicName = import.meta.env.VITE_CLINIC_NAME || "Clínica";

export default function Home() {
  const nav = useNavigate();

  function ir() {
    // si ya está logueado/a, directo a pacientes; si no, a login
    nav(isLoggedIn() ? "/pacientes" : "/login");
  }

  return (
    <div style={{ display:"grid", placeItems:"center", minHeight:"60vh" }}>
      <div className="card" style={{ textAlign:"center", maxWidth: 640 }}>
        <h1 style={{ marginTop:0 }}>Bienvenid@ a {clinicName}</h1>
        <p style={{ opacity:.8 }}>
          Gestiona profesionales, pacientes, citas y adjuntos de forma sencilla.
        </p>
        <button onClick={ir}>Entrar</button>
      </div>
    </div>
  );
}
