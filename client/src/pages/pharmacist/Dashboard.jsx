import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PackagePlus, PackageCheck, Truck, CheckCircle2, Package } from "lucide-react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { fmtDateTime, orderNo, rupees, LOW_STOCK } from "../../utils/helpers";
import Empty from "../../components/Empty";

export default function PharmacistDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  useEffect(() => {
    api.get("/orders").then((r) => setOrders(r.data)).catch(() => {});
    api.get("/medicines").then((r) => setLowStock(r.data.filter((m) => m.stock <= LOW_STOCK))).catch(() => {});
  }, []);

  const count = (status) => orders.filter((o) => o.status === status).length;
  const stats = [
    { label: "New orders", value: count("placed"), icon: PackagePlus, color: "i-amber" },
    { label: "Packed", value: count("packed"), icon: PackageCheck, color: "i-teal" },
    { label: "Shipped", value: count("shipped"), icon: Truck, color: "i-indigo" },
    { label: "Delivered", value: count("delivered"), icon: CheckCircle2, color: "i-green" },
  ];
  const newOrders = orders.filter((o) => o.status === "placed");

  return (
    <>
      <div className="card welcome mb">
        <h2>Hello, {user.name} 💊</h2>
        <p>{newOrders.length} new order{newOrders.length !== 1 && "s"} waiting to be packed.</p>
        <div className="mt flex wrap"><Link to="/orders" className="btn btn-outline">Manage orders</Link><Link to="/inventory" className="btn btn-outline">Manage stock</Link></div>
      </div>

      <div className="grid grid-4 mb">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card stat">
            <div className={`stat-icon ${color}`}><Icon size={22} /></div>
            <div><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">New orders <Link to="/orders" className="small" style={{ color: "var(--brand)" }}>View all</Link></div>
          {newOrders.length ? newOrders.slice(0, 5).map((o) => (
            <div key={o._id} className="list-item">
              <div className="grow">
                <div className="title">{orderNo(o)} · {o.patient?.name}</div>
                <div className="small muted">{fmtDateTime(o.createdAt)} · {o.items.length} item{o.items.length !== 1 && "s"}</div>
              </div>
              <strong>{rupees(o.total)}</strong>
            </div>
          )) : <Empty icon={Package} title="No new orders" />}
        </div>
        <div className="card">
          <div className="card-title">Low stock ({LOW_STOCK} or fewer) <Link to="/inventory" className="small" style={{ color: "var(--brand)" }}>Manage stock</Link></div>
          {lowStock.length ? lowStock.map((m) => (
            <div key={m._id} className="list-item">
              <div className="grow title">{m.name}</div>
              <span className={`badge ${m.stock === 0 ? "badge-cancelled" : "badge-pending"}`}>{m.stock === 0 ? "Out of stock" : `${m.stock} left`}</span>
            </div>
          )) : <Empty icon={CheckCircle2} title="Everything is well stocked" />}
        </div>
      </div>
    </>
  );
}
