import { useEffect, useMemo, useState } from "react";

import VacationForm from "../components/vacations/VacationForm.jsx";
import VacationsCalendar from "../components/vacations/VacationsCalendar.jsx";
import VacationsList from "../components/vacations/VacationsList.jsx";

import {
  apiListVacations,
  apiListFisioterapeutasSimple,
} from "../api";

import { getUser } from "../auth";

/* Normaliza distintas posibles respuestas de la API de fisios
   Acepta:
   - Array directo
   - { data: [...] }  /  { items: [...] }
   - Objeto plano tipo { "123": "Nombre Apellido", "456": { id:"456", name:"..." } }
*/
function normalizeFisios(raw) {
  if (!raw) return [];

  // Caso: ya es array
  if (Array.isArray(raw)) return normalizeArray(raw);

  // Caso: { data: [...] } o { items: [...] }
  if (Array.isArray(raw?.data)) return normalizeArray(raw.data);
  if (Array.isArray(raw?.items)) return normalizeArray(raw.items);

  // Caso: objeto tipo { id: "Ana López", ... } o { id: {nombre, apellidos} }
  if (typeof raw === "object") {
    const entries = Object.entries(raw);

    const list = entries.map(([k, v]) => {
      if (typeof v === "string") {
        const parts = v.trim().split(/\s+/);
        const nombre = parts[0] || "";
        const apellidos = parts.slice(1).join(" ");
        return { _id: k.toString(), nombre, apellidos };
      }

      return {
        _id: (v._id ?? v.id ?? v.value ?? v.userId ?? k).toString(),
        nombre: (v.nombre ?? v.name ?? v.firstName ?? "").toString(),
        apellidos: (v.apellidos ?? v.lastName ?? "").toString(),
      };
    });

    return list.filter((f) => f._id);
  }

  return [];
}

function normalizeArray(arr) {
  return (arr || [])
    .map((f) => ({
      _id: (f?._id ?? f?.id ?? f?.value ?? f?.userId ?? "").toString(),
      nombre: (f?.nombre ?? f?.name ?? f?.firstName ?? "").toString(),
      apellidos: (f?.apellidos ?? f?.lastName ?? "").toString(),
    }))
    .filter((f) => f._id);
}

