const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "General", trim: true },
    manufacturer: { type: String, trim: true },
    unit: { type: String, default: "strip", trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Medicine", medicineSchema);
