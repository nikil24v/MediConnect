import api from "./axios.js";

export const authApi = {
  register: (data) => api.post("/auth/register", data).then((r) => r.data),
  login: (data) => api.post("/auth/login", data).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
};

export const metaApi = {
  departments: () => api.get("/meta/departments").then((r) => r.data),
};

export const doctorApi = {
  list: (params) => api.get("/doctors", { params }).then((r) => r.data),
  get: (id) => api.get(`/doctors/${id}`).then((r) => r.data),
  create: (data) => api.post("/doctors", data).then((r) => r.data),
  update: (id, data) => api.patch(`/doctors/${id}`, data).then((r) => r.data),
  setActive: (id, isActive) =>
    api.patch(`/doctors/${id}/active`, { isActive }).then((r) => r.data),
};

export const patientApi = {
  list: () => api.get("/patients").then((r) => r.data),
  get: (id) => api.get(`/patients/${id}`).then((r) => r.data),
  update: (id, data) => api.patch(`/patients/${id}`, data).then((r) => r.data),
};

export const appointmentApi = {
  list: (params) => api.get("/appointments", { params }).then((r) => r.data),
  get: (id) => api.get(`/appointments/${id}`).then((r) => r.data),
  create: (data) => api.post("/appointments", data).then((r) => r.data),
  updateStatus: (id, status) =>
    api.patch(`/appointments/${id}/status`, { status }).then((r) => r.data),
};

export const prescriptionApi = {
  list: () => api.get("/prescriptions").then((r) => r.data),
  get: (id) => api.get(`/prescriptions/${id}`).then((r) => r.data),
  create: (data) => api.post("/prescriptions", data).then((r) => r.data),
};

export const medicineApi = {
  list: (params) => api.get("/medicines", { params }).then((r) => r.data),
  create: (data) => api.post("/medicines", data).then((r) => r.data),
  update: (id, data) => api.patch(`/medicines/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/medicines/${id}`).then((r) => r.data),
};

export const orderApi = {
  list: (params) => api.get("/orders", { params }).then((r) => r.data),
  create: (data) => api.post("/orders", data).then((r) => r.data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }).then((r) => r.data),
};

export const dashboardApi = {
  admin: () => api.get("/dashboard/admin").then((r) => r.data),
  doctor: () => api.get("/dashboard/doctor").then((r) => r.data),
};
