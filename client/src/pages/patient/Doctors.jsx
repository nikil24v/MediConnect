import { useEffect, useState } from "react";
import { Search, Briefcase, IndianRupee, Users } from "lucide-react";
import api from "../../api/client";
import { initials } from "../../utils/helpers";
import BookModal from "../../components/BookModal";
import Empty from "../../components/Empty";

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [q, setQ] = useState("");
  const [spec, setSpec] = useState("All");
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/doctors").then((r) => setDoctors(r.data)).finally(() => setLoading(false));
  }, []);

  const specs = ["All", ...new Set(doctors.map((d) => d.specialization))];
  const list = doctors.filter(
    (d) => (spec === "All" || d.specialization === spec) && d.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <div className="card mb">
        <div className="search-box mb">
          <Search size={18} />
          <input className="input" placeholder="Search doctors by name…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="chips">
          {specs.map((s) => <button key={s} className={`chip ${spec === s ? "on" : ""}`} onClick={() => setSpec(s)}>{s}</button>)}
        </div>
      </div>

      {loading ? <div className="loader"><div className="spinner" /></div> : list.length === 0 ? (
        <div className="card"><Empty icon={Users} title="No doctors found" text="Try a different search or specialization." /></div>
      ) : (
        <div className="grid grid-3">
          {list.map((d) => (
            <div key={d._id} className="card doc-card">
              <div className="flex">
                <div className="avatar avatar-lg">{initials(d.name)}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{d.name}</div>
                  <span className="badge badge-brand">{d.specialization}</span>
                </div>
              </div>
              <div className="doc-meta">
                <span><Briefcase size={15} /> {d.experience || 0} yrs exp</span>
                <span><IndianRupee size={15} /> {d.fee || "-"} / visit</span>
              </div>
              <button className="btn btn-primary btn-block" onClick={() => setBooking(d)}>Book appointment</button>
            </div>
          ))}
        </div>
      )}

      {booking && <BookModal doctor={booking} onClose={() => setBooking(null)} />}
    </>
  );
}
