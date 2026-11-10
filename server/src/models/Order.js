import mongoose from "mongoose";

export const ORDER_FLOW = ["placed", "packed", "shipped", "delivered"]; // the only allowed order of statuses

const itemSchema = new mongoose.Schema(
  {
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
    name: { type: String, required: true }, // copied, so old orders still read correctly if the product changes
    price: { type: Number, required: true }, // price per unit at the time of the order
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [itemSchema], required: true },
    total: { type: Number, required: true },
    address: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      line: { type: String, required: true }, // house no, street, city
      pincode: { type: String, required: true },
    },
    paymentId: { type: String, required: true }, // "test_xxxx" for a test payment
    paymentMode: { type: String, enum: ["test"], required: true },
    status: { type: String, enum: ORDER_FLOW, default: "placed" },
    // When each status was reached: [{ status: "placed", at: Date }, { status: "packed", at: Date }, ...]
    timeline: [{ _id: false, status: String, at: Date }],
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
