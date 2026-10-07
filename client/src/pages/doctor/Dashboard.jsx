import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Clock, CheckCircle2, Users } from "lucide-react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { fmtDate, fmtTime, initials, today } from "../../utils/helpers";
import Empty from "../../components/Empty";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appts, setAppts] = useState([]);

  useEffect(() => { api.get("/appointments").then((r) => setAppts(r.data)).catch(() => {}); }, []);

  const todays = appts.filter((a) => a.date === today() && a.status !== "cancelled").sort((a, b) => a.time.localeCompare(b.time));
  const pending = appts.filter((a) => a.status === "pending");
  const patients = new Set(appts.map((a) => a.patient?._id)).size;
  const stats = [
    { label: "Today's visits", value: todays.length, icon: CalendarDays, color: "i-teal" },
    { label: "Pending requests", value: pending.length, icon: Clock, color: "i-amber" },
    { label: "Completed", value: appts.filter((a) => a.status === "completed").length, icon: CheckCircle2, color: "i-green" },
    { label: "Total patients", value: patients, icon: Users, color: "i-indigo" },
  ];

  const Row = ({ a }) => (
    <div className="list-item">
      <div className="avatar">{initials(a.patient?.name)}</div>
      <div className="grow">
        <div className="title">{a.patient?.name}</div>
        <div className="small muted">{fmtDate(a.date)}, {fmtTime(a.time)} {a.prediction && "· AI report attached"}</div>
      </div>
      <span className={`badge badge-${a.status}`}>{a.status}</span>
    </div>
  );

  return (
    <>
      <div className="card welcome mb">
        <h2>Good day, {user.name} 🩺</h2>
        <p>You have {todays.length} visit{todays.length !== 1 && "s"} today and {pending.length} request{pending.length !== 1 && "s"} waiting for confirmation.</p>
        <div className="mt"><Link to="/appointments" className="btn btn-outline">Manage appointments</Link></div>
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
          <div className="card-title">Today's schedule</div>
          {todays.length ? todays.map((a) => <Row key={a._id} a={a} />) : <Empty icon={CalendarDays} title="No visits today" />}
        </div>
        <div className="card">
          <div className="card-title">Pending requests <Link to="/appointments" className="small" style={{ color: "var(--brand)" }}>Review</Link></div>
          {pending.length ? pending.slice(0, 5).map((a) => <Row key={a._id} a={a} />) : <Empty icon={Clock} title="All caught up" />}
        </div>
      </div>
    </>
  );
}
