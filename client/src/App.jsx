import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import PatientDashboard from "./pages/patient/Dashboard";
import SymptomChecker from "./pages/patient/SymptomChecker";
import Doctors from "./pages/patient/Doctors";
import PatientAppointments from "./pages/patient/Appointments";
import History from "./pages/patient/History";
import DoctorDashboard from "./pages/doctor/Dashboard";
import DoctorAppointments from "./pages/doctor/Appointments";

// Only lets logged-in users (optionally of a given role) see the page
function Private({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
}

function Home() {
  const { user } = useAuth();
  return user.role === "doctor" ? <DoctorDashboard /> : <PatientDashboard />;
}

function Appointments() {
  const { user } = useAuth();
  return user.role === "doctor" ? <DoctorAppointments /> : <PatientAppointments />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<Private><Layout /></Private>}>
        <Route path="/dashboard" element={<Home />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/symptom-checker" element={<Private role="patient"><SymptomChecker /></Private>} />
        <Route path="/doctors" element={<Private role="patient"><Doctors /></Private>} />
        <Route path="/history" element={<Private role="patient"><History /></Private>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
