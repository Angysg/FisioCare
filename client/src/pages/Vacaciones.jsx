import { useEffect, useMemo, useState } from "react";

import VacationForm from "../components/vacations/VacationForm.jsx";
import VacationsCalendar from "../components/vacations/VacationsCalendar.jsx";
import VacationsList from "../components/vacations/VacationsList.jsx";

import 'react-big-calendar/lib/css/react-big-calendar.css';

import {
  apiListVacations,
  apiListFisioterapeutasSimple,
  apiCreateVacationRequest,
  apiListMyVacationRequests,
  apiListPendingVacationRequests,
  apiResolveVacationRequest,
} from "../api";

import { getUser } from "../auth";

/* ===================== días laborables ===================== */
// Añade aquí tus festivos (nacionales + locales). Formato YYYY-MM-DD.
const HOLIDAYS_2025 = new Set([
  "2025-01-01", // Año Nuevo
  "2025-01-06", // Reyes
  "2025-05-01", // Día del Trabajo
  "2025-08-15", // Asunción
  "2025-10-12", // Fiesta Nacional
  "2025-11-01", // Todos los Santos
  "2025-12-06", // Constitución
  "2025-12-08", // Inmaculada
  "2025-12-25", // Navidad
]);

function toISO(d) {
  const date = (d instanceof Date) ? d : new Date(d);
  // normalizamos a UTC para evitar problemas de huso al serializar
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    .toISOString()
    .slice(0, 10);
}

function countWorkingDays(startDate, endDate, holidays = HOLIDAYS_2025, weekend = new Set([0, 6])) {
  if (!startDate || !endDate) return 0;
  const s0 = new Date(startDate);
  const e0 = new Date(endDate);
  const s = new Date(s0.getFullYear(), s0.getMonth(), s0.getDate());
  const e = new Date(e0.getFullYear(), e0.getMonth(), e0.getDate());

  let count = 0;
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();            // 0 domingo, 6 sábado
    const iso = toISO(d);              // YYYY-MM-DD
    if (!weekend.has(day) && !holidays.has(iso)) count++;
  }
  return count;
}

function totalsByPerson(vacaciones, holidays = HOLIDAYS_2025) {
  const totals = {};
  for (const v of (vacaciones || [])) {
    const name =
      (v?.fisio?.nombre || v?.fisioName || v?.title || "Desconocido") +
      (v?.fisio?.apellidos ? ` ${v.fisio.apellidos}` : "");
    const days = countWorkingDays(v?.startDate, v?.endDate, holidays);
    totals[name.trim() || "Desconocido"] = (totals[name.trim() || "Desconocido"] || 0) + days;
  }
  return totals;
}
/* =========================================================================== */

