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

export async function apiListVacaciones({ from, to, fisioId } = {}) {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  if (fisioId) params.fisioId = fisioId;
  const { data } = await api.get(VAC_BASE, { params });
  return data?.data || [];
}

export async function apiListVacacionesDeFisio(fisioId) {
  const { data } = await api.get(`${VAC_BASE}/fisios/${fisioId}`);
  return data?.data || [];
}

export async function apiCreateVacacion(fisioId, payload) {
  const { data } = await api.post(`${VAC_BASE}/fisios/${fisioId}`, payload);
  if (data?.ok !== true) throw new Error(data?.error || 'Error creando vacaciones');
  return data.data;
}

export async function apiDeleteVacacion(fisioId, vacId) {
  const { data } = await api.delete(`${VAC_BASE}/fisios/${fisioId}/${vacId}`);
  if (data?.ok !== true) throw new Error(data?.error || 'Error eliminando vacaciones');
  return true;
}


export default api;
