import { useEffect, useState } from "react";
import { patientApi } from "../../api/endpoints.js";
import Spinner from "../../components/Spinner.jsx";

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientApi.list().then(setPatients).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner full />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Patients</h1>
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-2">Name</th>
              <th className="pb-2">Email</th>
              <th className="pb-2">Phone</th>
              <th className="pb-2">Gender</th>
              <th className="pb-2">Blood Group</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.map((p) => (
              <tr key={p._id}>
                <td className="py-3 font-medium text-slate-700">{p.user?.name}</td>
                <td className="py-3 text-slate-500">{p.user?.email}</td>
                <td className="py-3 text-slate-500">{p.user?.phone || "—"}</td>
                <td className="py-3 text-slate-500 capitalize">{p.gender || "—"}</td>
                <td className="py-3 text-slate-500">{p.bloodGroup || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
