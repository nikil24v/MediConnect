import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true }, // "2026-10-10"
    time: { type: String, required: true }, // "10:30"
    reason: { type: String, default: "" },
    prediction: { type: mongoose.Schema.Types.ObjectId, ref: "Prediction" }, // optional AI pre-screening
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    notes: { type: String, default: "" }, // doctor's notes
  },
  { timestamps: true }
);

// Database-level safety: one doctor cannot have 2 active bookings in the same slot.
// Even if 2 patients click "Book" at the exact same moment, MongoDB rejects the second one.
appointmentSchema.index(
  { doctor: 1, date: 1, time: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["pending", "confirmed"] } } }
);

export default mongoose.model("Appointment", appointmentSchema);
