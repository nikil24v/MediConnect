import { useEffect, useState } from "react";
import { appointmentApi } from "../../api/endpoints.js";
import Badge from "../../components/Badge.jsx";
import Spinner from "../../components/Spinner.jsx";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    appointmentApi
      .list(statusFilter ? { status: statusFilter } : undefined)
      .then(setAppointments)
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">All Appointments</h1>
        <select className="input w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="card mt-6 overflow-x-auto">
        {loading ? (
          <Spinner />
        ) : appointments.length === 0 ? (
          <p className="text-sm text-slate-500">No appointments found.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2">Patient</th>
                <th className="pb-2">Doctor</th>
                <th className="pb-2">Department</th>
                <th className="pb-2">Date & Time</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((a) => (
                <tr key={a._id}>
                  <td className="py-3 font-medium text-slate-700">{a.patient?.user?.name}</td>
                  <td className="py-3 text-slate-500">Dr. {a.doctor?.user?.name}</td>
                  <td className="py-3 text-slate-500">{a.department}</td>
                  <td className="py-3 text-slate-500">
                    {new Date(a.date).toLocaleDateString()} · {a.timeSlot}
                  </td>
                  <td className="py-3">
                    <Badge status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
