import { Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Spinner from "./components/Spinner.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PortalLayout from "./components/PortalLayout.jsx";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";

import PatientDashboard from "./pages/patient/PatientDashboard.jsx";
import BookAppointment from "./pages/patient/BookAppointment.jsx";
import MyAppointments from "./pages/patient/MyAppointments.jsx";
import MyPrescriptions from "./pages/patient/MyPrescriptions.jsx";
import Pharmacy from "./pages/patient/Pharmacy.jsx";
import MyOrders from "./pages/patient/MyOrders.jsx";
import Profile from "./pages/patient/Profile.jsx";

import DoctorDashboard from "./pages/doctor/DoctorDashboard.jsx";
import DoctorAppointments from "./pages/doctor/Appointments.jsx";
import AppointmentDetail from "./pages/doctor/AppointmentDetail.jsx";
import DoctorPatients from "./pages/doctor/Patients.jsx";
import DoctorPrescriptions from "./pages/doctor/Prescriptions.jsx";

import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminDoctors from "./pages/admin/Doctors.jsx";
import AdminPatients from "./pages/admin/Patients.jsx";
import AdminAppointments from "./pages/admin/Appointments.jsx";
import AdminMedicines from "./pages/admin/Medicines.jsx";
import AdminOrders from "./pages/admin/Orders.jsx";

export default function App() {
  const { loading } = useAuth();
  if (loading) return <Spinner full />;

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/patient"
        element={
          <ProtectedRoute roles={["patient"]}>
            <PortalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PatientDashboard />} />
        <Route path="book" element={<BookAppointment />} />
        <Route path="appointments" element={<MyAppointments />} />
        <Route path="prescriptions" element={<MyPrescriptions />} />
        <Route path="pharmacy" element={<Pharmacy />} />
        <Route path="orders" element={<MyOrders />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route
        path="/doctor"
        element={
          <ProtectedRoute roles={["doctor"]}>
            <PortalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DoctorDashboard />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route path="appointments/:id" element={<AppointmentDetail />} />
        <Route path="patients" element={<DoctorPatients />} />
        <Route path="prescriptions" element={<DoctorPrescriptions />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["admin"]}>
            <PortalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="doctors" element={<AdminDoctors />} />
        <Route path="patients" element={<AdminPatients />} />
        <Route path="appointments" element={<AdminAppointments />} />
        <Route path="medicines" element={<AdminMedicines />} />
        <Route path="orders" element={<AdminOrders />} />
      </Route>

      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
