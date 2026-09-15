import { Link } from "react-router-dom";

const FEATURES = [
  {
    title: "Book appointments in seconds",
    body: "Browse doctors by department, pick an open slot, and track status from pending to completed.",
  },
  {
    title: "Digital prescriptions",
    body: "Doctors record diagnosis and medicines during the visit; patients can view them anytime.",
  },
  {
    title: "In-app pharmacy",
    body: "Order prescribed or over-the-counter medicines straight from the app, with live stock tracking.",
  },
  {
    title: "Role-based access",
    body: "Dedicated Admin, Doctor and Patient portals, each scoped to exactly what that role should see.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
              +
            </span>
            <span className="text-xl font-bold text-slate-800">MediConnect</span>
          </div>
          <div className="flex gap-3">
            <Link to="/login" className="btn-secondary">
              Log in
            </Link>
            <Link to="/register" className="btn-primary">
              Register as Patient
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Hospital, appointments and pharmacy —{" "}
          <span className="text-brand-600">one connected system</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          MediConnect is a full-stack MERN platform with role-based Admin, Doctor and Patient
          portals covering appointment scheduling, digital prescriptions and pharmacy ordering.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/register" className="btn-primary px-6 py-3 text-base">
            Get started as a Patient
          </Link>
          <Link to="/login" className="btn-secondary px-6 py-3 text-base">
            Staff / Doctor login
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 pb-20 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="card">
            <h3 className="font-semibold text-slate-800">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-500">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
