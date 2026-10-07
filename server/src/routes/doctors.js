import { Router } from "express";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// GET /api/doctors?specialization=Cardiology
router.get("/", protect, async (req, res) => {
  const filter = { role: "doctor" };
  if (req.query.specialization) filter.specialization = req.query.specialization;
  res.json(await User.find(filter).sort("name"));
});

export default router;
