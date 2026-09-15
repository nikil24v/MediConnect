const mongoose = require("mongoose");
const { DEPARTMENTS } = require("../config/constants");

const doctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    department: { type: String, enum: DEPARTMENTS, required: true },
    specialization: { type: String, trim: true },
    qualification: { type: String, trim: true },
    experienceYears: { type: Number, default: 0, min: 0 },
    consultationFee: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);
