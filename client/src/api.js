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

export default api;
