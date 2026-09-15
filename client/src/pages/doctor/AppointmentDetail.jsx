import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { appointmentApi, prescriptionApi } from "../../api/endpoints.js";
import Badge from "../../components/Badge.jsx";
import Spinner from "../../components/Spinner.jsx";

const emptyMedicine = { name: "", dosage: "", frequency: "", duration: "", instructions: "" };

export default function AppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [medicines, setMedicines] = useState([{ ...emptyMedicine }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    appointmentApi.get(id).then(setAppointment).finally(() => setLoading(false));
  }, [id]);

  const updateMedicine = (idx, field, value) => {
    setMedicines((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };

  const addMedicineRow = () => setMedicines((prev) => [...prev, { ...emptyMedicine }]);
  const removeMedicineRow = (idx) => setMedicines((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const validMedicines = medicines.filter((m) => m.name.trim());
    if (validMedicines.length === 0) {
      setError("Add at least one medicine");
      return;
    }
    setSubmitting(true);
    try {
      await prescriptionApi.create({
        appointmentId: id,
        diagnosis,
        notes,
        medicines: validMedicines,
      });
      navigate("/doctor/appointments");
    } catch (err) {
      setError(err.response?.data?.error || "Could not save prescription");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner full />;
  if (!appointment) return <p className="text-sm text-slate-500">Appointment not found.</p>;

  return (
    <div className="max-w-2xl">
      <Link to="/doctor/appointments" className="text-sm font-semibold text-brand-600">
        ← Back to queue
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-800">
        {appointment.patient?.user?.name}
      </h1>
      <p className="text-sm text-slate-500">
        {new Date(appointment.date).toLocaleDateString()} · {appointment.timeSlot} ·{" "}
        {appointment.department} · <Badge status={appointment.status} />
      </p>
      {appointment.reason && (
        <p className="mt-2 text-sm text-slate-600">Reason: {appointment.reason}</p>
      )}

      <form onSubmit={handleSubmit} className="card mt-6 space-y-4">
        <h2 className="font-semibold text-slate-800">Write Prescription</h2>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div>
          <label className="label">Diagnosis</label>
          <input className="input" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
        </div>

        <div>
          <label className="label">Medicines</label>
          <div className="space-y-2">
            {medicines.map((m, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2">
                <input
                  className="input col-span-4"
                  placeholder="Medicine name"
                  value={m.name}
                  onChange={(e) => updateMedicine(idx, "name", e.target.value)}
                />
                <input
                  className="input col-span-2"
                  placeholder="Dosage"
                  value={m.dosage}
                  onChange={(e) => updateMedicine(idx, "dosage", e.target.value)}
                />
                <input
                  className="input col-span-2"
                  placeholder="Frequency"
                  value={m.frequency}
                  onChange={(e) => updateMedicine(idx, "frequency", e.target.value)}
                />
                <input
                  className="input col-span-2"
                  placeholder="Duration"
                  value={m.duration}
                  onChange={(e) => updateMedicine(idx, "duration", e.target.value)}
                />
                <button
                  type="button"
                  className="col-span-2 text-sm text-red-500 hover:text-red-700"
                  onClick={() => removeMedicineRow(idx)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="btn-secondary btn-sm mt-2" onClick={addMedicineRow}>
            + Add medicine
          </button>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea rows={3} className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? "Saving..." : "Save Prescription & Complete Visit"}
        </button>
      </form>
    </div>
  );
}