export default function Vacaciones() {
  // =========================
  // 0. Info del usuario logado
  // =========================
  const me = getUser(); // <- viene de localStorage.user
  const role = (me?.role || me?.rol || me?.tipo || "").toLowerCase();
  const myId = me?._id || me?.id || ""; // depende de cómo lo llame tu backend
  const userName = me?.name || me?.nombre || ""; // para fallback de nombre

  // =========================
  // State local
  // =========================
  const [reloadKey, setReloadKey] = useState(0); // para recargar datos tras crear/borrar
  const [items, setItems] = useState([]); // vacaciones completas
  const [fisios, setFisios] = useState([]); // lista de fisios para selector
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFisioId, setSelectedFisioId] = useState("ALL");

  // =========================
  // 1. Cargar vacaciones
  // =========================
  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiListVacations();
        if (!mounted) return;

        // Permitimos que la API devuelva array directo o {items}/{data}
        const parsed = Array.isArray(data)
          ? data
          : (data?.items || data?.data || []);

        setItems(parsed || []);
      } catch (e) {
        console.error("ERROR cargando vacaciones", e);
        if (mounted) setError("No se pudieron cargar las vacaciones");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [reloadKey]);

  // =========================
  // 2. Cargar fisios desde API
  //    (para el combo y para el selector del admin)
  // =========================
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const raw = await apiListFisioterapeutasSimple();
        if (!mounted) return;

        const norm = normalizeFisios(raw);
        if (norm.length > 0) {
          setFisios(norm);
        }
      } catch (e) {
        // si falla, seguimos con fallback en el siguiente efecto
        console.warn("No se pudieron cargar fisios:", e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================
  // 3. Fallback de fisios
  //    - si API fisios no respondió
  //    - intentamos al menos meter al usuario actual
  // =========================
  useEffect(() => {
    if (fisios.length > 0) return; // ya tenemos lista
    if (!myId) return; // no sabemos quién soy
    if (fisios.some((f) => f._id === myId)) return; // ya está metido

    setFisios((prev) => [
      ...prev,
      { _id: myId, nombre: userName || "Yo", apellidos: "" },
    ]);
  }, [fisios, myId, userName]);

  // =========================
  // 4. Preparar eventos para el calendario
  //    - convertimos las vacaciones en objetos {id,title,start,end,...}
  // =========================
  const events = useMemo(() => {
    return (items || []).map((v) => {
      const fisioName = v?.fisio?.nombre
        ? `${v.fisio.nombre}${
            v.fisio.apellidos ? " " + v.fisio.apellidos : ""
          }`
        : v?.fisioName || undefined;

      return {
        id: v?._id,
        title: v?.title || "Vacaciones",
        start: v?.startDate,
        end: v?.endDate,
        fisioId: v?.fisio?._id || v?.fisio || v?.fisioId,
        fisioName,
        color: v?.color || undefined,
      };
    });
  }, [items]);

  // =========================
  // 5. Aplicar filtro por fisio seleccionado
  // =========================
  const filteredEvents = useMemo(() => {
    if (selectedFisioId === "ALL") return events;
    return events.filter(
      (e) => (e.fisioId || "").toString() === selectedFisioId
    );
  }, [events, selectedFisioId]);

  // =========================
  // Render
  // =========================
  return (
    <div className="vacaciones-page space-y-6" style={{ paddingTop: 16 }}>
      {/* Título de página */}
      <h1 className="page-title">Vacaciones</h1>

      {/* Debug de rol en pequeñito */}
      <p style={{ fontSize: "12px", color: "#888" }}>
        DEBUG role: {role || "(sin rol)"}
      </p>

      {/* Formulario de alta de vacaciones:
          - Sólo visible si role === "admin"
          - Le pasamos fisios y un callback para recargar */}
      {role === "admin" && (
        <div className="form-card mb-10">
          <VacationForm
            role={role}
            fisios={fisios}
            onCreated={() => setReloadKey((x) => x + 1)}
          />
        </div>
      )}

      {/* Bloque de filtro por fisio */}
      <div className="filter-card filter-grid rounded-2xl p-5 md:p-6 border bg-[var(--panel)]">
        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">
            Filtrar por fisioterapeuta:
          </label>

          <select
            className="w-full rounded-xl border bg-transparent px-3 py-2"
            value={selectedFisioId}
            onChange={(e) => setSelectedFisioId(e.target.value)}
          >
            <option value="ALL">Todos</option>
            {fisios.map((f) => (
              <option key={f._id} value={f._id}>
                {`${f.nombre || ""}${
                  f.apellidos ? " " + f.apellidos : ""
                }`}
              </option>
            ))}
          </select>
        </div>

        {/* Botón "ver solo las mías":
            - Sólo tiene sentido para un usuario normal
            - El admin no lo ve */}
        {role !== "admin" && (
          <button
            className="
              only-mine-btn px-4 py-2 rounded-xl border hover:bg-[var(--panel-hover)]
              justify-self-start md:justify-self-end w-auto
              mt-2 md:mt-0
            "
            onClick={() => {
              if (myId) setSelectedFisioId(myId);
            }}
          >
            Ver solo las mías
          </button>
        )}
      </div>

      {/* Calendario de vacaciones */}
      <div className="calendar-block mt-6">
        {error && <p className="text-red-500">{error}</p>}

        {loading ? (
          <div className="rounded-2xl p-6 border bg-[var(--panel)] text-[var(--muted)]">
            Cargando calendario…
          </div>
        ) : (
          <VacationsCalendar events={filteredEvents} />
        )}
      </div>

      {/* Listado de vacaciones con opción de eliminar (según backend) */}
      <VacationsList reloadKey={reloadKey} />                
    </div>
  );
}
