import mongoose from "mongoose";

// One product in the medicine store
const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true }, // same name the doctor types in a prescription, e.g. "Paracetamol"
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 }, // in rupees
    stock: { type: Number, required: true, min: 0, default: 0 },
    requiresPrescription: { type: Boolean, default: false }, // true = can only be bought with a doctor's/uploaded prescription
    imageUrl: { type: String, default: "" }, // optional
    pack: { type: String, default: "" }, // e.g. "Strip of 10 tablets"
  },
  { timestamps: true }
);

export default mongoose.model("Medicine", medicineSchema);
