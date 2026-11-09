import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, FlaskConical, Lock } from "lucide-react";
import api, { errMsg } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { rupees } from "../../utils/helpers";

// Loads Razorpay's checkout popup script (only needed when Razorpay keys are set on the server)
function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Could not load Razorpay. Check your internet connection."));
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const { user } = useAuth();
  const cart = useCart();
  const nav = useNavigate();
  const [view, setView] = useState(null); // server's view of the cart (prices, problems)
  const [mode, setMode] = useState(null); // "razorpay" or "test"
  const [address, setAddress] = useState({ fullName: user.name || "", phone: user.phone || "", line: "", pincode: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setAddress({ ...address, [k]: e.target.value });

  useEffect(() => {
    if (cart.items.length === 0) return;
    api.post("/orders/preview", { items: cart.items }).then((r) => setView(r.data)).catch((e) => setError(errMsg(e)));
    api.get("/orders/payment-config").then((r) => setMode(r.data.mode)).catch((e) => setError(errMsg(e)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (cart.items.length === 0)
    return <div className="alert alert-info">Your cart is empty. <Link to="/store">Go to the store</Link></div>;
  if (!view || !mode) return error ? <div className="alert alert-error">{error}</div> : <div className="loader"><div className="spinner" /></div>;
  if (!view.ok) return <div className="alert alert-warn">Some items in your cart have a problem. <Link to="/cart">Go back to the cart</Link></div>;

  // Step 2: the payment is done, so ask the server to create the order
  const placeOrder = async (payment) => {
    try {
      await api.post("/orders", { items: cart.items, address, payment });
      cart.clear();
      nav("/orders", { state: { justOrdered: true } });
    } catch (e) {
      setError(errMsg(e));
      setBusy(false);
    }
  };

  const pay = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      // Step 1: the server checks the cart + address and (for Razorpay) creates a payment
      const { data } = await api.post("/orders/pay", { items: cart.items, address });

      if (data.mode === "test") return placeOrder({ mode: "test" });

      await loadRazorpay();
      const popup = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: "INR",
        name: "MediConnect",
        description: "Medicine order",
        order_id: data.razorpayOrderId,
        prefill: { name: address.fullName, email: user.email, contact: address.phone },
        theme: { color: "#0f766e" },
        // Payment finished: the server will verify the signature before creating the order
        handler: (res) => placeOrder(res),
        modal: { ondismiss: () => setBusy(false) },
      });
      popup.on("payment.failed", (res) => { setError(res.error?.description || "Payment failed"); setBusy(false); });
      popup.open();
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <form className="grid cart-grid" onSubmit={pay}>
      <div className="card">
        <div className="card-title">Delivery address</div>
        <div className="row">
          <div className="field"><label>Full name</label><input className="input" required value={address.fullName} onChange={set("fullName")} /></div>
          <div className="field"><label>Phone (10 digits)</label><input className="input" required inputMode="numeric" maxLength={10} value={address.phone} onChange={set("phone")} /></div>
        </div>
        <div className="field"><label>Address</label><textarea className="input" required rows={3} value={address.line} onChange={set("line")} placeholder="House / flat no., street, area, city" /></div>
        <div className="field" style={{ maxWidth: 200 }}><label>Pincode</label><input className="input" required inputMode="numeric" maxLength={6} value={address.pincode} onChange={set("pincode")} /></div>
      </div>

      <div className="card">
        <div className="card-title">Order summary</div>
        {view.lines.map((l) => (
          <div key={l.medicine} className="flex between small" style={{ padding: "4px 0" }}>
            <span>{l.name} × {l.quantity}</span><span>{rupees(l.price * l.quantity)}</span>
          </div>
        ))}
        <div className="flex between mt"><strong>Total</strong><strong style={{ fontSize: 22 }}>{rupees(view.total)}</strong></div>

        {error && <div className="alert alert-error mt small"><AlertCircle size={16} />{error}</div>}

        {mode === "razorpay" ? (
          <button className="btn btn-primary btn-block mt" disabled={busy}>
            {busy ? <span className="spinner" /> : <><Lock size={16} /> Pay {rupees(view.total)} with Razorpay</>}
          </button>
        ) : (
          <>
            <div className="alert alert-info mt small">
              <FlaskConical size={16} style={{ flexShrink: 0 }} />
              <span>Razorpay is not set up on this server, so this is a <strong>demo payment</strong>. No real money is charged.</span>
            </div>
            <button className="btn btn-primary btn-block mt" disabled={busy}>
              {busy ? <span className="spinner" /> : <>Test payment: pay {rupees(view.total)} (simulated)</>}
            </button>
          </>
        )}
        <Link to="/cart" className="btn btn-ghost btn-block btn-sm" style={{ marginTop: 8 }}>Back to cart</Link>
      </div>
    </form>
  );
}
