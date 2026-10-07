import { useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import api, { errMsg } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { initials } from "../utils/helpers";
import { SPECIALIZATIONS } from "./Register";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name || "", phone: user.phone || "", age: user.age || "", gender: user.gender || "",
    specialization: user.specialization || "", experience: user.experience || "", fee: user.fee || "",
  });
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const isDoc = user.role === "doctor";

  const save = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put("/auth/me", form);
      setUser(data);
      setMsg({ ok: true, text: "Profile updated" });
    } catch (err) {
      setMsg({ ok: false, text: errMsg(err) });
    }
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: "minmax(0, 320px) minmax(0, 1fr)", alignItems: "start" }}>
      <div className="card" style={{ textAlign: "center" }}>
        <div className="avatar avatar-lg" style={{ margin: "0 auto 12px", width: 80, height: 80, fontSize: 26 }}>{initials(user.name)}</div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{user.name}</div>
        <div className="muted small">{user.email}</div>
        <div className="mt"><span className="badge badge-brand">{isDoc ? user.specialization : "Patient"}</span></div>
      </div>

      <form className="card" onSubmit={save}>
        <div className="card-title">Edit profile</div>
        {msg && <div className={`alert ${msg.ok ? "alert-info" : "alert-error"} mb`}>{msg.ok ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}{msg.text}</div>}
        <div className="row">
          <div className="field"><label>Full name</label><input className="input" value={form.name} onChange={set("name")} required /></div>
          <div className="field"><label>Phone</label><input className="input" value={form.phone} onChange={set("phone")} /></div>
        </div>
        {isDoc ? (
          <div className="row">
            <div className="field"><label>Specialization</label>
              <select className="input" value={form.specialization} onChange={set("specialization")}>{SPECIALIZATIONS.map((s) => <option key={s}>{s}</option>)}</select></div>
            <div className="field"><label>Experience (yrs)</label><input className="input" type="number" value={form.experience} onChange={set("experience")} /></div>
            <div className="field"><label>Fee (₹)</label><input className="input" type="number" value={form.fee} onChange={set("fee")} /></div>
          </div>
        ) : (
          <div className="row">
            <div className="field"><label>Age</label><input className="input" type="number" value={form.age} onChange={set("age")} /></div>
            <div className="field"><label>Gender</label>
              <select className="input" value={form.gender} onChange={set("gender")}>
                <option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
              </select></div>
          </div>
        )}
        <button className="btn btn-primary">Save changes</button>
      </form>
    </div>
  );
}
