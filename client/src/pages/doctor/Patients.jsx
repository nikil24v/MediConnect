import { useEffect, useState } from "react";
import { appointmentApi } from "../../api/endpoints.js";
import Spinner from "../../components/Spinner.jsx";

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appointmentApi.list().then((appointments) => {
      const byId = new Map();
      appointments.forEach((a) => {
        if (a.patient?._id && !byId.has(a.patient._id)) byId.set(a.patient._id, a.patient);
      });
      setPatients([...byId.values()]);
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner full />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">My Patients</h1>
      <div className="card mt-6">
        {patients.length === 0 ? (
          <p className="text-sm text-slate-500">No patients yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {patients.map((p) => (
              <li key={p._id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-700">{p.user?.name}</p>
                  <p className="text-slate-500">{p.user?.email}</p>
                </div>
                <p className="text-slate-500">{p.gender}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
