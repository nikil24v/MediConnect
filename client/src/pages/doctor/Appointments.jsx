import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { appointmentApi } from "../../api/endpoints.js";
import Badge from "../../components/Badge.jsx";
import Spinner from "../../components/Spinner.jsx";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => appointmentApi.list().then(setAppointments).finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const handleStatus = async (id, status) => {
    setError("");
    try {
      await appointmentApi.updateStatus(id, status);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not update appointment");
    }
  };

  if (loading) return <Spinner full />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">My Queue</h1>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="card mt-6 overflow-x-auto">
        {appointments.length === 0 ? (
          <p className="text-sm text-slate-500">No appointments assigned yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2">Patient</th>
                <th className="pb-2">Date & Time</th>
                <th className="pb-2">Reason</th>
                <th className="pb-2">Status</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((a) => (
                <tr key={a._id}>
                  <td className="py-3 font-medium text-slate-700">{a.patient?.user?.name}</td>
                  <td className="py-3 text-slate-500">
                    {new Date(a.date).toLocaleDateString()} · {a.timeSlot}
                  </td>
                  <td className="py-3 max-w-xs truncate text-slate-500">{a.reason || "—"}</td>
                  <td className="py-3">
                    <Badge status={a.status} />
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {a.status === "pending" && (
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          onClick={() => handleStatus(a._id, "confirmed")}
                        >
                          Confirm
                        </button>
                      )}
                      {a.status !== "completed" && a.status !== "cancelled" && (
                        <Link to={`/doctor/appointments/${a._id}`} className="btn-primary btn-sm">
                          Prescribe
                        </Link>
                      )}
                    </div>
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
