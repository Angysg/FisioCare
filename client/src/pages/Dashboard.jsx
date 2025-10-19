import { Link } from "react-router-dom";
import { getRole } from "../session";

export default function Dashboard() {
  const role = getRole(); // "admin" | "fisioterapeuta"

  const comunes = [
    { title: "Pacientes", to: "/pacientes", desc: "Gestión de fichas" },
    { title: "Citas", to: "/citas", desc: "Agenda y reservas" },
    { title: "Seguimiento y Valoración", to: "/seguimiento", desc: "Controles y notas" },
    { title: "Grupo Pilates", to: "/pilates", desc: "Grupos y horarios" },
  ];

  const adminOnly = [
    { title: "Fisioterapeutas", to: "/fisioterapeutas", desc: "Altas, permisos y roles" },
  ];

  const cards = role === "admin" ? [...comunes, ...adminOnly] : comunes;

  return (
    <main className="container">
      <h1 className="page-title" style={{ margin: "1rem 0" }}>Panel</h1>

      <div className="dashboard-list">
        {cards.map((c) => (
          <Link key={c.title} to={c.to} className="card-link">
            <h2>{c.title}</h2>
            <p>{c.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
