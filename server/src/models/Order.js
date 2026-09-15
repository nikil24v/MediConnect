const mongoose = require("mongoose");
const { ORDER_STATUS } = require("../config/constants");

const orderItemSchema = new mongoose.Schema(
  {
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    prescription: { type: mongoose.Schema.Types.ObjectId, ref: "Prescription" },
    items: { type: [orderItemSchema], required: true, validate: (v) => v.length > 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: Object.values(ORDER_STATUS), default: ORDER_STATUS.PENDING },
    paymentMethod: { type: String, default: "cash_on_delivery" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
