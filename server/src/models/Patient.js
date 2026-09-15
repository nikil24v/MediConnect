const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    dob: { type: Date },
    gender: { type: String, enum: ["male", "female", "other", ""], default: "" },
    bloodGroup: { type: String, trim: true },
    address: { type: String, trim: true },
    medicalHistory: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);
