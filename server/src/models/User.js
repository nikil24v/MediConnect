import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ["patient", "doctor", "pharmacist"], default: "patient" },
    phone: String,
    age: Number,
    gender: { type: String, enum: ["male", "female", "other", ""], default: "" },
    // doctor-only fields
    specialization: String,
    experience: Number,
    fee: Number,
    // patient-only health record fields
    bloodGroup: { type: String, default: "" },
    allergies: { type: [String], default: [] },
    conditions: { type: [String], default: [] },
    emergencyContact: { type: String, default: "" },
    // Optional: a family member who also gets visit summaries and medicine reminders
    familyEmail: {
      type: String, default: "", trim: true, lowercase: true,
      validate: { validator: (v) => !v || /^\S+@\S+\.\S+$/.test(v), message: "Family email is not valid" },
    },
    notifyFamily: { type: Boolean, default: false }, // "Send reminders to family" switch
    // Unique ID printed on the health card QR (sparse = doctors don't need one)
    healthId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

// Every patient gets a random health ID the first time they are saved
userSchema.pre("save", function () {
  if (this.role === "patient" && !this.healthId) this.healthId = randomUUID();
});

// Hash the password before saving (never store plain passwords)
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model("User", userSchema);
