import { Router } from "express";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";
import { protect, allow } from "../middleware/auth.js";

const router = Router();

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

// GET /api/records/me  -> the logged-in patient's own health card data
router.get("/me", protect, allow("patient"), async (req, res) => {
  // Patients created before this feature have no health ID yet - saving creates it
  if (!req.user.healthId) await req.user.save();

  res.json({
    patient: pickPatient(req.user),
    scanUrl: `${process.env.CLIENT_URL || "http://localhost:5173"}/scan/${req.user.healthId}`,
    visits: await pastVisits(req.user._id),
  });
});

// GET /api/records/:healthId  -> a doctor looks up a patient by the ID on the card
router.get("/:healthId", protect, allow("doctor"), async (req, res) => {
  const patient = await User.findOne({ healthId: req.params.healthId, role: "patient" });
  if (!patient) return res.status(404).json({ message: "No patient found with this Health ID" });

  res.json({ patient: pickPatient(patient), visits: await pastVisits(patient._id) });
});

export default router;
