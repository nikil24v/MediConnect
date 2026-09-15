import { useEffect, useState } from "react";
import { prescriptionApi } from "../../api/endpoints.js";
import Spinner from "../../components/Spinner.jsx";

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    prescriptionApi.list().then(setPrescriptions).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner full />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Prescriptions Issued</h1>
      <div className="mt-6 space-y-4">
        {prescriptions.length === 0 ? (
          <p className="text-sm text-slate-500">You haven't written any prescriptions yet.</p>
        ) : (
          prescriptions.map((p) => (
            <div key={p._id} className="card">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-800">{p.patient?.user?.name}</p>
                <p className="text-sm text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</p>
              </div>
              <p className="text-sm text-slate-500">{p.diagnosis}</p>
              <p className="mt-2 text-sm text-slate-600">
                {p.medicines.map((m) => m.name).join(", ")}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
