import { useId, useRef, useState } from "react";
import { CheckCircle2, Info } from "lucide-react";
import api from "../api/client";

// A text box that suggests medicines from the store while the doctor types ("Ceti" -> "Cetirizine").
//  - Picking a suggestion calls onPick(medicine), so the prescription can keep the store product's ID.
//  - Typing anything calls onType(text); the parent should then forget the picked ID.
//  - Free text always works: a medicine the store doesn't stock is simply saved as typed.
export default function MedicineSearch({ value, medicineId, onType, onPick, placeholder, required }) {
  const listId = useId();
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [noMatch, setNoMatch] = useState(false);
  const timer = useRef(null);
  const latest = useRef(0); // number of the newest search, so a slow old answer can't overwrite a newer one

  const close = () => { setOpen(false); setNoMatch(false); };

  const search = (text) => {
    clearTimeout(timer.current);
    const mine = ++latest.current;
    const q = text.trim();
    if (q.length < 2) { setResults([]); close(); return; }

    timer.current = setTimeout(async () => {
      try {
        const { data } = await api.get("/medicines", { params: { search: q, limit: 20 } });
        if (mine !== latest.current) return;
        const starts = (m) => m.name.toLowerCase().startsWith(q.toLowerCase());
        const sorted = [...data].sort((a, b) => Number(starts(b)) - Number(starts(a)) || a.name.localeCompare(b.name));
        setResults(sorted.slice(0, 8));
        setActive(0);
        setNoMatch(sorted.length === 0);
        setOpen(true);
      } catch {
        if (mine === latest.current) { setResults([]); close(); } // suggestions are optional: typing still works
      }
    }, 200);
  };

  const pick = (medicine) => {
    clearTimeout(timer.current);
    latest.current++;
    onPick(medicine);
    setResults([]);
    close();
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape" && open) { e.stopPropagation(); close(); return; }
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((active + 1) % results.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((active - 1 + results.length) % results.length); }
    else if (e.key === "Enter") { e.preventDefault(); pick(results[active]); } // would otherwise submit the form
  };

  return (
    <div className="combo">
      <input
        className="input" value={value} placeholder={placeholder} required={required} autoComplete="off"
        role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={open && results.length ? `${listId}-${active}` : undefined}
        onChange={(e) => { onType(e.target.value); search(e.target.value); }}
        onKeyDown={onKeyDown}
        onBlur={close}
      />

      {open && (
        <ul className="combo-list" id={listId} role="listbox">
          {results.map((m, i) => (
            // onMouseDown (not onClick) so the box doesn't lose focus and close before the click lands
            <li key={m._id} id={`${listId}-${i}`} role="option" aria-selected={i === active}
              className={`combo-item ${i === active ? "active" : ""}`}
              onMouseDown={(e) => { e.preventDefault(); pick(m); }} onMouseEnter={() => setActive(i)}>
              <div>
                <div className="combo-name">{m.name}</div>
                <div className="combo-sub">{[m.pack, m.category].filter(Boolean).join(" · ")}</div>
              </div>
              <div className="combo-tags">
                {m.requiresPrescription && <span className="badge badge-brand">Rx</span>}
                {m.stock === 0 && <span className="combo-sub">Out of stock</span>}
              </div>
            </li>
          ))}
          {noMatch && <li className="combo-empty">The store doesn't stock this. It will be saved as typed.</li>}
        </ul>
      )}

      {medicineId ? (
        <div className="combo-hint ok"><CheckCircle2 size={14} /> From the store. The patient can buy it in one click.</div>
      ) : value.trim().length >= 2 && !open ? (
        <div className="combo-hint"><Info size={14} /> Saved as typed (not picked from the store).</div>
      ) : null}
    </div>
  );
}
