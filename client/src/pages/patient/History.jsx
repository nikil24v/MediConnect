import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { History as HistoryIcon, Trash2 } from "lucide-react";
import api from "../../api/client";
import { fmtDate } from "../../utils/helpers";
import Empty from "../../components/Empty";
import PrescriptionCard from "../../components/PrescriptionCard";

export default function History() {
  const [items, setItems] = useState([]); // AI symptom checks
  const [rxs, setRxs] = useState([]); // prescriptions
  const [loading, setLoading] = useState(true);

  const load = () =>
    Promise.all([api.get("/predictions"), api.get("/prescriptions")])
      .then(([p, r]) => { setItems(p.data); setRxs(r.data); })
      .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    await api.delete(`/predictions/${id}`);
    load();
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!items.length && !rxs.length)
    return <div className="card"><Empty icon={HistoryIcon} title="No history yet" text="Your prescriptions and symptom check results will be saved here." action={<Link to="/symptom-checker" className="btn btn-primary btn-sm">Run a check</Link>} /></div>;

  return (
    <>
    {rxs.length > 0 && (
      <div className="mb">
        <div className="card-title">Prescriptions</div>
        {rxs.map((rx) => (
          <div key={rx._id} className="card mb">
            <div className="flex between wrap">
              <div className="title">{rx.doctor?.name} <span className="muted small">· {rx.doctor?.specialization}</span></div>
              <div className="small muted">{fmtDate(rx.createdAt)}</div>
            </div>
            <PrescriptionCard rx={rx} canDownload canBuy />
          </div>
        ))}
      </div>
    )}

    {items.length > 0 && <div className="card-title">AI symptom checks</div>}
    <div className="grid grid-2">
      {items.map((p) => (
        <div key={p._id} className="card">
          <div className="flex between mb">
            <div>
              <div style={{ fontWeight: 700 }}>{p.results[0]?.disease}</div>
              <div className="small muted">{new Date(p.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · {p.model}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => remove(p._id)} title="Delete"><Trash2 size={16} /></button>
          </div>
          <div className="chips mb">
            {p.symptoms.map((s) => <span key={s} className="chip" style={{ cursor: "default" }}>{s.replaceAll("_", " ")}</span>)}
          </div>
          {p.results.map((r) => (
            <div key={r.disease} style={{ marginBottom: 10 }}>
              <div className="flex between small"><span>{r.disease}</span><strong>{r.confidence}%</strong></div>
              <div className="bar" style={{ marginTop: 4 }}><span style={{ width: `${r.confidence}%` }} /></div>
            </div>
          ))}
        </div>
      ))}
    </div>
    </>
  );
}
