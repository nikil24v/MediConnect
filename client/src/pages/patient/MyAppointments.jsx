import { useEffect, useState } from "react";
import { appointmentApi } from "../../api/endpoints.js";
import Badge from "../../components/Badge.jsx";
import Spinner from "../../components/Spinner.jsx";

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => appointmentApi.list().then(setAppointments).finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const handleCancel = async (id) => {
    try {
      await appointmentApi.updateStatus(id, "cancelled");
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not cancel appointment");
    }
  };

  if (loading) return <Spinner full />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">My Appointments</h1>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="card mt-6 overflow-x-auto">
        {appointments.length === 0 ? (
          <p className="text-sm text-slate-500">No appointments yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2">Doctor</th>
                <th className="pb-2">Department</th>
                <th className="pb-2">Date & Time</th>
                <th className="pb-2">Status</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((a) => (
                <tr key={a._id}>
                  <td className="py-3 font-medium text-slate-700">Dr. {a.doctor?.user?.name}</td>
                  <td className="py-3 text-slate-500">{a.department}</td>
                  <td className="py-3 text-slate-500">
                    {new Date(a.date).toLocaleDateString()} · {a.timeSlot}
                  </td>
                  <td className="py-3">
                    <Badge status={a.status} />
                  </td>
                  <td className="py-3 text-right">
                    {["pending", "confirmed"].includes(a.status) && (
                      <button
                        type="button"
                        className="btn-danger btn-sm"
                        onClick={() => handleCancel(a._id)}
                      >
                        Cancel
                      </button>
                    )}
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
