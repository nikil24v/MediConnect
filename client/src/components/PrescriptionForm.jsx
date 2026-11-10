import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import api, { errMsg } from "../api/client";
import { today } from "../utils/helpers";
import Modal from "./Modal";
import MedicineSearch from "./MedicineSearch";

const TIMES = ["morning", "afternoon", "night"];
// `medicine` = ID of the store product when the doctor picked one from the suggestions, otherwise null (free text)
const blankMedicine = () => ({ name: "", medicine: null, dosage: "", frequency: [], durationDays: "", instructions: "" });

// Doctor's form to write (or edit) the prescription of one appointment
export default function PrescriptionForm({ appointment, onClose, onSaved }) {
  const [rxId, setRxId] = useState(null); // filled when a prescription already exists -> edit mode
  const [form, setForm] = useState({ diagnosis: "", notes: "", followUpDate: "" });
  const [meds, setMeds] = useState([blankMedicine()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // If this appointment already has a prescription, load it into the form
  useEffect(() => {
    api.get(`/prescriptions/appointment/${appointment._id}`)
      .then(({ data }) => {
        if (!data) return;
        setRxId(data._id);
        setForm({ diagnosis: data.diagnosis, notes: data.notes, followUpDate: data.followUpDate || "" });
        setMeds(data.medicines.map((m) => ({ ...m })));
      })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [appointment._id]);

  const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const setMed = (i, key, value) => setMeds((list) => list.map((m, k) => (k === i ? { ...m, [key]: value } : m)));
  const toggleTime = (i, time) => {
    const current = meds[i].frequency;
    setMed(i, "frequency", current.includes(time) ? current.filter((t) => t !== time) : [...current, time]);
  };
  const addMed = () => setMeds([...meds, blankMedicine()]);
  const removeMed = (i) => setMeds(meds.filter((_, k) => k !== i));

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const body = { ...form, appointment: appointment._id, medicines: meds.map((m) => ({ ...m, durationDays: Number(m.durationDays) })) };
      const { data } = rxId ? await api.put(`/prescriptions/${rxId}`, body) : await api.post("/prescriptions", body);
      onSaved(data);
    } catch (err) {
      setError(errMsg(err)); // the server's validation message
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal wide onClose={onClose}
      title={rxId ? "Edit prescription" : "Write prescription"}
      subtitle={`Patient: ${appointment.patient?.name}`}>
      {loading ? <div className="loader"><div className="spinner" /></div> : (
        <form onSubmit={save}>
          <div className="field">
            <label>Diagnosis *</label>
            <input className="input" value={form.diagnosis} onChange={setField("diagnosis")} placeholder="e.g. Viral fever" required />
          </div>

          <div className="card-title">Medicines</div>
          {meds.map((m, i) => (
            <div key={i} className="card mb" style={{ boxShadow: "none", background: "#f8fafc", padding: 16 }}>
              <div className="flex between mb">
                <strong className="small">Medicine {i + 1}</strong>
                {meds.length > 1 && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeMed(i)} title="Remove"><Trash2 size={16} /></button>
                )}
              </div>
              <div className="row">
                <div className="field"><label>Name *</label>
                  <MedicineSearch value={m.name} medicineId={m.medicine} placeholder="Type to search the store, e.g. Ceti" required
                    onType={(text) => setMeds((list) => list.map((x, k) => (k === i ? { ...x, name: text, medicine: null } : x)))} // typing again forgets the picked product
                    onPick={(p) => setMeds((list) => list.map((x, k) => (k === i ? { ...x, name: p.name, medicine: p._id } : x)))} /></div>
                <div className="field"><label>Dosage</label>
                  <input className="input" value={m.dosage} onChange={(e) => setMed(i, "dosage", e.target.value)} placeholder="e.g. 500 mg" /></div>
              </div>
              <div className="field">
                <label>Take it in the *</label>
                <div className="chips">
                  {TIMES.map((t) => (
                    <button type="button" key={t} className={`chip ${m.frequency.includes(t) ? "on" : ""}`}
                      onClick={() => toggleTime(i, t)} style={{ textTransform: "capitalize" }}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="row">
                <div className="field"><label>Number of days *</label>
                  <input className="input" type="number" min="1" max="365" value={m.durationDays} onChange={(e) => setMed(i, "durationDays", e.target.value)} required /></div>
                <div className="field"><label>Instructions</label>
                  <input className="input" list="rx-instructions" value={m.instructions} onChange={(e) => setMed(i, "instructions", e.target.value)} placeholder="e.g. after food" /></div>
              </div>
            </div>
          ))}
          <datalist id="rx-instructions">
            <option value="after food" /><option value="before food" /><option value="with food" />
            <option value="on an empty stomach" /><option value="at bedtime" />
          </datalist>
          <button type="button" className="btn btn-outline btn-sm mb" onClick={addMed}><Plus size={15} /> Add another medicine</button>

          <div className="field">
            <label>Notes for the patient</label>
            <textarea className="input" value={form.notes} onChange={setField("notes")} placeholder="Advice, tests to take, diet…" />
          </div>
          <div className="field">
            <label>Follow-up date (optional)</label>
            <input className="input" type="date" min={today()} value={form.followUpDate} onChange={setField("followUpDate")} />
          </div>

          {/* Shown next to the Save button so the doctor sees it without scrolling */}
          {error && <div className="alert alert-error mb">{error}</div>}
          <button className="btn btn-primary btn-block" disabled={saving}>
            {saving ? "Saving…" : rxId ? "Save changes" : "Save prescription & complete visit"}
          </button>
        </form>
      )}
    </Modal>
  );
}
