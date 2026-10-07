import { useEffect, useState } from "react";
import { CalendarDays, Clock, Brain, Check, X, ClipboardCheck } from "lucide-react";
import api, { errMsg } from "../../api/client";
import { fmtDate, fmtTime, initials } from "../../utils/helpers";
import Empty from "../../components/Empty";
import Modal from "../../components/Modal";

const TABS = ["pending", "confirmed", "completed", "cancelled", "all"];

export default function DoctorAppointments() {
  const [appts, setAppts] = useState([]);
  const [tab, setTab] = useState("pending");
  const [open, setOpen] = useState(null); // appointment shown in modal
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => api.get("/appointments").then((r) => setAppts(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const update = async (id, body) => {
    try {
      const { data } = await api.patch(`/appointments/${id}`, body);
      setAppts((list) => list.map((a) => (a._id === id ? data : a)));
      if (open?._id === id) setOpen(data);
    } catch (e) { alert(errMsg(e)); }
  };

  const list = tab === "all" ? appts : appts.filter((a) => a.status === tab);
  const show = (a) => { setOpen(a); setNotes(a.notes || ""); };

  return (
    <div className="card">
      <div className="chips mb">
        {TABS.map((t) => (
          <button key={t} className={`chip ${tab === t ? "on" : ""}`} onClick={() => setTab(t)} style={{ textTransform: "capitalize" }}>
            {t} {t !== "all" && `(${appts.filter((a) => a.status === t).length})`}
          </button>
        ))}
      </div>

      {loading ? <div className="loader"><div className="spinner" /></div> : list.length === 0 ? (
        <Empty icon={CalendarDays} title={`No ${tab === "all" ? "" : tab} appointments`} />
      ) : (
        list.map((a) => (
          <div key={a._id} className="list-item wrap">
            <div className="avatar">{initials(a.patient?.name)}</div>
            <div className="grow">
              <div className="flex wrap"><span className="title">{a.patient?.name}</span><span className={`badge badge-${a.status}`}>{a.status}</span>
                {a.prediction && <span className="badge badge-brand"><Brain size={12} /> AI report</span>}</div>
              <div className="flex small muted" style={{ marginTop: 2 }}><CalendarDays size={14} /> {fmtDate(a.date)} <Clock size={14} /> {fmtTime(a.time)}</div>
              {a.reason && <div className="small" style={{ marginTop: 4 }}>{a.reason}</div>}
            </div>
            <div className="flex">
              <button className="btn btn-outline btn-sm" onClick={() => show(a)}>Details</button>
              {a.status === "pending" && (
                <>
                  <button className="btn btn-success btn-sm" onClick={() => update(a._id, { status: "confirmed" })}><Check size={15} /> Accept</button>
                  <button className="btn btn-danger btn-sm" onClick={() => update(a._id, { status: "cancelled" })}><X size={15} /></button>
                </>
              )}
              {a.status === "confirmed" && (
                <button className="btn btn-primary btn-sm" onClick={() => update(a._id, { status: "completed" })}><ClipboardCheck size={15} /> Complete</button>
              )}
            </div>
          </div>
        ))
      )}

      {open && (
        <Modal title={open.patient?.name} subtitle={`${fmtDate(open.date)} · ${fmtTime(open.time)}`} onClose={() => setOpen(null)}>
          <div className="grid grid-3 mb small">
            <div><div className="muted">Age</div><strong>{open.patient?.age || "-"}</strong></div>
            <div><div className="muted">Gender</div><strong style={{ textTransform: "capitalize" }}>{open.patient?.gender || "-"}</strong></div>
            <div><div className="muted">Phone</div><strong>{open.patient?.phone || "-"}</strong></div>
          </div>
          {open.reason && <p className="mb"><span className="muted small">Reason:</span><br />{open.reason}</p>}

          {open.prediction ? (
            <div className="card mb" style={{ boxShadow: "none", background: "#f8fafc", padding: 16 }}>
              <div className="flex mb"><Brain size={18} color="var(--brand)" /><strong>AI pre-screening ({open.prediction.model})</strong></div>
              <div className="chips mb">{open.prediction.symptoms.map((s) => <span key={s} className="chip">{s.replaceAll("_", " ")}</span>)}</div>
              {open.prediction.results.map((r) => (
                <div key={r.disease} style={{ marginBottom: 8 }}>
                  <div className="flex between small"><span>{r.disease}</span><strong>{r.confidence}%</strong></div>
                  <div className="bar" style={{ marginTop: 4 }}><span style={{ width: `${r.confidence}%` }} /></div>
                </div>
              ))}
            </div>
          ) : <p className="small muted mb">No AI report attached.</p>}

          <div className="field">
            <label>Doctor's notes (visible to patient)</label>
            <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Advice, tests to take, follow-up…" />
          </div>
          <button className="btn btn-primary btn-block" disabled={open.status === "cancelled"} onClick={() => update(open._id, { notes })}>Save notes</button>
        </Modal>
      )}
    </div>
  );
}
