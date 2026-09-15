import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api/endpoints.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("mediconnect_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("mediconnect_token");
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((me) => {
        const merged = { id: me.id, name: me.name, email: me.email, role: me.role, profile: me.profile };
        setUser(merged);
        localStorage.setItem("mediconnect_user", JSON.stringify(merged));
      })
      .catch(() => {
        // A 401 here is already handled by the axios interceptor (it only clears storage
        // if this token is still the current one) - nothing extra to do.
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener("mediconnect:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("mediconnect:unauthorized", handleUnauthorized);
  }, []);

  // Both login and register only return { id, name, email, role } - fetch /auth/me right
  // after so `user.profile` (needed by e.g. the Patient/Doctor profile pages) is always
  // populated immediately, not just after a hard refresh triggers the mount-time check.
  const loadFullUser = async (token) => {
    localStorage.setItem("mediconnect_token", token);
    const me = await authApi.me();
    const merged = { id: me.id, name: me.name, email: me.email, role: me.role, profile: me.profile };
    localStorage.setItem("mediconnect_user", JSON.stringify(merged));
    setUser(merged);
    return merged;
  };

  const login = async (email, password) => {
    const data = await authApi.login({ email, password });
    return loadFullUser(data.token);
  };

  const register = async (payload) => {
    const data = await authApi.register(payload);
    return loadFullUser(data.token);
  };

  const logout = () => {
    localStorage.removeItem("mediconnect_token");
    localStorage.removeItem("mediconnect_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
