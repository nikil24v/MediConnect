import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ["patient", "doctor"], default: "patient" },
    phone: String,
    age: Number,
    gender: { type: String, enum: ["male", "female", "other", ""], default: "" },
    // doctor-only fields
    specialization: String,
    experience: Number,
    fee: Number,
  },
  { timestamps: true }
);

// Hash the password before saving (never store plain passwords)
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model("User", userSchema);
