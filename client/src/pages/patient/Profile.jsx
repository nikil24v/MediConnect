import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { patientApi } from "../../api/endpoints.js";
import Spinner from "../../components/Spinner.jsx";

export default function Profile() {
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState({ dob: "", gender: "", bloodGroup: "", address: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user.profile?._id) return;
    patientApi.get(user.profile._id).then((p) => {
      setPatient(p);
      setForm({
        dob: p.dob ? p.dob.split("T")[0] : "",
        gender: p.gender || "",
        bloodGroup: p.bloodGroup || "",
        address: p.address || "",
      });
      setLoading(false);
    });
  }, [user.profile?._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await patientApi.update(patient._id, form);
      setMessage("Profile updated.");
    } catch (err) {
      setMessage(err.response?.data?.error || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner full />;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>

      <form onSubmit={handleSubmit} className="card mt-6 space-y-4">
        {message && (
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{message}</p>
        )}
        <div className="grid grid-cols-2 gap-3 text-sm text-slate-500">
          <p>
            <span className="font-medium text-slate-700">Name:</span> {user.name}
          </p>
          <p>
            <span className="font-medium text-slate-700">Email:</span> {user.email}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Date of birth</label>
            <input
              type="date"
              className="input"
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Gender</label>
            <select
              className="input"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Blood group</label>
          <input
            className="input"
            value={form.bloodGroup}
            onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Address</label>
          <textarea
            rows={3}
            className="input"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}
