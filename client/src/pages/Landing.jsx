import { Link, Navigate } from "react-router-dom";
import { Brain, CalendarCheck, ShieldCheck, Stethoscope, History, Sparkles, ArrowRight, Activity } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

const FEATURES = [
  { icon: Brain, color: "i-teal", title: "AI Symptom Checker", text: "Select your symptoms and our ML model predicts the top 3 possible conditions with confidence scores." },
  { icon: Stethoscope, color: "i-indigo", title: "Right Specialist", text: "Get a specialist suggestion for the predicted condition and book them in one click." },
  { icon: CalendarCheck, color: "i-green", title: "Easy Appointments", text: "Pick a doctor, date and time slot. Doctors confirm, complete or add notes to your visit." },
  { icon: History, color: "i-amber", title: "Health History", text: "Every AI check is saved so you and your doctor can track symptoms over time." },
  { icon: ShieldCheck, color: "i-rose", title: "Secure by Design", text: "JWT authentication, hashed passwords and role-based access for patients and doctors." },
  { icon: Activity, color: "i-teal", title: "Doctor Dashboard", text: "Doctors see upcoming visits along with the patient's AI pre-screening report." },
];

export default function Landing() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div>
      <nav className="land-nav">
        <Logo />
        <div className="flex">
          <Link to="/login" className="btn btn-ghost">Log in</Link>
          <Link to="/register" className="btn btn-primary">Get started</Link>
        </div>
      </nav>

      <section className="hero">
        <div>
          <span className="pill"><Sparkles size={14} /> Machine learning powered healthcare</span>
          <h1>Check symptoms. <span>Find the right doctor.</span> Book in seconds.</h1>
          <p>MediConnect connects patients and doctors on one platform, with an AI symptom checker that suggests possible conditions before your visit.</p>
          <div className="flex wrap">
            <Link to="/register" className="btn btn-primary btn-lg">Start free <ArrowRight size={18} /></Link>
            <Link to="/login" className="btn btn-outline btn-lg">I'm a doctor</Link>
          </div>
        </div>

        <div className="hero-card">
          <div className="flex between mb">
            <strong>AI Symptom Check</strong>
            <span className="badge badge-brand">Random Forest</span>
          </div>
          <div className="chips mb">
            {["Itching", "Skin rash", "Nodal skin eruptions"].map((s) => <span key={s} className="chip on">{s}</span>)}
          </div>
          {[["Fungal infection", 84], ["Drug reaction", 6], ["Acne", 5]].map(([d, c], i) => (
            <div key={d} className={`result ${i === 0 ? "top" : ""}`}>
              <div className="flex between"><strong>{d}</strong><span className="conf">{c}%</span></div>
              <div className="bar"><span style={{ width: `${c}%` }} /></div>
            </div>
          ))}
          <p className="small muted">Suggested specialist: <strong style={{ color: "var(--brand)" }}>Dermatologist</strong></p>
        </div>
      </section>

      <section className="section">
        <h2>Everything in one place</h2>
        <p className="sub">Built with the MERN stack and a Python machine learning service.</p>
        <div className="grid grid-3">
          {FEATURES.map(({ icon: Icon, color, title, text }) => (
            <div key={title} className="card feature">
              <div className={`stat-icon ${color}`}><Icon size={22} /></div>
              <h3>{title}</h3>
              <p className="muted small">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ background: "#fff" }}>
        <h2>How it works</h2>
        <p className="sub">Three simple steps from symptoms to consultation.</p>
        <div className="grid grid-3">
          {[
            ["Describe symptoms", "Search and select what you're feeling from 132 symptoms."],
            ["Get AI insights", "The ML model predicts likely conditions and suggests a specialist."],
            ["Book a doctor", "Choose a slot. Your AI report is shared with the doctor."],
          ].map(([t, d], i) => (
            <div key={t} className="card">
              <div className="step-num">{i + 1}</div>
              <h3 style={{ fontSize: 17, marginBottom: 6 }}>{t}</h3>
              <p className="muted small">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
        © {new Date().getFullYear()} MediConnect · AI predictions are not a medical diagnosis. Always consult a doctor.
      </footer>
    </div>
  );
}
