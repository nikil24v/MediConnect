import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Package, CheckCircle2 } from "lucide-react";
import api, { errMsg } from "../../api/client";
import Empty from "../../components/Empty";
import OrderCard from "../../components/OrderCard";

// Patient's "My Orders": every order with a progress tracker
export default function Orders() {
  const { state } = useLocation(); // set by checkout right after paying
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/orders").then((r) => setOrders(r.data)).catch((e) => setError(errMsg(e)));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!orders) return <div className="loader"><div className="spinner" /></div>;

  return (
    <>
      {state?.justOrdered && (
        <div className="alert alert-info mb"><CheckCircle2 size={18} /> Order placed! We have emailed you the details.</div>
      )}
      {orders.length === 0 ? (
        <div className="card"><Empty icon={Package} title="No orders yet" text="Medicines you order will be tracked here." action={<Link to="/store" className="btn btn-primary btn-sm">Go to store</Link>} /></div>
      ) : (
        orders.map((o) => <OrderCard key={o._id} order={o} />)
      )}
    </>
  );
}
