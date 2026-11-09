import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingCart, AlertCircle } from "lucide-react";
import api, { errMsg } from "../../api/client";
import { useCart } from "../../context/CartContext";
import { rupees } from "../../utils/helpers";
import Empty from "../../components/Empty";

export default function Cart() {
  const cart = useCart();
  const nav = useNavigate();
  const [view, setView] = useState(null); // what the server says about this cart: prices, stock, problems
  const [error, setError] = useState("");

  // Ask the server for current prices/stock every time the cart changes
  useEffect(() => {
    if (cart.items.length === 0) return setView(null);
    api.post("/orders/preview", { items: cart.items })
      .then((r) => { setView(r.data); setError(""); })
      .catch((e) => setError(errMsg(e)));
  }, [cart.items]);

  if (cart.items.length === 0)
    return <div className="card"><Empty icon={ShoppingCart} title="Your cart is empty" text="Add medicines from the store." action={<Link to="/store" className="btn btn-primary btn-sm">Go to store</Link>} /></div>;
  if (!view) return error ? <div className="alert alert-error">{error}</div> : <div className="loader"><div className="spinner" /></div>;

  return (
    <div className="grid cart-grid">
      <div className="card">
        <div className="card-title">Items in your cart</div>
        {view.lines.map((l) => (
          <div key={l.medicine} className="list-item cart-line">
            <div className="grow">
              <div className="title">{l.name}</div>
              <div className="small muted">{l.pack} · {rupees(l.price)} each</div>
              {l.problem && <div className="small flex" style={{ color: "var(--danger)", marginTop: 4, gap: 5 }}><AlertCircle size={14} /> {l.problem}</div>}
            </div>
            <div className="qty">
              <button className="btn btn-outline btn-sm" aria-label="Decrease" disabled={l.quantity <= 1} onClick={() => cart.setQty(l.medicine, l.quantity - 1)}><Minus size={14} /></button>
              <span>{l.quantity}</span>
              <button className="btn btn-outline btn-sm" aria-label="Increase" disabled={l.quantity >= cart.MAX_QTY} onClick={() => cart.setQty(l.medicine, l.quantity + 1)}><Plus size={14} /></button>
            </div>
            <strong style={{ minWidth: 70, textAlign: "right" }}>{rupees(l.price * l.quantity)}</strong>
            <button className="btn btn-ghost btn-sm" title="Remove" onClick={() => cart.remove(l.medicine)}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">Summary</div>
        <div className="flex between"><span className="muted">Items</span><span>{cart.count}</span></div>
        <div className="flex between mt"><strong>Total</strong><strong style={{ fontSize: 22 }}>{rupees(view.total)}</strong></div>
        {!view.ok && <div className="alert alert-warn mt small">Fix the items marked in red (change the quantity or remove them) to continue.</div>}
        {error && <div className="alert alert-error mt small">{error}</div>}
        <button className="btn btn-primary btn-block mt" disabled={!view.ok} onClick={() => nav("/checkout")}>Proceed to checkout</button>
        <Link to="/store" className="btn btn-ghost btn-block btn-sm" style={{ marginTop: 8 }}>Continue shopping</Link>
      </div>
    </div>
  );
}
