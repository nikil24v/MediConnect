import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { metaApi, doctorApi, appointmentApi } from "../../api/endpoints.js";
import Spinner from "../../components/Spinner.jsx";

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
];

export default function BookAppointment() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ department: "", doctorId: "", date: "", timeSlot: "", reason: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    metaApi.departments().then(setDepartments);
    doctorApi.list().then((d) => {
      setDoctors(d);
      setLoading(false);
    });
  }, []);

  const filteredDoctors = form.department
    ? doctors.filter((d) => d.department === form.department)
    : doctors;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.doctorId || !form.date || !form.timeSlot) {
      setError("Please choose a doctor, date and time slot");
      return;
    }
    setSubmitting(true);
    try {
      await appointmentApi.create(form);
      setSuccess("Appointment requested! You'll see it under My Appointments.");
      setTimeout(() => navigate("/patient/appointments"), 1200);
    } catch (err) {
      setError(err.response?.data?.error || "Could not book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner full />;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800">Book an Appointment</h1>
      <p className="mt-1 text-sm text-slate-500">Pick a department, doctor, date and time.</p>

      <form onSubmit={handleSubmit} className="card mt-6 space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        {success && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
        )}

        <div>
          <label className="label">Department</label>
          <select
            className="input"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value, doctorId: "" })}
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Doctor</label>
          <select
            required
            className="input"
            value={form.doctorId}
            onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
          >
            <option value="">Select a doctor</option>
            {filteredDoctors.map((d) => (
              <option key={d._id} value={d._id}>
                Dr. {d.user?.name} — {d.department} (₹{d.consultationFee})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              required
              min={new Date().toISOString().split("T")[0]}
              className="input"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Time slot</label>
            <select
              required
              className="input"
              value={form.timeSlot}
              onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
            >
              <option value="">Select a slot</option>
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Reason for visit</label>
          <textarea
            rows={3}
            className="input"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
        </div>

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? "Booking..." : "Book Appointment"}
        </button>
      </form>
    </div>
  );
}
