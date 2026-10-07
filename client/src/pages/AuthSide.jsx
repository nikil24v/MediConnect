import { CheckCircle2 } from "lucide-react";
import Logo from "../components/Logo";

export default function AuthSide() {
  return (
    <div className="auth-art">
      <Logo />
      <div>
        <h2>Smarter healthcare starts with understanding your symptoms.</h2>
        <ul>
          {["AI-powered symptom analysis", "Book verified specialists instantly", "Your health history, always available"].map((t) => (
            <li key={t}><CheckCircle2 size={20} color="#5eead4" /> {t}</li>
          ))}
        </ul>
      </div>
      <p className="small" style={{ opacity: 0.6 }}>MediConnect · MERN + Machine Learning</p>
    </div>
  );
}
