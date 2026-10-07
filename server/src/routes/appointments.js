import { Router } from "express";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import { protect, allow } from "../middleware/auth.js";

const router = Router();
const ACTIVE = { $in: ["pending", "confirmed"] };

// Current local date "2026-10-07" and time "14:30"
const pad = (n) => String(n).padStart(2, "0");
const nowParts = () => {
  const d = new Date();
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
};
const populate = (q) =>
  q.populate("patient", "name email phone age gender")
   .populate("doctor", "name specialization fee")
   .populate("prediction");

// GET /api/appointments  -> patient sees own, doctor sees theirs
router.get("/", protect, async (req, res) => {
  const key = req.user.role === "doctor" ? "doctor" : "patient";
  res.json(await populate(Appointment.find({ [key]: req.user._id }).sort({ date: -1, time: -1 })));
});

// GET /api/appointments/booked?doctor=<id>&date=2026-10-10  -> times already taken
router.get("/booked", protect, async (req, res) => {
  const { doctor, date } = req.query;
  const taken = await Appointment.find({ doctor, date, status: ACTIVE }).select("time");
  res.json(taken.map((a) => a.time));
});

// POST /api/appointments  (patient books)
router.post("/", protect, allow("patient"), async (req, res) => {
  const { doctor, date, time, reason, prediction } = req.body;
  if (!doctor || !date || !time) return res.status(400).json({ message: "Doctor, date and time are required" });
  const doc = await User.findOne({ _id: doctor, role: "doctor" });
  if (!doc) return res.status(404).json({ message: "Doctor not found" });

  // 1. No booking in the past
  const now = nowParts();
  if (date < now.date || (date === now.date && time <= now.time))
    return res.status(400).json({ message: "You cannot book a time that has already passed." });

  // 2. Doctor already booked at this slot?
  if (await Appointment.findOne({ doctor, date, time, status: ACTIVE }))
    return res.status(409).json({ message: "This slot is already booked. Pick another time." });

  // 3. Patient already has another appointment at this time?
  if (await Appointment.findOne({ patient: req.user._id, date, time, status: ACTIVE }))
    return res.status(409).json({ message: "You already have another appointment at this time." });

  try {
    const appt = await Appointment.create({ patient: req.user._id, doctor, date, time, reason, prediction });
    res.status(201).json(await populate(Appointment.findById(appt._id)));
  } catch (err) {
    // 11000 = duplicate key from the unique index (two people booked at the exact same moment)
    if (err.code === 11000) return res.status(409).json({ message: "This slot was just booked by someone else. Pick another time." });
    throw err;
  }
});

// PATCH /api/appointments/:id  -> change status / add notes
router.patch("/:id", protect, async (req, res) => {
  const appt = await Appointment.findById(req.params.id);
  if (!appt) return res.status(404).json({ message: "Appointment not found" });

  const isDoctor = req.user.role === "doctor" && appt.doctor.equals(req.user._id);
  const isPatient = req.user.role === "patient" && appt.patient.equals(req.user._id);
  if (!isDoctor && !isPatient) return res.status(403).json({ message: "Access denied" });

  const { status, notes } = req.body;
  if (status) {
    const allowed = isDoctor ? ["confirmed", "completed", "cancelled"] : ["cancelled"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "You cannot set this status" });
    appt.status = status;
  }
  if (isDoctor && notes !== undefined) appt.notes = notes;
  await appt.save();
  res.json(await populate(Appointment.findById(appt._id)));
});

export default router;
