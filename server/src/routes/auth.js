import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = Router();
const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
const safe = (u) => {
  const o = u.toObject();
  delete o.password;
  return o;
};

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "patient", specialization, phone, age, gender, experience, fee } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required" });
    if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
    if (!["patient", "doctor"].includes(role)) return res.status(403).json({ message: "This account type cannot be created here" }); // pharmacists are added by the admin
    if (await User.findOne({ email })) return res.status(409).json({ message: "Email already registered" });
    if (role === "doctor" && !specialization) return res.status(400).json({ message: "Specialization is required for doctors" });

    const user = await User.create({ name, email, password, role, specialization, phone, age, gender, experience, fee });
    res.status(201).json({ token: sign(user._id), user: safe(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || "").toLowerCase() }).select("+password");
  if (!user || !(await user.matchPassword(password || "")))
    return res.status(401).json({ message: "Invalid email or password" });
  res.json({ token: sign(user._id), user: safe(user) });
});

// GET /api/auth/me
router.get("/me", protect, (req, res) => res.json(req.user));

// PUT /api/auth/me  (update own profile)
router.put("/me", protect, async (req, res) => {
  const fields = [
    "name", "phone", "age", "gender", "specialization", "experience", "fee",
    "bloodGroup", "allergies", "conditions", "emergencyContact", "familyEmail", "notifyFamily", // health record (patients)
  ];
  fields.forEach((f) => req.body[f] !== undefined && (req.user[f] = req.body[f]));

  if (req.user.notifyFamily && !req.user.familyEmail)
    return res.status(400).json({ message: "Add a family email before turning on family emails" });

  try {
    await req.user.save();
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ message: Object.values(err.errors)[0].message });
    throw err;
  }
  res.json(req.user);
});

export default router;
