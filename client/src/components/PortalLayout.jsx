import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const NAV = {
  admin: [
    { to: "/admin", label: "Dashboard", end: true },
    { to: "/admin/doctors", label: "Doctors" },
    { to: "/admin/patients", label: "Patients" },
    { to: "/admin/appointments", label: "Appointments" },
    { to: "/admin/medicines", label: "Pharmacy Inventory" },
    { to: "/admin/orders", label: "Orders" },
  ],
  doctor: [
    { to: "/doctor", label: "Dashboard", end: true },
    { to: "/doctor/appointments", label: "My Queue" },
    { to: "/doctor/patients", label: "My Patients" },
    { to: "/doctor/prescriptions", label: "Prescriptions" },
  ],
  patient: [
    { to: "/patient", label: "Dashboard", end: true },
    { to: "/patient/book", label: "Book Appointment" },
    { to: "/patient/appointments", label: "My Appointments" },
    { to: "/patient/prescriptions", label: "My Prescriptions" },
    { to: "/patient/pharmacy", label: "Pharmacy" },
    { to: "/patient/orders", label: "My Orders" },
    { to: "/patient/profile", label: "Profile" },
  ],
};

const ROLE_LABEL = { admin: "Admin", doctor: "Doctor", patient: "Patient" };

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const links = NAV[user.role] || [];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
            +
          </span>
          <span className="text-lg font-bold text-slate-800">MediConnect</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
          <p className="text-xs text-slate-500">{ROLE_LABEL[user.role]} account</p>
          <button type="button" onClick={logout} className="btn-secondary mt-3 w-full">
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
