import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

// Health ID such as "MC-26-7K4P9Q": MC + the year + 6 random characters. Easy to read out loud
// (no 0/O or 1/I) but still impossible to guess one after another, unlike a running number.
const ID_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // exactly 32 characters
const newHealthId = () =>
  `MC-${String(new Date().getFullYear()).slice(-2)}-${[...randomBytes(6)].map((b) => ID_CHARS[b % 32]).join("")}`;

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
    // The old long ID of patients created before the short IDs, so cards already downloaded keep working
    legacyHealthId: { type: String, unique: true, sparse: true, select: false },
  },
  { timestamps: true }
);

// Every patient gets a Health ID the first time they are saved (tries again in the very unlikely case it is taken)
userSchema.pre("save", async function () {
  if (this.role !== "patient" || this.healthId) return;
  for (let attempt = 0; attempt < 10; attempt++) {
    const id = newHealthId();
    if (!(await this.constructor.exists({ healthId: id }))) return void (this.healthId = id);
  }
  throw new Error("Could not create a Health ID. Please try again.");
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
