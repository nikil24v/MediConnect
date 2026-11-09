import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingCart, Pill, FileText, Check } from "lucide-react";
import api, { errMsg } from "../../api/client";
import { useCart } from "../../context/CartContext";
import { rupees } from "../../utils/helpers";
import Empty from "../../components/Empty";

export default function Store() {
  const cart = useCart();
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { api.get("/medicines/categories").then((r) => setCategories(r.data)).catch(() => {}); }, []);

  // Reload the list when the search text or category changes (waits 300 ms while typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      api.get("/medicines", { params: { search, category } })
        .then((r) => { setMedicines(r.data); setError(""); })
        .catch((e) => setError(errMsg(e)))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category]);

  return (
    <>
      <div className="flex between wrap mb">
        <div className="search-box" style={{ flex: 1, minWidth: 220, maxWidth: 420 }}>
          <Search size={18} />
          <input className="input" placeholder="Search medicines…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Link to="/cart" className="btn btn-outline"><ShoppingCart size={17} /> Cart ({cart.count})</Link>
      </div>

      <div className="chips mb">
        <button className={`chip ${category === "" ? "on" : ""}`} onClick={() => setCategory("")}>All</button>
        {categories.map((c) => (
          <button key={c} className={`chip ${category === c ? "on" : ""}`} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>

      {error && <div className="alert alert-error mb">{error}</div>}
      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : medicines.length === 0 ? (
        <div className="card"><Empty icon={Pill} title="No medicines found" text="Try a different name or category." /></div>
      ) : (
        <div className="grid grid-3">
          {medicines.map((m) => {
            const inCart = cart.inCart(m._id);
            return (
              <div key={m._id} className="card med-card">
                <div className="flex between" style={{ alignItems: "flex-start" }}>
                  <div className="med-icon">
                    {m.imageUrl ? <img src={m.imageUrl} alt="" /> : <Pill size={22} />}
                  </div>
                  {m.requiresPrescription && <span className="badge badge-pending"><FileText size={12} /> Prescription</span>}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{m.name}</div>
                  <div className="small muted">{m.category}{m.pack && ` · ${m.pack}`}</div>
                </div>
                <div className="flex between">
                  <strong style={{ fontSize: 18 }}>{rupees(m.price)}</strong>
                  <span className={`small ${m.stock === 0 ? "out" : m.stock <= 10 ? "low" : "muted"}`}>
                    {m.stock === 0 ? "Out of stock" : m.stock <= 10 ? `Only ${m.stock} left` : "In stock"}
                  </span>
                </div>
                <button className="btn btn-primary btn-block btn-sm" disabled={m.stock === 0} onClick={() => cart.add(m._id)}>
                  {inCart ? <><Check size={15} /> In cart ({inCart}) · Add one more</> : <><ShoppingCart size={15} /> Add to cart</>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
