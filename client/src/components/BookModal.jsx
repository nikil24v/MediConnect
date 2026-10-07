import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import api, { errMsg } from "../api/client";
import { TIME_SLOTS, fmtTime, today } from "../utils/helpers";
import Modal from "./Modal";

// Booking form used from "Find Doctors" and from the Symptom Checker result
export default function BookModal({ doctor, prediction, onClose, onBooked }) {
  const [date, setDate] = useState(today());
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [booked, setBooked] = useState([]); // times already taken for this doctor + date

  // Whenever the date changes, ask the server which slots are taken
  useEffect(() => {
    setTime("");
    api.get("/appointments/booked", { params: { doctor: doctor._id, date } })
      .then((r) => setBooked(r.data))
      .catch(() => setBooked([]));
  }, [date, doctor._id]);

  // A slot is unavailable if it's booked, or it's today and the time has passed
  const nowTime = new Date().toTimeString().slice(0, 5); // "14:30"
  const unavailable = (t) => booked.includes(t) || (date === today() && t <= nowTime);

  const book = async () => {
    if (!time) return setError("Please pick a time slot");
    setBusy(true);
    setError("");
    try {
      await api.post("/appointments", { doctor: doctor._id, date, time, reason, prediction: prediction?._id });
      setDone(true);
      onBooked?.();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  if (done)
    return (
      <Modal title="Appointment requested" onClose={onClose}>
        <div className="empty" style={{ padding: "10px 0 20px" }}>
          <CheckCircle2 size={52} color="var(--ok)" />
          <p style={{ fontWeight: 600, color: "#334155" }}>{doctor.name} · {date} at {fmtTime(time)}</p>
          <p className="small">The doctor will confirm your appointment soon.</p>
        </div>
        <button className="btn btn-primary btn-block" onClick={onClose}>Done</button>
      </Modal>
    );

  return (
    <Modal title={`Book ${doctor.name}`} subtitle={`${doctor.specialization}${doctor.fee ? ` · ₹${doctor.fee}` : ""}`} onClose={onClose}>
      {error && <div className="alert alert-error mb"><AlertCircle size={18} />{error}</div>}
      <div className="field">
        <label>Date</label>
        <input className="input" type="date" min={today()} value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="field">
        <label>Time slot</label>
        <div className="slots">
          {TIME_SLOTS.map((t) => (
            <button key={t} type="button" disabled={unavailable(t)}
              className={`slot ${time === t ? "on" : ""}`} onClick={() => setTime(t)}>{fmtTime(t)}</button>
          ))}
        </div>
        {TIME_SLOTS.every(unavailable) && <p className="small muted" style={{ marginTop: 6 }}>No free slots on this day. Pick another date.</p>}
      </div>
      <div className="field">
        <label>Reason for visit</label>
        <textarea className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Briefly describe your problem" />
      </div>
      {prediction && <div className="alert alert-info mb small">Your AI symptom report will be shared with the doctor.</div>}
      <button className="btn btn-primary btn-block btn-lg" onClick={book} disabled={busy}>
        {busy ? <span className="spinner" /> : "Confirm booking"}
      </button>
    </Modal>
  );
}
