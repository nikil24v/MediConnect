import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AlertCircle, User, Stethoscope } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../api/client";
import AuthSide from "./AuthSide";

export const SPECIALIZATIONS = ["General Physician", "Cardiologist", "Dermatologist", "Gastroenterologist", "Neurologist", "Pulmonologist", "Endocrinologist", "Orthopedic", "Urologist", "Pediatrician"];

export default function Register() {
  const { user, register } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState("patient");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", age: "", gender: "", specialization: "", experience: "", fee: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register({ ...form, role });
      nav("/dashboard");
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <AuthSide />
      <div className="auth-form">
        <form className="inner" onSubmit={submit}>
          <h1>Create your account</h1>
          <p className="muted mb">Join MediConnect in less than a minute.</p>

          <div className="role-toggle">
            <button type="button" className={role === "patient" ? "on" : ""} onClick={() => setRole("patient")}><User size={16} /> Patient</button>
            <button type="button" className={role === "doctor" ? "on" : ""} onClick={() => setRole("doctor")}><Stethoscope size={16} /> Doctor</button>
          </div>

          {error && <div className="alert alert-error mb"><AlertCircle size={18} />{error}</div>}

          <div className="field"><label>Full name</label>
            <input className="input" required value={form.name} onChange={set("name")} placeholder={role === "doctor" ? "Dr. Anita Kumar" : "Your name"} /></div>
          <div className="field"><label>Email</label>
            <input className="input" type="email" required value={form.email} onChange={set("email")} placeholder="you@example.com" /></div>
          <div className="field"><label>Password</label>
            <input className="input" type="password" required minLength={6} value={form.password} onChange={set("password")} placeholder="At least 6 characters" /></div>

          {role === "patient" ? (
            <div className="row">
              <div className="field"><label>Age</label><input className="input" type="number" min="0" value={form.age} onChange={set("age")} /></div>
              <div className="field"><label>Gender</label>
                <select className="input" value={form.gender} onChange={set("gender")}>
                  <option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                </select></div>
            </div>
          ) : (
            <>
              <div className="field"><label>Specialization</label>
                <select className="input" required value={form.specialization} onChange={set("specialization")}>
                  <option value="">Select specialization</option>
                  {SPECIALIZATIONS.map((s) => <option key={s}>{s}</option>)}
                </select></div>
              <div className="row">
                <div className="field"><label>Experience (years)</label><input className="input" type="number" min="0" value={form.experience} onChange={set("experience")} /></div>
                <div className="field"><label>Consultation fee (₹)</label><input className="input" type="number" min="0" value={form.fee} onChange={set("fee")} /></div>
              </div>
            </>
          )}

          <button className="btn btn-primary btn-block btn-lg" disabled={busy}>
            {busy ? <span className="spinner" /> : `Create ${role} account`}
          </button>
          <p className="small muted mt" style={{ textAlign: "center" }}>
            Already have an account? <Link to="/login" style={{ color: "var(--brand)", fontWeight: 600 }}>Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
