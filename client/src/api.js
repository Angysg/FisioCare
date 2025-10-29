// Cliente Axios que apunta a tu API y añade el token automáticamente
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // http://localhost:4000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ===================== PACIENTES API HELPERS =====================
const PACIENTES_BASE = '/api/pacientes';

export async function apiListPacientes({ q = '', sort = 'alpha' } = {}) {
  const { data } = await api.get(PACIENTES_BASE, { params: { q, sort } });
  return data?.data || [];
}

export async function apiDeletePaciente(id) {
  const { data } = await api.delete(`${PACIENTES_BASE}/${id}`);
  if (data?.ok !== true && data?.deletedId !== id) {
    // tolerante con diferentes respuestas del backend
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
const FISIOS_BASE = '/api/fisios';


export async function apiListFisios({ q = '', sort = 'alpha' } = {}) {
  const { data } = await api.get(FISIOS_BASE, { params: { q, sort } });
  return data?.data || [];
}

export async function apiCreateFisio(payload) {
  const { data } = await api.post(FISIOS_BASE, payload);
  if (data?.ok !== true) throw new Error(data?.error || 'Error creando fisio');
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
  if (data?.ok !== true) throw new Error('No se pudo eliminar');
  return true;
}

export async function apiCreateFisioAccess(id, password) {
  const { data } = await api.post(`/api/fisio-access/${id}/create`, { password });
  return data; // { ok, data: { created, tempPassword } }
}

export async function apiResetFisioPassword(id, password) {
  const { data } = await api.post(`/api/fisio-access/${id}/reset`, { password });
  return data; // { ok, data: { reset, tempPassword } }
}


// ===================== VACACIONES =====================
const VAC_BASE = '/api/vacations';

export async function apiListVacations({ from, to } = {}) {
  const params = {};
  if (from) params.from = from;
  if (to)   params.to   = to;
  const { data } = await api.get(VAC_BASE, { params });
  return data?.data || [];
}

export async function apiCreateVacation({ startDate, endDate, notes = '', fisioId }) {
  const payload = { startDate, endDate, notes };
  if (fisioId) payload.fisioId = fisioId;
  const { data } = await api.post(VAC_BASE, payload);
  if (data?.ok !== true) throw new Error(data?.error || 'No se pudo crear');
  return data.data;
}

export async function apiDeleteVacation(id) {
  const { data } = await api.delete(`${VAC_BASE}/${id}`);
  if (data?.ok !== true) throw new Error(data?.error || 'No se pudo eliminar');
  return true;
}

// Fisioterapeutas (para el selector del formulario)
export async function apiListFisioterapeutasSimple() {
  // ajusta si tu endpoint real difiere:
  // puedes tener filtros ?q=&sort=alpha, etc. Usamos mínimamente.
  const { data } = await api.get(FISIOS_BASE, { params: { sort: 'alpha' } });
  const list = data?.data || data; // adapta a tu forma de respuesta
  return (list || []).map(f => ({
    _id: f._id,
    nombre: f.nombre,
    apellidos: f.apellidos,
    email: f.email,
  }));
}

// ===================== VACATION REQUESTS (solicitudes) =====================
const VAC_REQ_BASE = '/api/vacation-requests';

// Fisio crea solicitud
export async function apiCreateVacationRequest({ startDate, endDate, message }) {
  const { data } = await api.post(VAC_REQ_BASE, { startDate, endDate, message });
  return data;
}

// Fisio ve sus solicitudes
export async function apiListMyVacationRequests() {
  const { data } = await api.get(`${VAC_REQ_BASE}/mine`);
  return data?.data || [];
}

// Admin ve pendientes
export async function apiListPendingVacationRequests() {
  const { data } = await api.get(`${VAC_REQ_BASE}/pending`);
  return data?.data || [];
}

// Admin resuelve (approve / reject)
export async function apiResolveVacationRequest(id, action) {
  const { data } = await api.post(`${VAC_REQ_BASE}/${id}/resolve`, { action });
  return data;
}



export default api;
