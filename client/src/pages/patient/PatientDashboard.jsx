import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { appointmentApi, prescriptionApi, orderApi } from "../../api/endpoints.js";
import { useAuth } from "../../context/AuthContext.jsx";
import StatCard from "../../components/StatCard.jsx";
import Badge from "../../components/Badge.jsx";
import Spinner from "../../components/Spinner.jsx";

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([appointmentApi.list(), prescriptionApi.list(), orderApi.list()])
      .then(([a, p, o]) => {
        setAppointments(a);
        setPrescriptions(p);
        setOrders(o);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner full />;

  const upcoming = appointments.filter((a) => ["pending", "confirmed"].includes(a.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Welcome, {user.name.split(" ")[0]}</h1>
        <p className="text-sm text-slate-500">Here's an overview of your care.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Upcoming appointments" value={upcoming.length} />
        <StatCard label="Prescriptions on file" value={prescriptions.length} accent="slate" />
        <StatCard label="Pharmacy orders" value={orders.length} accent="slate" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Upcoming appointments</h2>
            <Link to="/patient/book" className="text-sm font-semibold text-brand-600">
              Book new
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-500">No upcoming appointments.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcoming.slice(0, 5).map((a) => (
                <li key={a._id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-700">
                      Dr. {a.doctor?.user?.name} · {a.department}
                    </p>
                    <p className="text-slate-500">
                      {new Date(a.date).toLocaleDateString()} at {a.timeSlot}
                    </p>
                  </div>
                  <Badge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="mb-3 font-semibold text-slate-800">Recent prescriptions</h2>
          {prescriptions.length === 0 ? (
            <p className="text-sm text-slate-500">No prescriptions yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {prescriptions.slice(0, 5).map((p) => (
                <li key={p._id} className="py-2 text-sm">
                  <p className="font-medium text-slate-700">{p.diagnosis || "Consultation"}</p>
                  <p className="text-slate-500">
                    Dr. {p.doctor?.user?.name} · {p.medicines.length} medicine(s)
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
