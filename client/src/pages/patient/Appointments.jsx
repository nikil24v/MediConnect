import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Clock, FileText } from "lucide-react";
import api, { errMsg } from "../../api/client";
import { fmtDate, fmtTime, initials } from "../../utils/helpers";
import Empty from "../../components/Empty";

const TABS = ["all", "pending", "confirmed", "completed", "cancelled"];

export default function PatientAppointments() {
  const [appts, setAppts] = useState([]);
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = () => api.get("/appointments").then((r) => setAppts(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    try { await api.patch(`/appointments/${id}`, { status: "cancelled" }); load(); }
    catch (e) { alert(errMsg(e)); }
  };

  const list = tab === "all" ? appts : appts.filter((a) => a.status === tab);

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
        <Empty icon={CalendarDays} title="No appointments here" action={<Link to="/doctors" className="btn btn-primary btn-sm">Book a doctor</Link>} />
      ) : (
        list.map((a) => (
          <div key={a._id} className="list-item" style={{ alignItems: "flex-start" }}>
            <div className="avatar">{initials(a.doctor?.name)}</div>
            <div className="grow">
              <div className="flex wrap"><span className="title">{a.doctor?.name}</span><span className={`badge badge-${a.status}`}>{a.status}</span></div>
              <div className="small muted">{a.doctor?.specialization}</div>
              <div className="flex small muted" style={{ marginTop: 4 }}>
                <CalendarDays size={14} /> {fmtDate(a.date)} <Clock size={14} /> {fmtTime(a.time)}
              </div>
              {a.reason && <div className="small" style={{ marginTop: 6 }}>Reason: {a.reason}</div>}
              {a.notes && <div className="alert alert-info small" style={{ marginTop: 8 }}><FileText size={16} /> Doctor's note: {a.notes}</div>}
            </div>
            {["pending", "confirmed"].includes(a.status) && (
              <button className="btn btn-danger btn-sm" onClick={() => cancel(a._id)}>Cancel</button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