function normalizeFisios(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return normalizeArray(raw);
  if (Array.isArray(raw?.data)) return normalizeArray(raw.data);
  if (Array.isArray(raw?.items)) return normalizeArray(raw.items);

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
  const me = getUser(); // {id,name,email,role}
  const role = (me?.role || "").toLowerCase();
  const isAdmin = role === "admin";
  const isFisio = role === "fisioterapeuta";

  const [reloadKey, setReloadKey] = useState(0);
  const [items, setItems] = useState([]); // vacaciones aprobadas
  const [fisios, setFisios] = useState([]); // lista fisios (solo usará admin)
  const [loadingVac, setLoadingVac] = useState(true);
  const [errorVac, setErrorVac] = useState("");

  const [selectedFisioId, setSelectedFisioId] = useState("ALL");

  // ---- solicitudes
  const [myRequests, setMyRequests] = useState([]); // para fisio
  const [pendingRequests, setPendingRequests] = useState([]); // para admin
  const [reqStart, setReqStart] = useState("");
  const [reqEnd, setReqEnd] = useState("");
  const [reqMsg, setReqMsg] = useState("");
  const [savingReq, setSavingReq] = useState(false);
  const [errReq, setErrReq] = useState("");

  // 1) vacaciones aprobadas
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingVac(true);
      setErrorVac("");
      try {
        const data = await apiListVacations();
        if (!mounted) return;
        const parsed = Array.isArray(data) ? data : (data?.items || data?.data || []);
        setItems(parsed || []);
      } catch (e) {
        console.error("ERROR cargando vacaciones", e);
        if (mounted) setErrorVac("No se pudieron cargar las vacaciones");
      } finally {
        if (mounted) setLoadingVac(false);
      }
    })();
    return () => { mounted = false; };
  }, [reloadKey]);

  // 2) fisios (solo admin)
  useEffect(() => {
    if (!isAdmin) return;
    let mounted = true;
    (async () => {
      try {
        const raw = await apiListFisioterapeutasSimple();
        if (!mounted) return;
        const norm = normalizeFisios(raw);
        setFisios(norm || []);
      } catch (e) {
        console.warn("No se pudieron cargar fisios:", e);
        if (mounted) setFisios([]);
      }
    })();
    return () => { mounted = false; };
  }, [isAdmin]);

  // 3) mis solicitudes (fisio)
  useEffect(() => {
    if (!isFisio) return;
    let mounted = true;
    (async () => {
      try {
        const list = await apiListMyVacationRequests();
        if (mounted) setMyRequests(list || []);
      } catch (e) {
        console.warn("No se pudieron cargar tus solicitudes:", e);
      }
    })();
    return () => { mounted = false; };
  }, [isFisio, reloadKey]);

  // 4) solicitudes pendientes (admin)
  useEffect(() => {
    if (!isAdmin) return;
    let mounted = true;
    (async () => {
      try {
        const list = await apiListPendingVacationRequests();
        if (mounted) setPendingRequests(list || []);
      } catch (e) {
        console.warn("No se pudieron cargar las solicitudes pendientes:", e);
      }
    })();
    return () => { mounted = false; };
  }, [isAdmin, reloadKey]);

  // eventos calendario (título = nombre del fisio)
  const events = useMemo(() => {
    return (items || []).map((v) => {
      const fisioName = v?.fisio?.nombre
        ? `${v.fisio.nombre}${v.fisio.apellidos ? " " + v.fisio.apellidos : ""}`
        : v?.fisioName || undefined;

      // NUEVO: añadimos workingDays al evento (útil para tooltips/listas)
      const workingDays = countWorkingDays(v?.startDate, v?.endDate);

      return {
        id: v?._id,
        title: fisioName || v?.title || "Vacaciones",
        start: v?.startDate,
        end: v?.endDate,
        fisioId: v?.fisio?._id || v?.fisio || v?.fisioId,
        fisioName,
        color: v?.color || undefined,
        workingDays,
      };
    });
  }, [items]);

  // filtro calendario (solo admin)
  const filteredEvents = useMemo(() => {
    if (!isAdmin) return events;
    if (selectedFisioId === "ALL") return events;
    return events.filter((e) => (e.fisioId || "").toString() === selectedFisioId);
  }, [events, isAdmin, selectedFisioId]);

  // NUEVO: totales por persona (globales y con filtro aplicado)
  const totalsAll = useMemo(() => totalsByPerson(items), [items]);
  const totalsFiltered = useMemo(() => {
    if (!isAdmin || selectedFisioId === "ALL") return null;
    const filtered = items.filter(v => (v?.fisio?._id || v?.fisio || v?.fisioId || "").toString() === selectedFisioId);
    return totalsByPerson(filtered);
  }, [items, isAdmin, selectedFisioId]);

  // enviar solicitud (fisio)
  async function submitRequest(e) {
    e.preventDefault();
    setSavingReq(true);
    setErrReq("");
    try {
      if (!reqStart || !reqEnd) {
        setErrReq("Faltan fechas");
        setSavingReq(false);
        return;
      }
      await apiCreateVacationRequest({
        startDate: reqStart,
        endDate: reqEnd,
        message: reqMsg,
      });
      setReqStart("");
      setReqEnd("");
      setReqMsg("");
      setReloadKey((x) => x + 1);
    } catch (err) {
      console.error(err);
      setErrReq("No se pudo enviar la solicitud");
    } finally {
      setSavingReq(false);
    }
  }

  // admin aprueba/rechaza
  async function resolveRequest(id, action) {
    try {
      await apiResolveVacationRequest(id, action);
      setReloadKey((x) => x + 1);
    } catch (err) {
      console.error(err);
      alert("No se pudo actualizar la solicitud");
    }
  }

  // helper estado -> etiqueta y clase
  function statusInfo(sraw) {
    const s = (sraw || "").toString().toLowerCase();
    if (s === "approved" || s === "aceptado" || s === "aprobada") {
      return { label: "Aprobada", cls: "badge badge--approved" };
    }
    if (s === "rejected" || s === "rechazado" || s === "rechazada") {
      return { label: "Rechazada", cls: "badge badge--rejected" };
    }
    return { label: "Pendiente", cls: "badge badge--pending" };
  }

  return (
    <div className="vacaciones-page space-y-6" style={{ paddingTop: 16 }}>
      <h1 className="page-title">VACACIONES</h1>

      {/* Bloque superior en dos columnas (md+) */}
      <div className="grid md:grid-cols-2 gap-8 md:gap-10">

        {/* ==== ADMIN: Bandeja de solicitudes pendientes ==== */}
        {isAdmin && (
          <section className="rounded-2xl border bg-[var(--panel)] p-5 md:p-6 space-y-4">
            <h2 className="sec-title sec-title--big">Solicitudes pendientes</h2>

            {pendingRequests.length === 0 ? (
              <p className="text-[var(--muted)] text-sm">
                No hay solicitudes pendientes.
              </p>
            ) : (
              <table
                style={{
                  width: "100%",
                  fontSize: 16,
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr style={{ textAlign: "left", color: "var(--muted)" }}>
                    <th>Fisio</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Nota</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map((r) => (
                    <tr key={r._id} style={{ borderTop: "1px solid var(--border)" }}>
                      <td style={{ padding: "6px 4px" }}>
                        {r?.fisio
                          ? `${r.fisio.nombre || ""} ${r.fisio.apellidos || ""}`
                          : "—"}
                      </td>
                      <td style={{ padding: "6px 4px" }}>
                        {new Date(r.startDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "6px 4px" }}>
                        {new Date(r.endDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "6px 4px", maxWidth: 200 }}>
                        {r.message || "—"}
                      </td>
                      <td style={{ padding: "6px 4px", whiteSpace: "nowrap" }}>
                        <div className="table-actions">
                          <button
                            className="btn-soft"
                            onClick={() => resolveRequest(r._id, "approve")}
                          >
                            Aceptar
                          </button>
                          <button
                            className="btn-soft btn-soft--danger"
                            onClick={() => resolveRequest(r._id, "reject")}
                          >
                            Rechazar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {/* ==== ADMIN: Añadir vacaciones ==== */}
        {isAdmin && (
          <section className="rounded-2xl border bg-[var(--panel)] p-5 md:p-6 mb-6">
            <h2 className="sec-title sec-title--big">Añadir vacaciones</h2>
            {/* wrapper para poder espaciar el botón submit sin tocar el componente */}
            <div className="vac-form">
              <VacationForm
                role={"admin"}
                fisios={fisios}
                onCreated={() => setReloadKey((x) => x + 1)}
              />
            </div>
          </section>
        )}

        {/* ==== FISIO: Mis solicitudes (izquierda) ==== */}
        {isFisio && (
          <section className="rounded-2xl border bg-[var(--panel)] p-5 md:p-6">
            <h2 className="sec-title sec-title--big">Mis solicitudes</h2>
            {(!myRequests || myRequests.length === 0) ? (
              <p className="text-[var(--muted)] text-sm">
                Aún no has solicitado vacaciones.
              </p>
            ) : (
              <table
                style={{
                  width: "100%",
                  fontSize: 16,
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr style={{ textAlign: "left", color: "var(--muted)" }}>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Comentario</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {[...myRequests]
                    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
                    .map((r) => {
                      const { label, cls } = statusInfo(r.status || r.estado);
                      return (
                        <tr key={r._id} style={{ borderTop: "1px solid var(--border)" }}>
                          <td style={{ padding: "6px 4px" }}>
                            {new Date(r.startDate).toLocaleDateString()}
                          </td>
                          <td style={{ padding: "6px 4px" }}>
                            {new Date(r.endDate).toLocaleDateString()}
                          </td>
                          <td style={{ padding: "6px 4px", maxWidth: 240 }}>
                            {r.message || "—"}
                          </td>
                          <td style={{ padding: "6px 4px" }}>
                            <span className={cls}>{label}</span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </section>
        )}

        {/* ==== FISIO: Solicitar vacaciones (derecha) ==== */}
        {isFisio && (
          <section className="rounded-2xl border bg-[var(--panel)] p-5 md:p-6">
            <h2 className="sec-title sec-title--big">Solicitar vacaciones</h2>

            <form
              onSubmit={submitRequest}
              className="grid gap-4 md:grid-cols-4"
              style={{ fontSize: 16 }}
            >
              {/* Inicio */}
              <div className="flex flex-col">
                <label className="text-[var(--muted)] text-sm mb-1">Inicio</label>
                <input
                  type="date"
                  className="rounded-lg border bg-[var(--bg)] px-3 py-2"
                  value={reqStart}
                  onChange={(e) => setReqStart(e.target.value)}
                  required
                />
              </div>

              {/* Fin */}
              <div className="flex flex-col">
                <label className="text-[var(--muted)] text-sm mb-1">Fin</label>
                <input
                  type="date"
                  className="rounded-lg border bg-[var(--bg)] px-3 py-2"
                  value={reqEnd}
                  onChange={(e) => setReqEnd(e.target.value)}
                  required
                />
              </div>

              {/* Comentario (una columna en md+ para que quede sitio al botón) */}
              <div className="flex flex-col">
                <label className="text-[var(--muted)] text-sm mb-1">
                  Comentario (opcional)
                </label>
                <input
                  type="text"
                  className="rounded-lg border bg-[var(--bg)] px-3 py-2"
                  placeholder="Viaje familiar..."
                  value={reqMsg}
                  onChange={(e) => setReqMsg(e.target.value)}
                />
              </div>

              {/* Botón alineado con los inputs */}
              <div className="flex flex-col">
                {/* Espaciador fijo igual al alto de los labels */}
                <div className="mb-1" style={{ height: "20px" }}></div>
                <button
                  type="submit"
                  disabled={savingReq}
                  className="h-[42px] px-4 rounded-xl border hover:bg-[var(--panel-hover)]"
                >
                  {savingReq ? "Enviando..." : "Enviar solicitud"}
                </button>
              </div>
            </form>
          </section>
        )}

      </div>

      {/* ==== FILTRAR (admin, ancho completo) ==== */}
      {isAdmin && (
        <section className="rounded-2xl border bg-[var(--panel)] p-5 md:p-6 mb-6">
          <h2 className="sec-title sec-title--big">Filtrar</h2>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">
              Fisioterapeuta
            </label>
            <select
              className="w-full rounded-xl border bg-transparent px-3 py-2"
              value={selectedFisioId}
              onChange={(e) => setSelectedFisioId(e.target.value)}
            >
              <option value="ALL">Todos</option>
              {fisios.map((f) => (
                <option key={f._id} value={f._id}>
                  {(f.nombre || "") + (f.apellidos ? " " + f.apellidos : "")}
                </option>
              ))}
            </select>
          </div>
        </section>
      )}

      {/* Calendario */}
      <div className="calendar-block mt-8" style={{ marginBottom: 24 }}>
        {errorVac && <p className="text-red-500">{errorVac}</p>}
        {loadingVac ? (
          <div className="rounded-2xl p-6 border bg-[var(--panel)] text-[var(--muted)]">
            Cargando calendario…
          </div>
        ) : (
          <VacationsCalendar events={filteredEvents} />
        )}
      </div>

      {/* ===================== TOTALES (días laborables) ===================== */}
      <section className="rounded-2xl border bg-[var(--panel)] p-5 md:p-6">
        <h2 className="sec-title sec-title--big">Totales por persona (días laborables)</h2>

        {/* Subtotal cuando hay filtro activo */}
        {isAdmin && selectedFisioId !== "ALL" && totalsFiltered && (
          <div className="mb-3">
            <div className="text-sm text-[var(--muted)] mb-1">Subtotal (filtro activo)</div>
            <div style={{ display: "grid", gap: 6 }}>
              {Object.entries(totalsFiltered).map(([name, total]) => (
                <div
                  key={`flt-${name}`}
                  style={{ display: "flex", alignItems: "center", fontSize: 15 }}
                >
                  <span>{name}</span>
                  <span style={{ opacity: 0.6, margin: "0 8px" }}>:</span> {/* ← cambia a "→" si quieres */}
                  <span style={{ opacity: 0.9 }}><strong>{total}</strong> días</span>
                </div>
              ))}
            </div>
            <hr className="my-3" />
          </div>
        )}

        {/* Totales globales */}
        <div style={{ display: "grid", gap: 6 }}>
          {Object.entries(totalsAll).map(([name, total]) => (
            <div
              key={name}
              style={{ display: "flex", alignItems: "center", fontSize: 18 }}
            >
              <span>{name}</span>
              <span style={{ opacity: 0.6, margin: "0 8px" }}>→</span> {/* cambia a "→" si prefieres */}
              <span style={{ opacity: 0.9 }}><strong>{total}</strong> días</span>
            </div>
          ))}
        </div>

        {/*
  <p className="mt-4 text-xs text-[var(--muted)]">
    * El cálculo excluye sábados, domingos y festivos definidos en el archivo. Puedes
    añadir/editar festivos en la constante <code>HOLIDAYS_2025</code>.
  </p>
  */}
      </section>


      {/* Lista (vacaciones aprobadas) */}
      <div style={{ marginTop: 50, marginBottom: 60 }}>
        <VacationsList reloadKey={reloadKey} />
      </div>
    </div>
  );
}
