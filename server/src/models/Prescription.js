import mongoose from "mongoose";

// One medicine line inside a prescription
const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // The store product this line points to. Empty when the medicine isn't in the store (free text).
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine" },
    dosage: { type: String, default: "" }, // e.g. "500 mg"
    frequency: { type: [String], enum: ["morning", "afternoon", "night"], default: [] }, // when to take it
    durationDays: { type: Number, required: true, min: 1 },
    instructions: { type: String, default: "" }, // e.g. "after food"
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    // Only prescriptions written by a doctor belong to an appointment (uploaded ones don't)
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    diagnosis: { type: String, default: "" },
    notes: { type: String, default: "" },
    medicines: [medicineSchema],
    followUpDate: { type: String, default: null }, // "2026-11-10" (same format as appointment dates)
    source: { type: String, enum: ["doctor", "uploaded"], default: "doctor" },
  },
  { timestamps: true } // gives us createdAt
);

// One prescription per appointment. "sparse" = prescriptions without an appointment are ignored.
prescriptionSchema.index({ appointment: 1 }, { unique: true, sparse: true });

export default mongoose.model("Prescription", prescriptionSchema);
