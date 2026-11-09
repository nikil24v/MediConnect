import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, Plus, Trash2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import api, { errMsg } from "../../api/client";

const TIMES = ["morning", "afternoon", "night"];
const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_ORIGINAL = 10 * 1024 * 1024; // phone photos are big; we shrink them below before sending
const blankMedicine = () => ({ name: "", dosage: "", frequency: [], durationDays: "", instructions: "" });

// Shrinks the photo to at most 1600 px and turns it into a JPEG (keeps the upload small and fast)
async function shrink(file) {
  const bitmap = await createImageBitmap(file); // also applies the phone's rotation
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff"; // PNGs with a see-through background would turn black otherwise
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export default function ScanPrescription() {
  const fileInput = useRef(null);
  const [stage, setStage] = useState("pick"); // pick -> reading -> review -> saved
  const [preview, setPreview] = useState("");
  const [form, setForm] = useState({ diagnosis: "", notes: "" });
  const [meds, setMeds] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => { setStage("pick"); setPreview(""); setMeds([]); setError(""); if (fileInput.current) fileInput.current.value = ""; };

  // The patient picked a photo: check it, send it to the server, show what the AI found
  const choose = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError("");
    if (!TYPES.includes(file.type)) return setError("Please choose a JPG, PNG or WebP photo.");
    if (file.size > MAX_ORIGINAL) return setError("This photo is too large. Please choose one under 10 MB.");

    let image;
    try {
      image = await shrink(file);
    } catch {
      return setError("This image could not be opened. Please choose another photo.");
    }
    setPreview(image);
    setStage("reading");
    try {
      const { data } = await api.post("/scans", { image });
      setMeds(data.medicines.map((m) => ({ ...m, durationDays: m.durationDays || "" })));
      setForm({
        diagnosis: data.diagnosis || "",
        notes: data.doctorName ? `Prescribed by ${data.doctorName} (scanned from a photo)` : "Scanned from a photo",
      });
      setStage("review");
    } catch (err) {
      setError(errMsg(err)); // e.g. "We could not read any medicines in this photo..."
      setStage("pick");
    }
  };

  const setMed = (i, key, value) => setMeds((list) => list.map((m, k) => (k === i ? { ...m, [key]: value } : m)));
  const toggleTime = (i, time) => {
    const have = meds[i].frequency;
    setMed(i, "frequency", have.includes(time) ? have.filter((t) => t !== time) : [...have, time]);
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/scans/save", { ...form, medicines: meds.map((m) => ({ ...m, durationDays: Number(m.durationDays) })) });
      setStage("saved");
    } catch (err) {
      setError(errMsg(err)); // the server's validation message
    } finally {
      setSaving(false);
    }
  };

  if (stage === "saved")
    return (
      <div className="card" style={{ textAlign: "center", maxWidth: 560 }}>
        <CheckCircle2 size={44} color="var(--ok)" />
        <div className="card-title" style={{ justifyContent: "center", marginTop: 10 }}>Prescription saved</div>
        <p className="muted small">
          {meds.length} medicine{meds.length !== 1 && "s"} added to your records. Daily reminders start today
          (8:00 AM, 1:00 PM or 8:00 PM, matching when you take each medicine), and your family email gets them too if you turned that on.
        </p>
        <div className="flex wrap mt" style={{ justifyContent: "center" }}>
          <Link to="/history" className="btn btn-primary">View in Health History</Link>
          <button className="btn btn-outline" onClick={reset}>Scan another</button>
        </div>
      </div>
    );

  return (
    <>
      <div className="alert alert-warn mb">
        <AlertCircle size={18} style={{ flexShrink: 0 }} />
        <span>AI can make mistakes, especially with handwriting. <strong>Check every medicine, dose and number of days against your paper prescription</strong> before saving.</span>
      </div>

      {stage !== "review" && (
        <div className="card" style={{ maxWidth: 560 }}>
          <div className="card-title">Scan a prescription</div>
          <p className="muted small mb">Take a clear, well-lit photo of the whole prescription (JPG, PNG or WebP). We read the medicines for you to check.</p>
          {error && <div className="alert alert-error mb"><AlertCircle size={18} style={{ flexShrink: 0 }} /><span>{error}</span></div>}
          {preview && <img src={preview} alt="Your prescription" style={{ width: "100%", borderRadius: 12, marginBottom: 14, opacity: stage === "reading" ? 0.5 : 1 }} />}
          {stage === "reading" ? (
            <div className="flex" style={{ justifyContent: "center", padding: 8 }}>
              <span className="spinner" style={{ borderColor: "var(--brand-100)", borderTopColor: "var(--brand)" }} />
              <span className="muted">Reading your prescription…</span>
            </div>
          ) : (
            <>
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={choose} hidden />
              <button className="btn btn-primary btn-block" onClick={() => fileInput.current.click()}><Camera size={17} /> Take or choose a photo</button>
            </>
          )}
        </div>
      )}

      {stage === "review" && (
        <form onSubmit={save}>
          <div className="grid split-grid">
            <div className="card">
              <div className="card-title">Your photo</div>
              <img src={preview} alt="Your prescription" style={{ width: "100%", borderRadius: 12 }} />
              <button type="button" className="btn btn-outline btn-block btn-sm mt" onClick={reset}>Choose a different photo</button>
            </div>

            <div className="card">
              <div className="card-title"><span className="flex"><Sparkles size={18} /> Check what we read</span></div>
              <p className="muted small mb">Fix anything that is wrong. Nothing is saved until you press Save.</p>

              <div className="row">
                <div className="field"><label>Diagnosis (optional)</label><input className="input" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} /></div>
                <div className="field"><label>Notes</label><input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>

              {meds.map((m, i) => (
                <div key={i} className="card" style={{ boxShadow: "none", background: "#f8fafc", padding: 16, marginBottom: 12 }}>
                  <div className="flex between mb">
                    <strong className="small">Medicine {i + 1}</strong>
                    <button type="button" className="btn btn-ghost btn-sm" title="Remove" onClick={() => setMeds(meds.filter((_, k) => k !== i))}><Trash2 size={16} /></button>
                  </div>
                  <div className="row">
                    <div className="field"><label>Name</label><input className="input" required value={m.name} onChange={(e) => setMed(i, "name", e.target.value)} /></div>
                    <div className="field"><label>Dosage</label><input className="input" value={m.dosage} onChange={(e) => setMed(i, "dosage", e.target.value)} placeholder="500 mg" /></div>
                  </div>
                  <div className="field">
                    <label>When to take it</label>
                    <div className="chips">
                      {TIMES.map((t) => (
                        <button type="button" key={t} className={`chip ${m.frequency.includes(t) ? "on" : ""}`} style={{ textTransform: "capitalize" }} onClick={() => toggleTime(i, t)}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div className="row">
                    <div className="field">
                      <label>Number of days</label>
                      <input className="input" type="number" min="1" max="365" required value={m.durationDays} onChange={(e) => setMed(i, "durationDays", e.target.value)} />
                      {!m.durationDays && <span className="small" style={{ color: "var(--danger)" }}>Not found on the photo. Please enter it.</span>}
                    </div>
                    <div className="field"><label>Instructions</label><input className="input" value={m.instructions} onChange={(e) => setMed(i, "instructions", e.target.value)} placeholder="after food" /></div>
                  </div>
                </div>
              ))}

              <button type="button" className="btn btn-outline btn-sm" onClick={() => setMeds([...meds, blankMedicine()])}><Plus size={15} /> Add a medicine</button>

              {error && <div className="alert alert-error mt"><AlertCircle size={18} style={{ flexShrink: 0 }} /><span>{error}</span></div>}
              <div className="mt">
                <button className="btn btn-primary" disabled={saving || meds.length === 0}>{saving ? <span className="spinner" /> : "Save to my records"}</button>
              </div>
            </div>
          </div>
        </form>
      )}
    </>
  );
}
