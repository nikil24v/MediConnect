import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);
const MAX_QTY = 20; // same limit as the server

// The cart lives in the browser (localStorage), one cart per logged-in user.
// It only stores { medicine: id, quantity }. Prices and stock always come from the server.
export function CartProvider({ children }) {
  const { user } = useAuth();
  const key = user ? `mc_cart_${user._id}` : null;
  const [items, setItems] = useState([]);
  // Always holds the newest cart, so several adds in one click (Buy medicines) don't overwrite each other
  const latest = useRef([]);

  const save = (next) => {
    latest.current = next;
    setItems(next);
    try { if (key) localStorage.setItem(key, JSON.stringify(next)); } catch { /* storage full or blocked: cart still works until refresh */ }
  };

  // Load this user's cart when they log in (or switch account)
  useEffect(() => {
    let saved = [];
    try { saved = key ? JSON.parse(localStorage.getItem(key)) || [] : []; } catch { /* broken data: start with an empty cart */ }
    latest.current = saved;
    setItems(saved);
  }, [key]);

  const inCart = (id) => latest.current.find((i) => i.medicine === id)?.quantity || 0;
  const add = (id, qty = 1) => {
    const have = inCart(id);
    const quantity = Math.min(have + qty, MAX_QTY);
    save(have ? latest.current.map((i) => (i.medicine === id ? { ...i, quantity } : i)) : [...latest.current, { medicine: id, quantity }]);
  };
  const ensure = (id) => { if (!inCart(id)) add(id, 1); }; // used by "Buy medicines" (no double adding)
  const setQty = (id, qty) => save(latest.current.map((i) => (i.medicine === id ? { ...i, quantity: Math.max(1, Math.min(qty, MAX_QTY)) } : i)));
  const remove = (id) => save(latest.current.filter((i) => i.medicine !== id));
  const clear = () => save([]);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, inCart, add, ensure, setQty, remove, clear, MAX_QTY }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
