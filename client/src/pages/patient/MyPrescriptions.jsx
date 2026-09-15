import { useEffect, useState } from "react";
import { prescriptionApi } from "../../api/endpoints.js";
import Spinner from "../../components/Spinner.jsx";

export default function MyPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    prescriptionApi.list().then(setPrescriptions).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner full />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">My Prescriptions</h1>

      <div className="mt-6 space-y-4">
        {prescriptions.length === 0 ? (
          <p className="text-sm text-slate-500">No prescriptions on file yet.</p>
        ) : (
          prescriptions.map((p) => (
            <div key={p._id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{p.diagnosis || "Consultation"}</p>
                  <p className="text-sm text-slate-500">
                    Dr. {p.doctor?.user?.name} · {p.appointment?.department} ·{" "}
                    {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <table className="mt-4 w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-2">Medicine</th>
                    <th className="pb-2">Dosage</th>
                    <th className="pb-2">Frequency</th>
                    <th className="pb-2">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {p.medicines.map((m, i) => (
                    <tr key={i}>
                      <td className="py-2 font-medium text-slate-700">{m.name}</td>
                      <td className="py-2 text-slate-500">{m.dosage || "—"}</td>
                      <td className="py-2 text-slate-500">{m.frequency || "—"}</td>
                      <td className="py-2 text-slate-500">{m.duration || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {p.notes && <p className="mt-3 text-sm text-slate-500">Notes: {p.notes}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
