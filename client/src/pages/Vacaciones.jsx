import { useEffect, useMemo, useState } from "react";

import VacationForm from "../components/vacations/VacationForm.jsx";
import VacationsCalendar from "../components/vacations/VacationsCalendar.jsx";
import VacationsList from "../components/vacations/VacationsList.jsx";

import {
  apiListVacations,
  apiListFisioterapeutasSimple,
  apiCreateVacationRequest,
  apiListMyVacationRequests,
  apiListPendingVacationRequests,
  apiResolveVacationRequest,
} from "../api";

import { getUser } from "../auth";

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
  // Info usuario logado
  const me = getUser(); // {id,name,email,role}
  const role = (me?.role || "").toLowerCase();
  const isAdmin = role === "admin";
  const isFisio = role === "fisioterapeuta";

  // estado común
  const [reloadKey, setReloadKey] = useState(0);
  const [items, setItems] = useState([]); // vacaciones aprobadas
  const [fisios, setFisios] = useState([]); // lista fisios (solo usará admin)
  const [loadingVac, setLoadingVac] = useState(true);
  const [errorVac, setErrorVac] = useState("");

  // filtro solo visible para admin
  const [selectedFisioId, setSelectedFisioId] = useState("ALL");

  // ---- solicitudes (nuevo)
  const [myRequests, setMyRequests] = useState([]); // para fisio
  const [pendingRequests, setPendingRequests] = useState([]); // para admin
  const [reqStart, setReqStart] = useState("");
  const [reqEnd, setReqEnd] = useState("");
  const [reqMsg, setReqMsg] = useState("");
  const [savingReq, setSavingReq] = useState(false);
  const [errReq, setErrReq] = useState("");

  // 1. cargar vacaciones aprobadas
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

  // 2. cargar fisios (solo tiene sentido para admin, que puede crear vacaciones directas)
  useEffect(() => {
    if (!isAdmin) return;
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
        console.warn("No se pudieron cargar fisios:", e);
      }
    })();
    return () => { mounted = false; };
  }, [isAdmin]);

  // 3. cargar mis solicitudes (si soy fisio)
  useEffect(() => {
    if (!isFisio) return;
    let mounted = true;
    (async () => {
      try {
        const list = await apiListMyVacationRequests();
        if (mounted) setMyRequests(list);
      } catch (e) {
        console.warn("No se pudieron cargar tus solicitudes:", e);
      }
    })();
    return () => { mounted = false; };
  }, [isFisio, reloadKey]);

  // 4. cargar solicitudes pendientes (si soy admin)
  useEffect(() => {
    if (!isAdmin) return;
    let mounted = true;
    (async () => {
      try {
        const list = await apiListPendingVacationRequests();
        if (mounted) setPendingRequests(list);
      } catch (e) {
        console.warn("No se pudieron cargar las solicitudes pendientes:", e);
      }
    })();
    return () => { mounted = false; };
  }, [isAdmin, reloadKey]);

  // preparar eventos calendario
  const events = useMemo(() => {
    return (items || []).map((v) => {
      const fisioName = v?.fisio?.nombre
        ? `${v.fisio.nombre}${v.fisio.apellidos ? " " + v.fisio.apellidos : ""}`
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

  // filtro calendario (solo si admin usa dropdown)
  const filteredEvents = useMemo(() => {
    if (!isAdmin) {
      // el fisio ya recibe backend filtrado, así que no filtramos más
      return events;
    }
    if (selectedFisioId === "ALL") return events;
    return events.filter(
      (e) => (e.fisioId || "").toString() === selectedFisioId
    );
  }, [events, isAdmin, selectedFisioId]);

  // enviar solicitud de vacaciones (fisio)
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
      // limpio formulario
      setReqStart("");
      setReqEnd("");
      setReqMsg("");
      // recargo
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
      // recargar todo
      setReloadKey((x) => x + 1);
    } catch (err) {
      console.error(err);
      alert("No se pudo actualizar la solicitud");
    }
  }

  return (
    <div className="vacaciones-page space-y-6" style={{ paddingTop: 16 }}>
      <h1 className="page-title">Vacaciones</h1>

      {/* QUITAMOS el debug en producción, pero si lo quieres dejar para ti: */}
      <p style={{ fontSize: "12px", color: "#888" }}>
        role detectado: {role || "(sin rol)"}
      </p>

      {/* ==== ADMIN: Bandeja de solicitudes pendientes ==== */}
      {isAdmin && (
        <section
          className="rounded-2xl border bg-[var(--panel)] p-5 md:p-6 space-y-4"
          style={{ marginBottom: 16 }}
        >
          <h2 className="text-lg font-semibold text-[var(--text)]">
            Solicitudes pendientes
          </h2>

          {pendingRequests.length === 0 ? (
            <p className="text-[var(--muted)] text-sm">
              No hay solicitudes pendientes.
            </p>
          ) : (
            <table
              style={{
                width: "100%",
                fontSize: 14,
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
                  <tr
                    key={r._id}
                    style={{
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    <td style={{ padding: "6px 4px" }}>
                      {r?.fisio
                        ? `${r.fisio.nombre || ""} ${
                            r.fisio.apellidos || ""
                          }`
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
                      <button
                        className="mr-2 px-2 py-1 rounded border text-xs"
                        onClick={() => resolveRequest(r._id, "approve")}
                      >
                        Aprobar
                      </button>
                      <button
                        className="px-2 py-1 rounded border text-xs"
                        onClick={() => resolveRequest(r._id, "reject")}
                      >
                        Rechazar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* ==== FISIO: Formulario para solicitar vacaciones ==== */}
      {isFisio && (
        <section
          className="rounded-2xl border bg-[var(--panel)] p-5 md:p-6 space-y-4"
          style={{ marginBottom: 16 }}
        >
          <h2 className="text-lg font-semibold text-[var(--text)]">
            Solicitar vacaciones
          </h2>

          <form
            onSubmit={submitRequest}
            className="grid gap-4 md:grid-cols-4"
            style={{ fontSize: 14 }}
          >
            <div className="flex flex-col">
              <label className="text-[var(--muted)] text-sm mb-1">
                Inicio
              </label>
              <input
                type="date"
                className="rounded-lg border bg-[var(--bg)] px-3 py-2"
                value={reqStart}
                onChange={(e) => setReqStart(e.target.value)}
                required
              />
            </div>

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

            <div className="flex flex-col md:col-span-2">
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

            <div className="md:col-span-4">
              {errReq && (
                <p className="text-red-500 text-sm mb-2">{errReq}</p>
              )}
              <button
                type="submit"
                disabled={savingReq}
                className="px-4 py-2 rounded-xl border hover:bg-[var(--panel-hover)]"
              >
                {savingReq ? "Enviando..." : "Enviar solicitud"}
              </button>
            </div>
          </form>

          {/* Mis solicitudes */}
          <div className="rounded-xl border bg-[var(--panel)] p-4">
            <h3 className="font-semibold text-[var(--text)] text-base mb-3">
              Mis solicitudes
            </h3>
            {myRequests.length === 0 ? (
              <p className="text-[var(--muted)] text-sm">
                Aún no has solicitado vacaciones.
              </p>
            ) : (
              <table
                style={{
                  width: "100%",
                  fontSize: 14,
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
                  {myRequests.map((r) => (
                    <tr
                      key={r._id}
                      style={{
                        borderTop: "1px solid var(--border)",
                      }}
                    >
                      <td style={{ padding: "6px 4px" }}>
                        {new Date(r.startDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "6px 4px" }}>
                        {new Date(r.endDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "6px 4px", maxWidth: 220 }}>
                        {r.message || "—"}
                      </td>
                      <td style={{ padding: "6px 4px" }}>
                        {r.status === "pending" && "Pendiente"}
                        {r.status === "approved" && "Aprobada ✅"}
                        {r.status === "rejected" && "Rechazada ❌"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {/* ==== ADMIN: Formulario crear vacaciones directas ==== */}
      {isAdmin && (
        <section className="form-card mb-10">
          <VacationForm
            role={"admin"}
            fisios={fisios}
            onCreated={() => setReloadKey((x) => x + 1)}
          />
        </section>
      )}

      {/* ==== Filtro por fisio (solo tiene sentido visual para admin) ==== */}
      {isAdmin && (
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
                  {(f.nombre || "") + (f.apellidos ? " " + f.apellidos : "")}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Calendario */}
      <div className="calendar-block mt-6">
        {errorVac && <p className="text-red-500">{errorVac}</p>}

        {loadingVac ? (
          <div className="rounded-2xl p-6 border bg-[var(--panel)] text-[var(--muted)]">
            Cargando calendario…
          </div>
        ) : (
          <VacationsCalendar events={filteredEvents} />
        )}
      </div>

      {/* Lista (vacaciones aprobadas con posible borrar según backend) */}
      <VacationsList reloadKey={reloadKey} />
    </div>
  );
}
