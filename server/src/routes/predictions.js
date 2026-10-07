import { Router } from "express";
import Prediction from "../models/Prediction.js";
import { protect, allow } from "../middleware/auth.js";

const router = Router();
const ML = () => process.env.ML_URL || "http://localhost:5001";

async function ml(path, options) {
  const r = await fetch(ML() + path, options);
  const data = await r.json();
  if (!r.ok) throw Object.assign(new Error(data.error || "ML service error"), { status: r.status });
  return data;
}

// GET /api/predictions/symptoms  -> symptom list from the ML service
router.get("/symptoms", protect, async (req, res) => {
  try { res.json(await ml("/symptoms")); }
  catch { res.status(503).json({ message: "ML service is not running" }); }
});

// POST /api/predictions  { symptoms: [...] }  -> run ML + save history
router.post("/", protect, allow("patient"), async (req, res) => {
  try {
    const out = await ml("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms: req.body.symptoms || [] }),
    });
    const saved = await Prediction.create({
      patient: req.user._id,
      symptoms: out.symptoms,
      results: out.predictions,
      model: out.model,
    });
    res.status(201).json({ ...saved.toObject(), disclaimer: out.disclaimer });
  } catch (err) {
    res.status(err.status || 503).json({ message: err.status ? err.message : "ML service is not running" });
  }
});

// GET /api/predictions  -> my history
router.get("/", protect, allow("patient"), async (req, res) => {
  res.json(await Prediction.find({ patient: req.user._id }).sort({ createdAt: -1 }));
});

// DELETE /api/predictions/:id
router.delete("/:id", protect, allow("patient"), async (req, res) => {
  await Prediction.deleteOne({ _id: req.params.id, patient: req.user._id });
  res.json({ ok: true });
});

export default router;
