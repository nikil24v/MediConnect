import { useEffect, useState } from "react";
import { doctorApi, metaApi } from "../../api/endpoints.js";
import Spinner from "../../components/Spinner.jsx";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  department: "",
  specialization: "",
  qualification: "",
  experienceYears: "",
  consultationFee: "",
};

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => doctorApi.list().then(setDoctors).finally(() => setLoading(false));

  useEffect(() => {
    load();
    metaApi.departments().then(setDepartments);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await doctorApi.create({
        ...form,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : 0,
        consultationFee: form.consultationFee ? Number(form.consultationFee) : 0,
      });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not create doctor");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (doctor) => {
    await doctorApi.setActive(doctor._id, !doctor.user.isActive);
    load();
  };

  if (loading) return <Spinner full />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Doctors</h1>
        <button type="button" className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ Add Doctor"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mt-4 grid grid-cols-2 gap-3">
          {error && (
            <p className="col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
          <input name="name" placeholder="Full name" required className="input" value={form.name} onChange={handleChange} />
          <input name="email" type="email" placeholder="Email" required className="input" value={form.email} onChange={handleChange} />
          <input name="password" type="password" placeholder="Temporary password" required className="input" value={form.password} onChange={handleChange} />
          <input name="phone" placeholder="Phone" className="input" value={form.phone} onChange={handleChange} />
          <select name="department" required className="input" value={form.department} onChange={handleChange}>
            <option value="">Department</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <input name="specialization" placeholder="Specialization" className="input" value={form.specialization} onChange={handleChange} />
          <input name="qualification" placeholder="Qualification" className="input" value={form.qualification} onChange={handleChange} />
          <input name="experienceYears" type="number" min="0" placeholder="Years of experience" className="input" value={form.experienceYears} onChange={handleChange} />
          <input name="consultationFee" type="number" min="0" placeholder="Consultation fee (₹)" className="input" value={form.consultationFee} onChange={handleChange} />
          <button type="submit" className="btn-primary col-span-2" disabled={submitting}>
            {submitting ? "Creating..." : "Create Doctor Account"}
          </button>
        </form>
      )}

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-2">Name</th>
              <th className="pb-2">Department</th>
              <th className="pb-2">Experience</th>
              <th className="pb-2">Fee</th>
              <th className="pb-2">Status</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {doctors.map((d) => (
              <tr key={d._id}>
                <td className="py-3 font-medium text-slate-700">Dr. {d.user?.name}</td>
                <td className="py-3 text-slate-500">{d.department}</td>
                <td className="py-3 text-slate-500">{d.experienceYears} yrs</td>
                <td className="py-3 text-slate-500">₹{d.consultationFee}</td>
                <td className="py-3">
                  <span
                    className={`badge ${d.user?.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                  >
                    {d.user?.isActive ? "Active" : "Deactivated"}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <button type="button" className="btn-secondary btn-sm" onClick={() => toggleActive(d)}>
                    {d.user?.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
