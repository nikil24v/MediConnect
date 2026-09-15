export default function StatCard({ label, value, accent = "brand" }) {
  const accents = {
    brand: "text-brand-700 bg-brand-50",
    amber: "text-amber-700 bg-amber-50",
    red: "text-red-700 bg-red-50",
    slate: "text-slate-700 bg-slate-100",
  };
  return (
    <div className="card">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 inline-block rounded-lg px-2 py-1 text-2xl font-bold ${accents[accent]}`}>
        {value}
      </p>
    </div>
  );
}
