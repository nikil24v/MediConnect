export default function Spinner({ full }) {
  const spinner = (
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
  );
  if (!full) return spinner;
  return <div className="flex h-screen items-center justify-center bg-slate-50">{spinner}</div>;
}
