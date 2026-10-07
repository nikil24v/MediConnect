import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { History as HistoryIcon, Trash2 } from "lucide-react";
import api from "../../api/client";
import Empty from "../../components/Empty";

export default function History() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => api.get("/predictions").then((r) => setItems(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    await api.delete(`/predictions/${id}`);
    load();
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!items.length)
    return <div className="card"><Empty icon={HistoryIcon} title="No AI checks yet" text="Your symptom check results will be saved here." action={<Link to="/symptom-checker" className="btn btn-primary btn-sm">Run a check</Link>} /></div>;

  return (
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
  );
}
