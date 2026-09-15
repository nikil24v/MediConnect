import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { medicineApi, orderApi } from "../../api/endpoints.js";
import Spinner from "../../components/Spinner.jsx";

export default function Pharmacy() {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]); // [{ medicineId, name, price, quantity, stock }]
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);

  const load = (params) => medicineApi.list(params).then(setMedicines).finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    load(search ? { search } : undefined);
  };

  const addToCart = (medicine) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.medicineId === medicine._id);
      if (existing) {
        return prev.map((i) =>
          i.medicineId === medicine._id ? { ...i, quantity: Math.min(i.quantity + 1, medicine.stock) } : i
        );
      }
      return [
        ...prev,
        { medicineId: medicine._id, name: medicine.name, price: medicine.price, quantity: 1, stock: medicine.stock },
      ];
    });
  };

  const updateQty = (medicineId, quantity) => {
    setCart((prev) =>
      prev
        .map((i) => (i.medicineId === medicineId ? { ...i, quantity: Number(quantity) } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (medicineId) =>
    setCart((prev) => prev.filter((i) => i.medicineId !== medicineId));

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleCheckout = async () => {
    setError("");
    setPlacing(true);
    try {
      await orderApi.create({
        items: cart.map((i) => ({ medicineId: i.medicineId, quantity: i.quantity })),
      });
      setCart([]);
      navigate("/patient/orders");
    } catch (err) {
      setError(err.response?.data?.error || "Checkout failed");
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <Spinner full />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Pharmacy</h1>
      <p className="mt-1 text-sm text-slate-500">Browse medicines and add them to your cart.</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form onSubmit={handleSearch} className="mb-4 flex gap-2">
            <input
              className="input"
              placeholder="Search medicines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn-secondary">
              Search
            </button>
          </form>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {medicines.map((m) => (
              <div key={m._id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{m.name}</p>
                    <p className="text-xs text-slate-500">
                      {m.category} · {m.unit}
                    </p>
                  </div>
                  <span
                    className={`badge ${m.stock > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                  >
                    {m.stock > 0 ? `${m.stock} in stock` : "Out of stock"}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-lg font-bold text-slate-800">₹{m.price}</p>
                  <button
                    type="button"
                    className="btn-primary btn-sm"
                    disabled={m.stock === 0}
                    onClick={() => addToCart(m)}
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card h-fit">
          <h2 className="mb-3 font-semibold text-slate-800">Your Cart</h2>
          {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          {cart.length === 0 ? (
            <p className="text-sm text-slate-500">Cart is empty.</p>
          ) : (
            <>
              <ul className="space-y-3">
                {cart.map((i) => (
                  <li key={i.medicineId} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-slate-700">{i.name}</p>
                      <p className="text-slate-500">₹{i.price} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={i.stock}
                        value={i.quantity}
                        onChange={(e) => updateQty(i.medicineId, e.target.value)}
                        className="input w-16 text-center"
                      />
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => removeFromCart(i.medicineId)}
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="font-semibold text-slate-700">Total</span>
                <span className="text-lg font-bold text-slate-800">₹{total}</span>
              </div>
              <button
                type="button"
                className="btn-primary mt-4 w-full"
                disabled={placing}
                onClick={handleCheckout}
              >
                {placing ? "Placing order..." : "Checkout"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
