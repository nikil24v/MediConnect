import { Router } from "express";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { firstValidationMessage } from "../utils/errors.js";

const router = Router();
const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
const safe = (u) => {
  const o = u.toObject();
  delete o.password;
  return o;
};

export const MIN_PASSWORD = 8;
const EMAIL = /^\S+@\S+\.\S+$/;

// Slows down password guessing: at most 10 WRONG logins per 15 minutes from one address.
// Correct logins are not counted, so normal use (and demos) is never blocked.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many failed login attempts. Please try again in 15 minutes." },
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { name, password, role = "patient", specialization, phone, age, gender, experience, fee } = req.body;
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

  if (typeof name !== "string" || !name.trim() || !email || typeof password !== "string" || !password)
    return res.status(400).json({ message: "Name, email and password are required" });
  if (!EMAIL.test(email)) return res.status(400).json({ message: "Enter a valid email address" });
  if (password.length < MIN_PASSWORD) return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD} characters` });
  if (!["patient", "doctor"].includes(role)) return res.status(403).json({ message: "This account type cannot be created here" }); // pharmacists are added by the admin
  if (await User.findOne({ email })) return res.status(409).json({ message: "Email already registered" });
  if (role === "doctor" && !specialization) return res.status(400).json({ message: "Specialization is required for doctors" });

  try {
    const user = await User.create({ name, email, password, role, specialization, phone, age, gender, experience, fee });
    res.status(201).json({ token: sign(user._id), user: safe(user) });
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ message: firstValidationMessage(err) });
    if (err.code === 11000) return res.status(409).json({ message: "Email already registered" });
    throw err; // anything else goes to the global error handler
  }
});

// POST /api/auth/login
router.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  // Only plain text is accepted (a JSON object here could otherwise be used to trick the database query)
  if (typeof email !== "string" || typeof password !== "string")
    return res.status(400).json({ message: "Enter your email and password" });

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
  if (!user || !(await user.matchPassword(password)))
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
    if (err.name === "ValidationError") return res.status(400).json({ message: firstValidationMessage(err) });
    throw err;
  }
  res.json(req.user);
});

export default router;
