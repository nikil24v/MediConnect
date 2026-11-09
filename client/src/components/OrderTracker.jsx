import { Check } from "lucide-react";
import { fmtDateTime } from "../utils/helpers";

const STEPS = [
  ["placed", "Placed"],
  ["packed", "Packed"],
  ["shipped", "Shipped"],
  ["delivered", "Delivered"],
];

// Progress tracker: each finished step is filled in and shows the time it happened.
export default function OrderTracker({ order }) {
  const times = Object.fromEntries(order.timeline.map((t) => [t.status, t.at]));
  return (
    <div className="tracker">
      {STEPS.map(([key, label]) => (
        <div key={key} className={`tstep ${times[key] ? "done" : ""}`}>
          <div className="tdot">{times[key] && <Check size={15} />}</div>
          <div className="tlabel">{label}</div>
          <div className="ttime">{times[key] ? fmtDateTime(times[key]) : "-"}</div>
        </div>
      ))}
    </div>
  );
}
