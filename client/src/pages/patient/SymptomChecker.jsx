import { useEffect, useMemo, useState } from "react";
import { Search, X, Sparkles, AlertTriangle, AlertCircle, Stethoscope, RotateCcw } from "lucide-react";
import api, { errMsg } from "../../api/client";
import { specialistFor } from "../../utils/helpers";
import BookModal from "../../components/BookModal";

const COMMON = ["high_fever", "headache", "cough", "fatigue", "vomiting", "nausea", "chills", "skin_rash", "itching", "joint_pain", "stomach_pain", "breathlessness"];

export default function SymptomChecker() {
  const [all, setAll] = useState([]);
  const [selected, setSelected] = useState([]);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    api.get("/predictions/symptoms").then((r) => setAll(r.data)).catch((e) => setError(errMsg(e)));
    api.get("/doctors").then((r) => setDoctors(r.data)).catch(() => {});
  }, []);

  const label = useMemo(() => Object.fromEntries(all.map((s) => [s.key, s.label])), [all]);
  const filtered = all.filter((s) => s.label.toLowerCase().includes(query.toLowerCase()));
  const toggle = (k) => setSelected((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));

  const predict = async () => {
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/predictions", { symptoms: selected });
      setResult(data);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const reset = () => { setSelected([]); setResult(null); setQuery(""); };

  const top = result?.results?.[0];
  const specialist = top && specialistFor(top.disease);
  const matching = doctors.filter((d) => d.specialization === specialist);

  return (
    <div className="grid grid-2" style={{ alignItems: "start" }}>
      {/* LEFT: pick symptoms */}
      <div className="card">
        <div className="card-title">1. Select your symptoms <span className="badge badge-brand">{selected.length} selected</span></div>

        {selected.length > 0 && (
          <div className="chips mb">
            {selected.map((k) => (
              <button key={k} className="chip on" onClick={() => toggle(k)}>{label[k]} <X size={13} /></button>
            ))}
          </div>
        )}

        <div className="search-box mb">
          <Search size={18} />
          <input className="input" placeholder="Search 132 symptoms… e.g. fever, cough, rash" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        {!query && (
          <>
            <p className="small muted" style={{ marginBottom: 8 }}>Common symptoms</p>
            <div className="chips mb">
              {COMMON.filter((k) => label[k]).map((k) => (
                <button key={k} className={`chip ${selected.includes(k) ? "on" : ""}`} onClick={() => toggle(k)}>{label[k]}</button>
              ))}
            </div>
            <p className="small muted" style={{ marginBottom: 8 }}>All symptoms</p>
          </>
        )}

        <div className="symptom-list chips">
          {filtered.map((s) => (
            <button key={s.key} className={`chip ${selected.includes(s.key) ? "on" : ""}`} onClick={() => toggle(s.key)}>{s.label}</button>
          ))}
          {all.length > 0 && filtered.length === 0 && <p className="small muted">No symptom matches "{query}"</p>}
        </div>

        <div className="flex mt">
          <button className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={selected.length < 2 || busy} onClick={predict}>
            {busy ? <span className="spinner" /> : <><Sparkles size={18} /> Analyse symptoms</>}
          </button>
          {selected.length > 0 && <button className="btn btn-outline btn-lg" onClick={reset} title="Reset"><RotateCcw size={18} /></button>}
        </div>
        {selected.length < 2 && <p className="small muted mt" style={{ marginTop: 8 }}>Select at least 2 symptoms for a better prediction.</p>}
      </div>

      {/* RIGHT: results */}
      <div className="card">
        <div className="card-title">2. AI prediction {result && <span className="badge badge-brand">{result.model}</span>}</div>
        {error && <div className="alert alert-error mb"><AlertCircle size={18} />{error}</div>}

        {!result ? (
          <div className="empty">
            <Sparkles size={44} />
            <p style={{ fontWeight: 600, color: "#334155" }}>Your results will appear here</p>
            <p className="small">Pick your symptoms on the left and click “Analyse symptoms”.</p>
          </div>
        ) : (
          <>
            {result.results.map((r, i) => (
              <div key={r.disease} className={`result ${i === 0 ? "top" : ""}`}>
                <div className="flex between">
                  <div>
                    {i === 0 && <div className="small" style={{ color: "var(--brand)", fontWeight: 700 }}>MOST LIKELY</div>}
                    <strong style={{ fontSize: i === 0 ? 18 : 15 }}>{r.disease}</strong>
                  </div>
                  <span className="conf">{r.confidence}%</span>
                </div>
                <div className="bar"><span style={{ width: `${r.confidence}%` }} /></div>
              </div>
            ))}

            <div className="card" style={{ boxShadow: "none", background: "#f8fafc", padding: 16 }}>
              <div className="flex"><Stethoscope size={18} color="var(--brand)" /><strong>Recommended: {specialist}</strong></div>
              {matching.length ? (
                matching.map((d) => (
                  <div key={d._id} className="list-item">
                    <div className="grow"><div className="title">{d.name}</div><div className="small muted">{d.experience || 0} yrs · ₹{d.fee || "-"}</div></div>
                    <button className="btn btn-primary btn-sm" onClick={() => setBooking(d)}>Book</button>
                  </div>
                ))
              ) : (
                <p className="small muted mt" style={{ marginTop: 8 }}>No {specialist} available right now. Try “Find Doctors”.</p>
              )}
            </div>

            <div className="alert alert-warn mt"><AlertTriangle size={18} style={{ flexShrink: 0 }} />{result.disclaimer}</div>
          </>
        )}
      </div>

      {booking && <BookModal doctor={booking} prediction={result} onClose={() => setBooking(null)} />}
    </div>
  );
}
