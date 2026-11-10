import { Router } from "express";
import Medicine from "../models/Medicine.js";
import { protect, allow } from "../middleware/auth.js";
import { norm } from "../utils/cart.js";

const router = Router();
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // so "(" typed in search is not treated as a pattern

// GET /api/medicines?search=para&category=Antibiotics&limit=8   (limit is optional, at most 50)
// Also used by the doctor's prescription form to suggest store medicines while typing.
router.get("/", protect, async (req, res) => {
  const filter = {};
  if (req.query.search) filter.name = { $regex: escapeRegex(String(req.query.search)), $options: "i" };
  if (req.query.category) filter.category = String(req.query.category);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 0, 0), 50);
  res.json(await Medicine.find(filter).sort({ name: 1 }).limit(limit)); // limit(0) = no limit
});

// GET /api/medicines/categories  -> for the filter chips
router.get("/categories", protect, async (req, res) => {
  res.json((await Medicine.distinct("category")).sort());
});

// POST /api/medicines/match  { items: [{ medicine: "<store id>", name: "Cetirizine" }, { name: "Rare Drug" }] }
// -> which of these the store sells, and which it doesn't.
// A line with a store ID matches by ID. Otherwise the name is compared (ignoring upper/lower case).
// The older { names: [...] } form still works.
router.post("/match", protect, allow("patient"), async (req, res) => {
  const items = Array.isArray(req.body.items)
    ? req.body.items.slice(0, 50).map((i) => ({ medicine: i?.medicine, name: String(i?.name || "") }))
    : Array.isArray(req.body.names) ? req.body.names.slice(0, 50).map((name) => ({ name: String(name) })) : [];
  const all = await Medicine.find();
  const byId = new Map(all.map((m) => [String(m._id), m]));
  const byName = new Map(all.map((m) => [norm(m.name), m]));

  const found = [];
  const missing = [];
  for (const { medicine: id, name } of items) {
    const medicine = (id && byId.get(String(id))) || byName.get(norm(name));
    if (!medicine) missing.push(name);
    else if (!found.some((f) => f._id.equals(medicine._id))) found.push(medicine);
  }
  res.json({ found, missing });
});

export default router;
