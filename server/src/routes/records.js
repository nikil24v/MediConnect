import { Router } from "express";
import rateLimit from "express-rate-limit";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";
import { protect, allow } from "../middleware/auth.js";

const router = Router();

// A Health ID is the key to a patient record, so guessing IDs must be slow: 60 lookups per 5 minutes per address
const lookupLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many lookups. Please wait a few minutes and try again." },
});

// Only these fields are ever sent out (so the password can never leak)
const pickPatient = (u) => ({
  name: u.name,
  age: u.age,
  gender: u.gender,
  phone: u.phone,
  bloodGroup: u.bloodGroup,
  allergies: u.allergies,
  conditions: u.conditions,
  emergencyContact: u.emergencyContact,
  healthId: u.healthId,
});

// Past (completed) visits of a patient, newest first, each with its prescription (or null)
async function pastVisits(patientId) {
  const visits = await Appointment.find({ patient: patientId, status: "completed" })
    .populate("doctor", "name specialization")
    .select("date time reason notes doctor")
    .sort({ date: -1, time: -1 })
    .lean();

  const prescriptions = await Prescription.find({ appointment: { $in: visits.map((v) => v._id) } });
  return visits.map((v) => ({
    ...v,
    prescription: prescriptions.find((p) => p.appointment.equals(v._id)) || null,
  }));
}

// Prescriptions the patient scanned from a paper prescription. They belong to no visit, but a doctor
// should still know about these medicines.
const uploadedPrescriptions = (patientId) =>
  Prescription.find({ patient: patientId, source: "uploaded" }).sort({ createdAt: -1 });

// GET /api/records/me  -> the logged-in patient's own health card data
router.get("/me", protect, allow("patient"), async (req, res) => {
  // Patients created before this feature have no health ID yet - saving creates it
  if (!req.user.healthId) await req.user.save();

  res.json({
    patient: pickPatient(req.user),
    scanUrl: `${process.env.CLIENT_URL || "http://localhost:5173"}/scan/${req.user.healthId}`,
    visits: await pastVisits(req.user._id),
    uploaded: await uploadedPrescriptions(req.user._id),
  });
});

// GET /api/records/:healthId  -> a doctor looks up a patient by the ID on the card
router.get("/:healthId", protect, allow("doctor"), lookupLimiter, async (req, res) => {
  // Typing in small letters is fine. The old long ID of earlier cards still works too.
  const typed = String(req.params.healthId).trim();
  const patient = await User.findOne({
    role: "patient",
    $or: [{ healthId: { $in: [typed, typed.toUpperCase()] } }, { legacyHealthId: typed }],
  });
  if (!patient) return res.status(404).json({ message: "No patient found with this Health ID" });

  res.json({ patient: pickPatient(patient), visits: await pastVisits(patient._id), uploaded: await uploadedPrescriptions(patient._id) });
});

export default router;
