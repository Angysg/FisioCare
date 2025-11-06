// Cliente Axios que apunta a tu API y añade el token automáticamente
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // p.ej. http://localhost:4000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ===================== PACIENTES =====================
const PACIENTES_BASE = "/api/pacientes";

export async function apiListPacientes({ q = "", sort = "alpha" } = {}) {
  const { data } = await api.get(PACIENTES_BASE, { params: { q, sort } });
  return data?.data || [];
}

export async function apiDeletePaciente(id) {
  const { data } = await api.delete(`${PACIENTES_BASE}/${id}`);
  if (data?.ok !== true && data?.deletedId !== id) {
    // tolerante
  }
  return true;
}

export async function apiGetPaciente(id) {
  const { data } = await api.get(`${PACIENTES_BASE}/${id}`);
  return data?.data;
}

export async function apiUpdatePaciente(id, payload) {
  const { data } = await api.put(`${PACIENTES_BASE}/${id}`, payload);
  return data?.data;
}

// ===================== FISIOS =====================
const FISIOS_BASE = "/api/fisios";

export async function apiListFisios({ q = "", sort = "alpha" } = {}) {
  const { data } = await api.get(FISIOS_BASE, { params: { q, sort } });
  return data?.data || [];
}

export async function apiCreateFisio(payload) {
  const { data } = await api.post(FISIOS_BASE, payload);
  if (data?.ok !== true) throw new Error(data?.error || "Error creando fisio");
  return data.data;
}

export async function apiGetFisio(id) {
  const { data } = await api.get(`${FISIOS_BASE}/${id}`);
  return data?.data;
}

export async function apiUpdateFisio(id, payload) {
  const { data } = await api.put(`${FISIOS_BASE}/${id}`, payload);
  return data?.data;
}

export async function apiDeleteFisio(id) {
  const { data } = await api.delete(`${FISIOS_BASE}/${id}`);
  if (data?.ok !== true) throw new Error("No se pudo eliminar");
  return true;
}

export async function apiCreateFisioAccess(id, password) {
  const { data } = await api.post(`/api/fisio-access/${id}/create`, { password });
  return data;
}

export async function apiResetFisioPassword(id, password) {
  const { data } = await api.post(`/api/fisio-access/${id}/reset`, { password });
  return data;
}

// Para selects sencillos
export async function apiListFisioterapeutasSimple() {
  const { data } = await api.get(FISIOS_BASE, { params: { sort: "alpha", limit: 1000 } });
  const raw = (data && (data.data ?? data.items ?? data.list ?? data.results ?? data)) || [];
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((f) => ({
    _id: f._id || f.id,
    nombre: f.nombre || f.firstName || "",
    apellidos: f.apellidos || f.lastName || "",
    email: f.email || "",
  }));
}

// ===================== VACACIONES =====================
const VAC_BASE = "/api/vacations";

export async function apiListVacations({ from, to, physio, fisioId } = {}) {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  // acepta cualquiera de los dos nombres
  if (physio) params.physio = physio;
  if (fisioId) params.fisioId = fisioId;

  const { data } = await api.get(VAC_BASE, { params });
  // devuelvo array “plano”, intenta varias claves por compatibilidad
  return data?.data || data?.items || data || [];
}

export async function apiCreateVacation({ startDate, endDate, notes = "", fisioId }) {
  const payload = { startDate, endDate, notes };
  if (fisioId) payload.fisioId = fisioId;
  const { data } = await api.post(VAC_BASE, payload);
  if (data?.ok !== true) throw new Error(data?.error || "No se pudo crear");
  return data.data || data;
}

export async function apiDeleteVacation(id) {
  const { data } = await api.delete(`${VAC_BASE}/${id}`);
  if (data?.ok !== true) throw new Error(data?.error || "No se pudo eliminar");
  return true;
}

// ===================== VACATION REQUESTS =====================
const VAC_REQ_BASE = "/api/vacation-requests";

export async function apiCreateVacationRequest({ startDate, endDate, message }) {
  const { data } = await api.post(VAC_REQ_BASE, { startDate, endDate, message });
  return data;
}

export async function apiListMyVacationRequests() {
  const { data } = await api.get(`${VAC_REQ_BASE}/mine`);
  return data?.data || [];
}

export async function apiListPendingVacationRequests() {
  const { data } = await api.get(`${VAC_REQ_BASE}/pending`);
  return data?.data || [];
}

export async function apiResolveVacationRequest(id, action) {
  const { data } = await api.post(`${VAC_REQ_BASE}/${id}/resolve`, { action });
  return data;
}

// ===================== SEGUIMIENTOS =====================
export async function apiListSeguimientos(params = {}) {
  const { data } = await api.get("/api/seguimientos", { params });
  return data.items || [];
}

export async function apiCountSeguimientos(params = {}) {
  const { data } = await api.get("/api/seguimientos", { params });
  return { total: data.total, page: data.page, limit: data.limit, items: data.items };
}

export async function apiGetSeguimiento(id) {
  const { data } = await api.get(`/api/seguimientos/${id}`);
  return data.data;
}

export async function apiCreateSeguimiento(payload) {
  try {
    const { data } = await api.post("/api/seguimientos", payload);
    return data.data;
  } catch (err) {
    const msg =
      err?.response?.data?.error ||
      err?.message ||
      "No se pudo crear el seguimiento";
    throw new Error(msg);
  }
}

export async function apiUpdateSeguimiento(id, payload) {
  const { data } = await api.put(`/api/seguimientos/${id}`, payload);
  return data.data;
}

export async function apiDeleteSeguimiento(id) {
  const { data } = await api.delete(`/api/seguimientos/${id}`);
  return data;
}

// ===================== CITAS =====================
const APPTS_BASE = "/api/appointments";

export async function apiListAppointments(params) {
  const { data } = await api.get(APPTS_BASE, { params });
  return data;
}
export async function apiCreateAppointment(payload) {
  const { data } = await api.post(APPTS_BASE, payload);
  return data;
}
export async function apiUpdateAppointment(id, payload) {
  const { data } = await api.put(`${APPTS_BASE}/${id}`, payload);
  return data;
}
export async function apiDeleteAppointment(id) {
  const { data } = await api.delete(`${APPTS_BASE}/${id}`);
  return data;
}
export async function apiZonesStats(params) {
  const { data } = await api.get(`${APPTS_BASE}/stats/zones`, { params });
  return data;
}

export default api;
