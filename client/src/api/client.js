import axios from "axios";

// One axios instance for the whole app.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api" });

// Attach the JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mc_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Turn server errors into a simple readable message
export const errMsg = (e) => e?.response?.data?.message || e?.message || "Something went wrong";

export default api;
