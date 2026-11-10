import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Boxes, PackageX, Pill, Search } from "lucide-react";
import api, { errMsg } from "../../api/client";
import { LOW_STOCK, rupees } from "../../utils/helpers";
import Empty from "../../components/Empty";

// Pharmacist: every store medicine with its stock. Change a number and press Save. Low stock is highlighted.
export default function Inventory() {
  const [medicines, setMedicines] = useState(null);
  const [edits, setEdits] = useState({}); // medicine id -> the number being typed (only for rows that were changed)
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | low | out

  useEffect(() => {
    api.get("/medicines").then((r) => setMedicines(r.data)).catch((e) => setError(errMsg(e)));
  }, []);

  const level = (stock) => (stock === 0 ? "out" : stock <= LOW_STOCK ? "low" : "ok");

  const counts = useMemo(() => {
    const list = medicines || [];
    return { all: list.length, low: list.filter((m) => level(m.stock) === "low").length, out: list.filter((m) => m.stock === 0).length };
  }, [medicines]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (medicines || []).filter(
      (m) => (!q || m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)) &&
        (filter === "all" || (filter === "out" ? m.stock === 0 : level(m.stock) === "low" || m.stock === 0))
    );
  }, [medicines, search, filter]);

  const save = async (m) => {
    setError("");
    setSavingId(m._id);
    try {
      const { data } = await api.patch(`/medicines/${m._id}/stock`, { stock: edits[m._id] });
      setMedicines((list) => list.map((x) => (x._id === m._id ? data : x)));
      setEdits(({ [m._id]: _done, ...rest }) => rest); // this row is saved, so it is no longer "changed"
    } catch (e) {
      setError(`${m.name}: ${errMsg(e)}`);
    } finally {
      setSavingId("");
    }
  };

  if (!medicines) return error ? <div className="alert alert-error">{error}</div> : <div className="loader"><div className="spinner" /></div>;

  const FILTERS = [["all", `All (${counts.all})`], ["low", `Low stock (${counts.low + counts.out})`], ["out", `Out of stock (${counts.out})`]];

  return (
    <>
      <div className="grid grid-3 mb">
        <div className="card stat"><div className="stat-icon i-teal"><Boxes size={22} /></div><div><div className="stat-value">{counts.all}</div><div className="stat-label">Medicines</div></div></div>
        <div className="card stat"><div className="stat-icon i-amber"><AlertTriangle size={22} /></div><div><div className="stat-value">{counts.low}</div><div className="stat-label">Low stock ({LOW_STOCK} or fewer)</div></div></div>
        <div className="card stat"><div className="stat-icon i-indigo"><PackageX size={22} /></div><div><div className="stat-value">{counts.out}</div><div className="stat-label">Out of stock</div></div></div>
      </div>

      <div className="card">
        <div className="flex wrap mb" style={{ gap: 12 }}>
          <div className="search-box" style={{ flex: 1, minWidth: 220, maxWidth: 380 }}>
            <Search size={18} />
            <input className="input" placeholder="Search medicines…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="chips">
            {FILTERS.map(([key, text]) => (
              <button key={key} className={`chip ${filter === key ? "on" : ""}`} onClick={() => setFilter(key)}>{text}</button>
            ))}
          </div>
        </div>

        {error && <div className="alert alert-error mb">{error}</div>}

        {shown.length === 0 ? (
          <Empty icon={Pill} title="No medicines found" text="Try a different name or filter." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr><th>Medicine</th><th>Category</th><th>Price</th><th>Status</th><th>Stock</th><th></th></tr>
              </thead>
              <tbody>
                {shown.map((m) => {
                  const lv = level(m.stock);
                  const changed = edits[m._id] !== undefined && String(edits[m._id]) !== String(m.stock);
                  return (
                    <tr key={m._id} className={lv === "out" ? "row-out" : lv === "low" ? "row-low" : ""}>
                      <td>
                        <strong>{m.name}</strong>
                        {m.requiresPrescription && <span className="badge badge-brand" style={{ marginLeft: 8 }}>Rx</span>}
                        {m.pack && <div className="small muted">{m.pack}</div>}
                      </td>
                      <td>{m.category}</td>
                      <td>{rupees(m.price)}</td>
                      <td>
                        {lv === "out" ? <span className="badge badge-cancelled">Out of stock</span>
                          : lv === "low" ? <span className="badge badge-pending">Low stock</span>
                          : <span className="badge badge-completed">In stock</span>}
                      </td>
                      <td>
                        <input className="input stock-input" type="number" min="0" max="100000" step="1" aria-label={`Stock of ${m.name}`}
                          value={edits[m._id] ?? m.stock}
                          onChange={(e) => setEdits({ ...edits, [m._id]: e.target.value })}
                          onKeyDown={(e) => { if (e.key === "Enter" && changed) save(m); }} />
                      </td>
                      <td>
                        <button className="btn btn-primary btn-sm" disabled={!changed || savingId === m._id} onClick={() => save(m)}>
                          {savingId === m._id ? "Saving…" : "Save"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
