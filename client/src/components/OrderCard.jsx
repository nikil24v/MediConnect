import { MapPin, Phone } from "lucide-react";
import { fmtDateTime, orderNo, rupees } from "../utils/helpers";
import OrderTracker from "./OrderTracker";

const NEXT = { placed: "Mark as packed", packed: "Mark as shipped", shipped: "Mark as delivered" };

// One order. Patients see their own; the pharmacist (onAdvance given) also sees the customer
// and gets a button that moves the order to its next status.
export default function OrderCard({ order, onAdvance, busy }) {
  const a = order.address;
  return (
    <div className="card mb">
      <div className="flex between wrap">
        <div>
          <div className="title">Order {orderNo(order)}</div>
          <div className="small muted">{fmtDateTime(order.createdAt)} · Test payment</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{rupees(order.total)}</div>
          <span className={`badge order-${order.status}`}>{order.status}</span>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="table" style={{ marginTop: 10 }}>
          <thead><tr><th>Medicine</th><th>Price</th><th>Qty</th><th>Amount</th></tr></thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i._id || i.name}>
                <td><strong>{i.name}</strong></td><td>{rupees(i.price)}</td><td>{i.quantity}</td><td>{rupees(i.price * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="small mt" style={{ lineHeight: 1.6 }}>
        {onAdvance && <div><strong>{order.patient?.name}</strong> · <Phone size={13} /> {a.phone}</div>}
        <div className="flex" style={{ alignItems: "flex-start", gap: 6 }}>
          <MapPin size={14} style={{ marginTop: 3, flexShrink: 0 }} />
          <span>{a.fullName}, {a.line}, {a.pincode}</span>
        </div>
      </div>

      <div className="mt"><OrderTracker order={order} /></div>

      {onAdvance && NEXT[order.status] && (
        <button className="btn btn-primary mt" disabled={busy} onClick={() => onAdvance(order._id)}>
          {busy ? <span className="spinner" /> : NEXT[order.status]}
        </button>
      )}
    </div>
  );
}
