import { useEffect, useState } from "react";
import { dashboardApi, appointmentApi } from "../../api/endpoints.js";
import { useAuth } from "../../context/AuthContext.jsx";
import StatCard from "../../components/StatCard.jsx";
import Badge from "../../components/Badge.jsx";
import Spinner from "../../components/Spinner.jsx";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardApi.doctor(), appointmentApi.list({ status: "pending" })])
      .then(([s, a]) => {
        setStats(s);
        setAppointments(a);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner full />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Welcome, Dr. {user.name.split(" ").pop()}</h1>
        <p className="text-sm text-slate-500">Here's your day at a glance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Today's appointments" value={stats.todaysAppointments} />
        <StatCard label="Pending" value={stats.pendingAppointments} accent="amber" />
        <StatCard label="Completed" value={stats.completedAppointments} accent="slate" />
        <StatCard label="Patients seen" value={stats.totalPatientsSeen} accent="slate" />
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold text-slate-800">Pending requests</h2>
        {appointments.length === 0 ? (
          <p className="text-sm text-slate-500">No pending appointment requests.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {appointments.slice(0, 6).map((a) => (
              <li key={a._id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-700">{a.patient?.user?.name}</p>
                  <p className="text-slate-500">
                    {new Date(a.date).toLocaleDateString()} · {a.timeSlot}
                  </p>
                </div>
                <Badge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
