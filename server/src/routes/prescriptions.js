import { Router } from "express";
import mongoose from "mongoose";
import Prescription from "../models/Prescription.js";
import Appointment from "../models/Appointment.js";
import { protect, allow } from "../middleware/auth.js";
import { buildPrescriptionPdf } from "../utils/prescriptionPdf.js";
import { sendVisitSummary } from "../utils/notify.js";

const router = Router();
const TIMES = ["morning", "afternoon", "night"];

const populate = (q) =>
  q.populate("doctor", "name specialization").populate("patient", "name healthId age gender");

// Checks the form sent by the doctor (or a patient saving a scanned prescription, where the
// diagnosis is optional). Returns { error } or { data } with cleaned values.
export function validate(body, diagnosisRequired = true) {
  const diagnosis = String(body.diagnosis || "").trim();
  if (diagnosisRequired && !diagnosis) return { error: "Diagnosis is required" };
  if (!Array.isArray(body.medicines) || body.medicines.length === 0) return { error: "Add at least one medicine" };

  const medicines = [];
  for (const [i, m] of body.medicines.entries()) {
    const n = `Medicine ${i + 1}`;
    const name = String(m.name || "").trim();
    if (!name) return { error: `${n}: name is required` };

    const freq = Array.isArray(m.frequency) ? m.frequency : [];
    if (freq.length === 0 || !freq.every((f) => TIMES.includes(f)))
      return { error: `${n}: choose when to take it (morning, afternoon or night)` };

    const durationDays = Number(m.durationDays);
    if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 365)
      return { error: `${n}: number of days must be between 1 and 365` };

    medicines.push({
      name,
      dosage: String(m.dosage || "").trim(),
      frequency: TIMES.filter((t) => freq.includes(t)), // keeps morning > afternoon > night order
      durationDays,
      instructions: String(m.instructions || "").trim(),
    });
  }

  let followUpDate = null;
  if (body.followUpDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.followUpDate) || isNaN(new Date(body.followUpDate)))
      return { error: "Follow-up date is not valid" };
    followUpDate = body.followUpDate;
  }

  return { data: { diagnosis, notes: String(body.notes || "").trim(), medicines, followUpDate } };
}

// GET /api/prescriptions  -> patient: mine, doctor: the ones I wrote
router.get("/", protect, async (req, res) => {
  const key = req.user.role === "doctor" ? "doctor" : "patient";
  res.json(await populate(Prescription.find({ [key]: req.user._id }).sort({ createdAt: -1 })));
});

// GET /api/prescriptions/appointment/:id  -> the prescription of one appointment (or null)
router.get("/appointment/:id", protect, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid appointment id" });
  const appt = await Appointment.findById(req.params.id);
  if (!appt) return res.status(404).json({ message: "Appointment not found" });
  if (!appt.doctor.equals(req.user._id) && !appt.patient.equals(req.user._id))
    return res.status(403).json({ message: "Access denied" });

  res.json(await populate(Prescription.findOne({ appointment: appt._id })));
});

// POST /api/prescriptions  (doctor writes a prescription for their own appointment)
router.post("/", protect, allow("doctor"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.body.appointment)) return res.status(400).json({ message: "Appointment is required" });
  const appt = await Appointment.findById(req.body.appointment);
  if (!appt) return res.status(404).json({ message: "Appointment not found" });
  if (!appt.doctor.equals(req.user._id))
    return res.status(403).json({ message: "You can only write a prescription for your own appointment" });
  if (!["confirmed", "completed"].includes(appt.status))
    return res.status(400).json({ message: "Accept the appointment first, then write the prescription" });

  const { error, data } = validate(req.body);
  if (error) return res.status(400).json({ message: error });

  const already = "A prescription already exists for this appointment. Edit it instead.";
  if (await Prescription.findOne({ appointment: appt._id })) return res.status(409).json({ message: already });

  let rx;
  try {
    rx = await Prescription.create({ ...data, appointment: appt._id, patient: appt.patient, doctor: req.user._id, source: "doctor" });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: already }); // two saves at the same moment
    throw err;
  }

  appt.status = "completed"; // saving a prescription finishes the visit
  await appt.save();
  sendVisitSummary(rx._id); // email the patient (and family) in the background - we don't wait for it
  res.status(201).json(await populate(Prescription.findById(rx._id)));
});

// PUT /api/prescriptions/:id  (only the doctor who wrote it can edit it)
router.put("/:id", protect, allow("doctor"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid prescription id" });
  const rx = await Prescription.findById(req.params.id);
  if (!rx) return res.status(404).json({ message: "Prescription not found" });
  if (!rx.doctor || !rx.doctor.equals(req.user._id))
    return res.status(403).json({ message: "You can only edit your own prescriptions" });

  const { error, data } = validate(req.body);
  if (error) return res.status(400).json({ message: error });

  Object.assign(rx, data);
  await rx.save();
  res.json(await populate(Prescription.findById(rx._id)));
});

// GET /api/prescriptions/:id/pdf  -> downloadable PDF (the patient, or the doctor who wrote it)
router.get("/:id/pdf", protect, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid prescription id" });
  const rx = await populate(Prescription.findById(req.params.id));
  if (!rx) return res.status(404).json({ message: "Prescription not found" });

  const isOwner = rx.patient._id.equals(req.user._id);
  const isAuthor = rx.doctor && rx.doctor._id.equals(req.user._id);
  if (!isOwner && !isAuthor) return res.status(403).json({ message: "Access denied" });

  const day = rx.createdAt.toISOString().slice(0, 10);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="prescription-${day}.pdf"`);
  buildPrescriptionPdf(rx).pipe(res);
});

export default router;
