import { Router } from "express";
import Medicine from "../models/Medicine.js";
import { protect, allow } from "../middleware/auth.js";
import { norm } from "../utils/cart.js";

const router = Router();
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // so "(" typed in search is not treated as a pattern

// GET /api/medicines?search=para&category=Antibiotics
router.get("/", protect, async (req, res) => {
  const filter = {};
  if (req.query.search) filter.name = { $regex: escapeRegex(String(req.query.search)), $options: "i" };
  if (req.query.category) filter.category = String(req.query.category);
  res.json(await Medicine.find(filter).sort({ name: 1 }));
});

// GET /api/medicines/categories  -> for the filter chips
router.get("/categories", protect, async (req, res) => {
  res.json((await Medicine.distinct("category")).sort());
});

// POST /api/medicines/match  { names: ["paracetamol", "Rare Drug"] }
// -> which of these the store sells (name match ignores upper/lower case), and which it doesn't
router.post("/match", protect, allow("patient"), async (req, res) => {
  const names = Array.isArray(req.body.names) ? req.body.names.map(String) : [];
  const all = await Medicine.find();
  const byName = new Map(all.map((m) => [norm(m.name), m]));

  const found = [];
  const missing = [];
  for (const name of names) {
    const medicine = byName.get(norm(name));
    if (!medicine) missing.push(name);
    else if (!found.some((f) => f._id.equals(medicine._id))) found.push(medicine);
  }
  res.json({ found, missing });
});

export default router;
