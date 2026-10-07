import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../api/client";
import AuthSide from "./AuthSide";

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(form.email, form.password);
      nav("/dashboard");
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const fill = (email, password) => setForm({ email, password });

  return (
    <div className="auth">
      <AuthSide />
      <div className="auth-form">
        <form className="inner" onSubmit={submit}>
          <h1>Welcome back</h1>
          <p className="muted mb">Log in to continue to MediConnect.</p>
          {error && <div className="alert alert-error mb"><AlertCircle size={18} />{error}</div>}
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" required value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••" />
          </div>
          <button className="btn btn-primary btn-block btn-lg" disabled={busy}>
            {busy ? <span className="spinner" /> : "Log in"}
          </button>
          <p className="small muted mt" style={{ textAlign: "center" }}>
            New here? <Link to="/register" style={{ color: "var(--brand)", fontWeight: 600 }}>Create an account</Link>
          </p>
          <div className="demo">
            <strong>Demo accounts</strong> (click to fill)
            <div className="flex wrap mt" style={{ marginTop: 8 }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => fill("patient@mediconnect.com", "patient123")}>Patient</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => fill("arun@mediconnect.com", "doctor123")}>Doctor</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
