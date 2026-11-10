import { Router } from "express";
import Prescription from "../models/Prescription.js";
import { protect, allow } from "../middleware/auth.js";
import { scanPrescription } from "../utils/scanner.js";
import { validate } from "./prescriptions.js";
import { linkToStore } from "../utils/linkMedicines.js";

const router = Router();
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const MIN_BYTES = 2000; // smaller than this is not a real photo
const MAX_SCANS_PER_HOUR = 10; // every scan costs an AI call

// Works out the real file type from the first bytes (the browser's "type" can be faked)
function imageType(b) {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) return "image/png";
  if (b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP") return "image/webp";
  return null;
}

// Simple in-memory limit: user id -> times of their recent scans
const recent = new Map();
function tooMany(userId) {
  const hourAgo = Date.now() - 3600000;
  const times = (recent.get(userId) || []).filter((t) => t > hourAgo);
  if (times.length >= MAX_SCANS_PER_HOUR) return true;
  recent.set(userId, [...times, Date.now()]);
  return false;
}

// POST /api/scans  { image: "<base64 or data URL>" }  -> the medicines the AI found. Nothing is saved yet.
router.post("/", protect, allow("patient"), async (req, res) => {
  const base64 = String(req.body.image || "").replace(/^data:[^;]+;base64,/, "");
  if (!base64) return res.status(400).json({ message: "Please choose a photo of your prescription" });

  const image = Buffer.from(base64, "base64");
  if (image.length > MAX_BYTES) return res.status(400).json({ message: "The photo is too large. The limit is 4 MB." });
  const mimeType = imageType(image);
  if (!mimeType || image.length < MIN_BYTES)
    return res.status(400).json({ message: "Please upload a JPG, PNG or WebP photo." });

  if (tooMany(String(req.user._id)))
    return res.status(429).json({ message: "You have scanned many prescriptions in the last hour. Please try again later." });

  try {
    const result = await scanPrescription(image, mimeType);
    if (!result.readable)
      return res.status(422).json({ message: "We could not read any medicines in this photo. Try a clearer, well-lit photo of the whole prescription." });
    res.json(result);
  } catch (err) {
    res.status(err.status || 502).json({ message: err.message });
  }
});

// POST /api/scans/save  { diagnosis, notes, medicines: [...] }  -> the patient confirmed the reviewed list.
// Saved like any prescription (source "uploaded"), so it shows in Health History.
router.post("/save", protect, allow("patient"), async (req, res) => {
  const { error, data } = validate(req.body, false); // same checks as a doctor's prescription, diagnosis is optional
  if (error) return res.status(400).json({ message: error });
  if (data.medicines.length > 20) return res.status(400).json({ message: "A prescription can have at most 20 medicines" });
  data.medicines = await linkToStore(data.medicines); // names the AI read that match a store product get linked to it

  const rx = await Prescription.create({
    ...data,
    diagnosis: data.diagnosis || "Uploaded prescription",
    patient: req.user._id,
    source: "uploaded",
  });
  res.status(201).json(rx);
});

export default router;
