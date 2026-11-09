import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, CalendarClock, ShoppingCart } from "lucide-react";
import api, { errMsg } from "../api/client";
import { useCart } from "../context/CartContext";
import { fmtDate } from "../utils/helpers";
import { downloadPrescription } from "../utils/download";

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Shows one prescription: diagnosis, medicine table, notes and follow-up date.
// The patient also gets a "Download PDF" button (canDownload) and a "Buy medicines" button (canBuy).
export default function PrescriptionCard({ rx, canDownload, canBuy }) {
  const cart = useCart();
  const [buy, setBuy] = useState(null); // { added: [names], missing: [names] } after clicking "Buy medicines"
  const [buyError, setBuyError] = useState("");

  // Find these medicines in the store (name match ignores letter case) and put them in the cart
  const buyMedicines = async () => {
    setBuyError("");
    try {
      const { data } = await api.post("/medicines/match", { names: rx.medicines.map((m) => m.name) });
      data.found.forEach((m) => cart.ensure(m._id));
      setBuy({ added: data.found.map((m) => m.name), missing: data.missing });
    } catch (e) {
      setBuyError(errMsg(e));
    }
  };

  return (
    <div className="card" style={{ boxShadow: "none", background: "#f8fafc", padding: 16, marginTop: 10 }}>
      <div className="flex between wrap mb">
        <div>
          <div className="small muted">Diagnosis</div>
          <strong>{rx.diagnosis}</strong>
        </div>
        <div className="flex wrap">
          {canBuy && (
            <button className="btn btn-primary btn-sm" onClick={buyMedicines}>
              <ShoppingCart size={15} /> Buy medicines
            </button>
          )}
          {canDownload && (
            <button className="btn btn-outline btn-sm" onClick={() => downloadPrescription(rx._id)}>
              <Download size={15} /> Download PDF
            </button>
          )}
        </div>
      </div>

      {buyError && <div className="alert alert-error small mb">{buyError}</div>}
      {buy && (
        <div className="mb">
          {buy.added.length > 0 && (
            <div className="alert alert-info small">
              <span>Added to your cart: <strong>{buy.added.join(", ")}</strong>. <Link to="/cart">Go to cart</Link></span>
            </div>
          )}
          {buy.missing.length > 0 && (
            <div className="alert alert-warn small" style={{ marginTop: buy.added.length ? 8 : 0 }}>
              <span>Not available in our store: <strong>{buy.missing.join(", ")}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* The wrapper lets the table scroll sideways on small phone screens */}
      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr><th>Medicine</th><th>Dosage</th><th>When</th><th>Days</th><th>Instructions</th></tr>
          </thead>
          <tbody>
            {rx.medicines.map((m, i) => (
              <tr key={i}>
                <td><strong>{m.name}</strong></td>
                <td>{m.dosage || "-"}</td>
                <td>{m.frequency.map(cap).join(", ")}</td>
                <td>{m.durationDays}</td>
                <td>{m.instructions || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rx.notes && <p className="small" style={{ marginTop: 10 }}><span className="muted">Notes: </span>{rx.notes}</p>}
      {rx.followUpDate && (
        <p className="small flex" style={{ marginTop: 6 }}>
          <CalendarClock size={15} /> <span className="muted">Follow-up:</span> <strong>{fmtDate(rx.followUpDate)}</strong>
        </p>
      )}
    </div>
  );
}
