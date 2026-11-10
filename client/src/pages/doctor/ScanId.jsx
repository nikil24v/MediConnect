import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScanLine } from "lucide-react";

// Doctor types the Health ID shown on the patient's card
export default function ScanId() {
  const [id, setId] = useState("");
  const nav = useNavigate();

  const open = (e) => {
    e.preventDefault();
    if (id.trim()) nav(`/scan/${id.trim()}`);
  };

  return (
    <form className="card" style={{ maxWidth: 520 }} onSubmit={open}>
      <div className="card-title">Open a patient's health record</div>
      <p className="muted small mb">
        Scan the QR code on the patient's health card with your phone camera, or type the Health ID printed below it.
      </p>
      <div className="field">
        <label>Health ID</label>
        <input className="input" value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g. MC-26-7K4P9Q" required autoCapitalize="characters" />
      </div>
      <button className="btn btn-primary"><ScanLine size={16} /> Open record</button>
    </form>
  );
}
