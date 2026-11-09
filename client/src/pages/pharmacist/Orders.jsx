import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import api, { errMsg } from "../../api/client";
import Empty from "../../components/Empty";
import OrderCard from "../../components/OrderCard";

const TABS = ["all", "placed", "packed", "shipped", "delivered"];

// Pharmacist: all orders, with a button to move each one to its next status
export default function PharmacistOrders() {
  const [orders, setOrders] = useState(null);
  const [tab, setTab] = useState("all");
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const load = () => api.get("/orders").then((r) => setOrders(r.data)).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, []);

  const advance = async (id) => {
    setBusyId(id);
    setError("");
    try {
      await api.post(`/orders/${id}/advance`);
    } catch (e) {
      setError(errMsg(e)); // e.g. someone else already moved this order
    }
    await load();
    setBusyId("");
  };

  if (!orders) return error ? <div className="alert alert-error">{error}</div> : <div className="loader"><div className="spinner" /></div>;
  const shown = tab === "all" ? orders : orders.filter((o) => o.status === tab);

  return (
    <>
      <div className="chips mb">
        {TABS.map((t) => (
          <button key={t} className={`chip ${tab === t ? "on" : ""}`} style={{ textTransform: "capitalize" }} onClick={() => setTab(t)}>
            {t} ({t === "all" ? orders.length : orders.filter((o) => o.status === t).length})
          </button>
        ))}
      </div>
      {error && <div className="alert alert-error mb">{error}</div>}
      {shown.length === 0 ? (
        <div className="card"><Empty icon={Package} title="No orders here" /></div>
      ) : (
        shown.map((o) => <OrderCard key={o._id} order={o} onAdvance={advance} busy={busyId === o._id} />)
      )}
    </>
  );
}
