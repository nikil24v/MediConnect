import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On page load: if a token exists, fetch the logged-in user
  useEffect(() => {
    const token = localStorage.getItem("mc_token");
    if (!token) return setLoading(false);
    api.get("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem("mc_token"))
      .finally(() => setLoading(false));
  }, []);

  const saveSession = ({ token, user }) => {
    localStorage.setItem("mc_token", token);
    setUser(user);
    return user;
  };

  const login = async (email, password) => saveSession((await api.post("/auth/login", { email, password })).data);
  const register = async (data) => saveSession((await api.post("/auth/register", data)).data);
  const logout = () => {
    localStorage.removeItem("mc_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
