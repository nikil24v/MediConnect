import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Stethoscope, Activity, CheckCircle2, ArrowRight, Brain, Clock } from "lucide-react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { fmtDate, fmtTime, initials, today } from "../../utils/helpers";
import Empty from "../../components/Empty";

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appts, setAppts] = useState([]);
  const [preds, setPreds] = useState([]);

  useEffect(() => {
    api.get("/appointments").then((r) => setAppts(r.data)).catch(() => {});
    api.get("/predictions").then((r) => setPreds(r.data)).catch(() => {});
  }, []);

  const upcoming = appts
    .filter((a) => ["pending", "confirmed"].includes(a.status) && a.date >= today())
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const stats = [
    { label: "Upcoming visits", value: upcoming.length, icon: CalendarDays, color: "i-teal" },
    { label: "AI checks done", value: preds.length, icon: Brain, color: "i-indigo" },
    { label: "Completed visits", value: appts.filter((a) => a.status === "completed").length, icon: CheckCircle2, color: "i-green" },
    { label: "Pending approval", value: appts.filter((a) => a.status === "pending").length, icon: Clock, color: "i-amber" },
  ];
  const last = preds[0];

  return (
    <>
      <div className="card welcome mb">
        <h2>Hello, {user.name.split(" ")[0]} 👋</h2>
        <p>Not feeling well? Run a quick AI symptom check and get matched with the right specialist.</p>
        <div className="flex wrap mt">
          <Link to="/symptom-checker" className="btn btn-outline"><Stethoscope size={17} /> Check symptoms</Link>
          <Link to="/doctors" className="btn" style={{ color: "#fff", border: "1px solid rgba(255,255,255,.4)" }}>Find a doctor</Link>
        </div>
      </div>

      <div className="grid grid-4 mb">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card stat">
            <div className={`stat-icon ${color}`}><Icon size={22} /></div>
            <div><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Upcoming appointments <Link to="/appointments" className="small" style={{ color: "var(--brand)" }}>View all</Link></div>
          {upcoming.length === 0 ? (
            <Empty icon={CalendarDays} title="No upcoming appointments" action={<Link to="/doctors" className="btn btn-primary btn-sm">Book now</Link>} />
          ) : (
            upcoming.slice(0, 4).map((a) => (
              <div key={a._id} className="list-item">
                <div className="avatar">{initials(a.doctor?.name)}</div>
                <div className="grow">
                  <div className="title">{a.doctor?.name}</div>
                  <div className="small muted">{a.doctor?.specialization} · {fmtDate(a.date)}, {fmtTime(a.time)}</div>
                </div>
                <span className={`badge badge-${a.status}`}>{a.status}</span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-title">Latest AI check <Link to="/history" className="small" style={{ color: "var(--brand)" }}>History</Link></div>
          {!last ? (
            <Empty icon={Activity} title="No symptom checks yet" action={<Link to="/symptom-checker" className="btn btn-primary btn-sm">Try the AI checker</Link>} />
          ) : (
            <>
              <p className="small muted mb">{fmtDate(last.createdAt)} · {last.symptoms.length} symptoms</p>
              {last.results.map((r, i) => (
                <div key={r.disease} className={`result ${i === 0 ? "top" : ""}`}>
                  <div className="flex between"><strong>{r.disease}</strong><span className="conf">{r.confidence}%</span></div>
                  <div className="bar"><span style={{ width: `${r.confidence}%` }} /></div>
                </div>
              ))}
              <Link to="/symptom-checker" className="btn btn-outline btn-sm">New check <ArrowRight size={15} /></Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
