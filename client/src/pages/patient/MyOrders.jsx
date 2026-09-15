import { useEffect, useState } from "react";
import { orderApi } from "../../api/endpoints.js";
import Badge from "../../components/Badge.jsx";
import Spinner from "../../components/Spinner.jsx";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi.list().then(setOrders).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner full />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">My Orders</h1>

      <div className="mt-6 space-y-4">
        {orders.length === 0 ? (
          <p className="text-sm text-slate-500">No pharmacy orders yet.</p>
        ) : (
          orders.map((o) => (
            <div key={o._id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">
                    Order #{o._id.slice(-6).toUpperCase()}
                  </p>
                  <p className="text-sm text-slate-500">{new Date(o.createdAt).toLocaleString()}</p>
                </div>
                <Badge status={o.status} />
              </div>
              <ul className="mt-3 divide-y divide-slate-100 text-sm">
                {o.items.map((i, idx) => (
                  <li key={idx} className="flex justify-between py-1.5">
                    <span className="text-slate-700">
                      {i.name} × {i.quantity}
                    </span>
                    <span className="text-slate-500">₹{i.price * i.quantity}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t border-slate-200 pt-2 text-sm font-semibold">
                <span>Total</span>
                <span>₹{o.totalAmount}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
