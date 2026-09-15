const STYLES = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  paid: "bg-emerald-100 text-emerald-700",
  delivered: "bg-brand-100 text-brand-700",
  default: "bg-slate-100 text-slate-700",
};

export default function Badge({ status }) {
  const style = STYLES[status] || STYLES.default;
  return <span className={`badge capitalize ${style}`}>{status}</span>;
}
