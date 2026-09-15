import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mediconnect_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Only treat this as a real logout if the token that failed is still the one in
      // storage - otherwise this is a late response for a stale request (e.g. the
      // "who am I" check from before a login that has since succeeded) and must be ignored.
      const failedToken = err.config?.headers?.Authorization?.replace("Bearer ", "");
      const currentToken = localStorage.getItem("mediconnect_token");
      if (failedToken && failedToken === currentToken) {
        localStorage.removeItem("mediconnect_token");
        localStorage.removeItem("mediconnect_user");
        window.dispatchEvent(new Event("mediconnect:unauthorized"));
      }
    }
    return Promise.reject(err);
  }
);

export default api;
