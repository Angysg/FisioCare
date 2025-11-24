import { Link } from "react-router-dom";
import { getUser } from "../auth";

function normalizeRole(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function Dashboard() {
  const user = getUser();
  const roleRaw = user?.role || user?.rol || user?.tipo || "";
  const role = normalizeRole(roleRaw);

  const comunes = [
    { title: "Pacientes", to: "/pacientes", desc: "Gestión de fichas de pacientes" },
    { title: "Citas", to: "/citas", desc: "Agenda y reservas de citas" },
    {
      title: "Seguimiento y Valoración",
      to: "/seguimiento",
      desc: "Controles y notas para el seguimiento de los pacientes",
    },
    { title: "Grupo Pilates", to: "/pilates", desc: "Grupos y horarios" },
    { title: "Vacaciones", to: "/vacaciones", desc: "Calendario y gestión de vacaciones" },
  ];

  const adminOnly = [
    {
      title: "Fisioterapeutas",
      to: "/fisioterapeutas",
      desc: "Gestión de altas y permisos",
    },
    {
      title: "Gráficos",
      to: "/analitica-dolencias",
      desc: "Zonas más tratadas",
    },
  ];

  // Recepción: solo dos tarjetas (Pacientes y Citas)
  const receptionCards = comunes.filter((c) =>
    ["Pacientes", "Citas"].includes(c.title)
  );

  const cards =
    role === "recepcion"
      ? receptionCards
      : role === "admin"
      ? [...comunes, ...adminOnly]
      : comunes;

  return (
    <main className="container">
      <h1 className="page-title" style={{ margin: "1rem 0" }}>
        Panel
      </h1>

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
