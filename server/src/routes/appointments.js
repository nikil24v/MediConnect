import { Router } from "express";
import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import { protect, allow } from "../middleware/auth.js";
import { nowParts, isValidDate, isValidTime, expirePastAppointments } from "../utils/appointmentTime.js";

const router = Router();
const ACTIVE = { $in: ["pending", "confirmed"] };

const populate = (q) =>
  q.populate("patient", "name email phone age gender")
   .populate("doctor", "name specialization fee")
   .populate("prediction");

// Which status changes are allowed. Anything not listed (completed, cancelled, expired) is final.
const DOCTOR_MOVES = { pending: ["confirmed", "cancelled"], confirmed: ["completed", "cancelled"] };
const PATIENT_MOVES = { pending: ["cancelled"], confirmed: ["cancelled"] };

// GET /api/appointments  -> patient sees own, doctor sees theirs
router.get("/", protect, async (req, res) => {
  await expirePastAppointments(); // so a request whose time has passed never shows as "pending"
  const key = req.user.role === "doctor" ? "doctor" : "patient";
  res.json(await populate(Appointment.find({ [key]: req.user._id }).sort({ date: -1, time: -1 })));
});

// GET /api/appointments/booked?doctor=<id>&date=2026-10-10  -> times already taken
router.get("/booked", protect, async (req, res) => {
  const { doctor, date } = req.query;
  if (!mongoose.isValidObjectId(doctor) || !isValidDate(date)) return res.status(400).json({ message: "Choose a doctor and a valid date" });
  const taken = await Appointment.find({ doctor, date, status: ACTIVE }).select("time");
  res.json(taken.map((a) => a.time));
});

// POST /api/appointments  (patient books)
router.post("/", protect, allow("patient"), async (req, res) => {
  const { doctor, date, time, reason, prediction } = req.body;
  if (!doctor || !date || !time) return res.status(400).json({ message: "Doctor, date and time are required" });
  if (!mongoose.isValidObjectId(doctor)) return res.status(400).json({ message: "Choose a valid doctor" });
  if (!isValidDate(date)) return res.status(400).json({ message: "The date must look like 2026-10-07" });
  if (!isValidTime(time)) return res.status(400).json({ message: "The time must look like 14:30" });
  if (prediction !== undefined && prediction !== null && prediction !== "" && !mongoose.isValidObjectId(prediction))
    return res.status(400).json({ message: "Invalid symptom report" });
  if (String(reason || "").length > 500) return res.status(400).json({ message: "The reason can be at most 500 characters" });

  const doc = await User.findOne({ _id: doctor, role: "doctor" });
  if (!doc) return res.status(404).json({ message: "Doctor not found" });

  // 1. No booking in the past
  const now = nowParts();
  if (date < now.date || (date === now.date && time <= now.time))
    return res.status(400).json({ message: "You cannot book a time that has already passed." });

  // 2. Doctor already booked at this slot?
  if (await Appointment.findOne({ doctor, date, time, status: ACTIVE }))
    return res.status(409).json({ message: "This slot is already booked. Pick another time." });

  // 3. Patient already has another appointment (with any doctor) at this time?
  if (await Appointment.findOne({ patient: req.user._id, date, time, status: ACTIVE }))
    return res.status(409).json({ message: "You already have another appointment at this time." });

  try {
    const appt = await Appointment.create({ patient: req.user._id, doctor, date, time, reason, prediction: prediction || undefined });
    res.status(201).json(await populate(Appointment.findById(appt._id)));
  } catch (err) {
    // 11000 = duplicate key from a unique index: two requests arrived at the exact same moment.
    // keyPattern tells us which rule was broken (the doctor's slot or the patient's time).
    if (err.code === 11000)
      return res.status(409).json({
        message: err.keyPattern?.patient
          ? "You already have another appointment at this time."
          : "This slot was just booked by someone else. Pick another time.",
      });
    throw err;
  }
});

// PATCH /api/appointments/:id  -> change status / add notes
router.patch("/:id", protect, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid appointment id" });
  const appt = await Appointment.findById(req.params.id);
  if (!appt) return res.status(404).json({ message: "Appointment not found" });

  const isDoctor = req.user.role === "doctor" && appt.doctor.equals(req.user._id);
  const isPatient = req.user.role === "patient" && appt.patient.equals(req.user._id);
  if (!isDoctor && !isPatient) return res.status(403).json({ message: "Access denied" });

  const { status, notes } = req.body;
  if (status && status !== appt.status) {
    const allowed = (isDoctor ? DOCTOR_MOVES : PATIENT_MOVES)[appt.status] || [];
    if (!allowed.includes(status))
      return res.status(400).json({ message: `A ${appt.status} appointment cannot be changed to ${status}.` });
    appt.status = status;
  }
  if (isDoctor && notes !== undefined) appt.notes = String(notes).slice(0, 2000);

  try {
    await appt.save();
  } catch (err) {
    // Re-opening a slot that someone else has booked in the meantime
    if (err.code === 11000) return res.status(409).json({ message: "This time is already taken by another appointment." });
    throw err;
  }
  res.json(await populate(Appointment.findById(appt._id)));
});

export default router;
