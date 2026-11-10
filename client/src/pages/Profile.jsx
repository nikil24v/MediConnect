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
  // Health record fields (patients only). Lists are typed as "a, b, c" and sent as arrays.
  const [health, setHealth] = useState({
    bloodGroup: user.bloodGroup || "",
    allergies: (user.allergies || []).join(", "),
    conditions: (user.conditions || []).join(", "),
    emergencyContact: user.emergencyContact || "",
    familyEmail: user.familyEmail || "",
    notifyFamily: Boolean(user.notifyFamily),
  });
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setH = (k) => (e) => setHealth({ ...health, [k]: e.target.value });
  const isDoc = user.role === "doctor";
  const isPatient = user.role === "patient"; // pharmacists only have a name and phone
  const toList = (text) => text.split(",").map((s) => s.trim()).filter(Boolean);

  const save = async (e) => {
    e.preventDefault();
    try {
      let payload = { name: form.name, phone: form.phone };
      if (isDoc) payload = form;
      if (isPatient) payload = { ...form, ...health, allergies: toList(health.allergies), conditions: toList(health.conditions) };
      const { data } = await api.put("/auth/me", payload);
      setUser(data);
      setMsg({ ok: true, text: "Profile updated" });
    } catch (err) {
      setMsg({ ok: false, text: errMsg(err) });
    }
  };

  return (
    <div className="grid side-grid">
      <div className="card" style={{ textAlign: "center" }}>
        <div className="avatar avatar-lg" style={{ margin: "0 auto 12px", width: 80, height: 80, fontSize: 26 }}>{initials(user.name)}</div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{user.name}</div>
        <div className="muted small">{user.email}</div>
        <div className="mt"><span className="badge badge-brand">{isDoc ? user.specialization : <span style={{ textTransform: "capitalize" }}>{user.role}</span>}</span></div>
      </div>

      <form className="card" onSubmit={save}>
        <div className="card-title">Edit profile</div>
        {msg && <div className={`alert ${msg.ok ? "alert-info" : "alert-error"} mb`}>{msg.ok ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}{msg.text}</div>}
        <div className="row">
          <div className="field"><label>Full name</label><input className="input" value={form.name} onChange={set("name")} required /></div>
          <div className="field"><label>Phone (10 digits)</label><input className="input" inputMode="numeric" maxLength={10} pattern="\d{10}" title="Enter exactly 10 digits" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} /></div>
        </div>
        {isDoc ? (
          <div className="row">
            <div className="field"><label>Specialization</label>
              <select className="input" value={form.specialization} onChange={set("specialization")}>{SPECIALIZATIONS.map((s) => <option key={s}>{s}</option>)}</select></div>
            <div className="field"><label>Experience (yrs)</label><input className="input" type="number" value={form.experience} onChange={set("experience")} /></div>
            <div className="field"><label>Fee (₹)</label><input className="input" type="number" value={form.fee} onChange={set("fee")} /></div>
          </div>
        ) : isPatient && (
          <div className="row">
            <div className="field"><label>Age</label><input className="input" type="number" value={form.age} onChange={set("age")} /></div>
            <div className="field"><label>Gender</label>
              <select className="input" value={form.gender} onChange={set("gender")}>
                <option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
              </select></div>
          </div>
        )}

        {isPatient && (
          <>
            <div className="card-title mt">Health record</div>
            <p className="muted small mb">This information appears on your Health Card QR code for doctors.</p>
            <div className="row">
              <div className="field"><label>Blood group</label>
                <select className="input" value={health.bloodGroup} onChange={setH("bloodGroup")}>
                  <option value="">Select</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => <option key={b}>{b}</option>)}
                </select></div>
              <div className="field"><label>Emergency contact</label><input className="input" value={health.emergencyContact} onChange={setH("emergencyContact")} placeholder="Name - phone number" /></div>
            </div>
            <div className="field"><label>Allergies (separate with commas)</label><input className="input" value={health.allergies} onChange={setH("allergies")} placeholder="Penicillin, Peanuts" /></div>
            <div className="field"><label>Medical conditions (separate with commas)</label><input className="input" value={health.conditions} onChange={setH("conditions")} placeholder="Asthma, Diabetes" /></div>
            <div className="field"><label>Family email (optional)</label><input className="input" type="email" value={health.familyEmail} onChange={setH("familyEmail")} placeholder="family@example.com" /></div>
            <label className="flex mb" style={{ gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={health.notifyFamily} onChange={(e) => setHealth({ ...health, notifyFamily: e.target.checked })} />
              <span>
                <strong className="small">Send reminders to family</strong>
                <span className="muted small" style={{ display: "block" }}>Your family email also gets your visit summaries and medicine reminders.</span>
              </span>
            </label>
          </>
        )}
        <button className="btn btn-primary">Save changes</button>
      </form>
    </div>
  );
}
