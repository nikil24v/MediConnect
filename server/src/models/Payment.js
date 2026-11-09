import mongoose from "mongoose";

// Remembers every Razorpay payment WE started: who it is for and how much it is for.
// When the browser later says "payment done", we check it against this record,
// so nobody can pay for a small cart and use that payment for a bigger one.
const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true }, // in paise (1 rupee = 100 paise), as Razorpay expects
    used: { type: Boolean, default: false }, // a payment can create only one order
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
