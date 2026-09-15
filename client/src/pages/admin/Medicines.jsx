import { useEffect, useState } from "react";
import { medicineApi } from "../../api/endpoints.js";
import Spinner from "../../components/Spinner.jsx";

const emptyForm = { name: "", category: "", manufacturer: "", unit: "strip", price: "", stock: "", description: "" };

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => medicineApi.list().then(setMedicines).finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const startCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (m) => {
    setForm({
      name: m.name,
      category: m.category,
      manufacturer: m.manufacturer || "",
      unit: m.unit,
      price: m.price,
      stock: m.stock,
      description: m.description || "",
    });
    setEditingId(m._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const payload = { ...form, price: Number(form.price), stock: Number(form.stock) };
    try {
      if (editingId) await medicineApi.update(editingId, payload);
      else await medicineApi.create(payload);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not save medicine");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    await medicineApi.remove(id);
    load();
  };

  if (loading) return <Spinner full />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Pharmacy Inventory</h1>
        <button type="button" className="btn-primary" onClick={showForm ? () => setShowForm(false) : startCreate}>
          {showForm ? "Cancel" : "+ Add Medicine"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mt-4 grid grid-cols-2 gap-3">
          {error && (
            <p className="col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
          <input name="name" placeholder="Medicine name" required className="input" value={form.name} onChange={handleChange} />
          <input name="category" placeholder="Category" className="input" value={form.category} onChange={handleChange} />
          <input name="manufacturer" placeholder="Manufacturer" className="input" value={form.manufacturer} onChange={handleChange} />
          <input name="unit" placeholder="Unit (e.g. strip of 10)" className="input" value={form.unit} onChange={handleChange} />
          <input name="price" type="number" min="0" step="0.01" placeholder="Price (₹)" required className="input" value={form.price} onChange={handleChange} />
          <input name="stock" type="number" min="0" placeholder="Stock quantity" required className="input" value={form.stock} onChange={handleChange} />
          <textarea name="description" placeholder="Description" className="input col-span-2" value={form.description} onChange={handleChange} />
          <button type="submit" className="btn-primary col-span-2" disabled={submitting}>
            {submitting ? "Saving..." : editingId ? "Update Medicine" : "Add Medicine"}
          </button>
        </form>
      )}

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-2">Name</th>
              <th className="pb-2">Category</th>
              <th className="pb-2">Price</th>
              <th className="pb-2">Stock</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {medicines.map((m) => (
              <tr key={m._id}>
                <td className="py-3 font-medium text-slate-700">{m.name}</td>
                <td className="py-3 text-slate-500">{m.category}</td>
                <td className="py-3 text-slate-500">₹{m.price}</td>
                <td className="py-3">
                  <span className={`badge ${m.stock <= 10 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {m.stock}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button type="button" className="btn-secondary btn-sm" onClick={() => startEdit(m)}>
                      Edit
                    </button>
                    <button type="button" className="btn-danger btn-sm" onClick={() => handleDelete(m._id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
