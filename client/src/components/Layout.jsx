import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Stethoscope, Users, CalendarDays, History, UserCircle, LogOut, Menu,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { initials } from "../utils/helpers";
import Logo from "./Logo";

const PATIENT_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/symptom-checker", label: "AI Symptom Checker", icon: Stethoscope },
  { to: "/doctors", label: "Find Doctors", icon: Users },
  { to: "/appointments", label: "My Appointments", icon: CalendarDays },
  { to: "/history", label: "Health History", icon: History },
];
const DOCTOR_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/appointments", label: "Appointments", icon: CalendarDays },
];
const TITLES = {
  "/dashboard": "Dashboard", "/symptom-checker": "AI Symptom Checker", "/doctors": "Find Doctors",
  "/appointments": "Appointments", "/history": "Health History", "/profile": "My Profile",
};

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const items = user.role === "doctor" ? DOCTOR_NAV : PATIENT_NAV;

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? "open" : ""}`} onClick={() => setOpen(false)}>
        <Logo />
        <nav className="nav">
          <div className="nav-label">Menu</div>
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}><Icon size={18} />{label}</NavLink>
          ))}
          <div className="nav-label">More</div>
          <NavLink to="/profile"><UserCircle size={18} />Profile</NavLink>
        </nav>
        <div className="side-user">
          <div className="avatar">{initials(user.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="name">{user.name}</div>
            <div className="role">{user.role}</div>
          </div>
          <button className="btn btn-ghost btn-sm" title="Logout" onClick={() => { logout(); nav("/login"); }}>
            <LogOut size={17} color="#94a3b8" />
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="flex">
            <button className="btn btn-ghost btn-sm menu-btn" onClick={() => setOpen(true)}><Menu size={20} /></button>
            <h1>{TITLES[pathname] || "MediConnect"}</h1>
          </div>
          <div className="flex small muted topdate">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
