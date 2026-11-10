import { Router } from "express";
import mongoose from "mongoose";
import crypto from "node:crypto";
import Order, { ORDER_FLOW } from "../models/Order.js";
import { protect, allow } from "../middleware/auth.js";
import { priceCart, reserveStock, releaseStock } from "../utils/cart.js";
import { sendOrderEmail } from "../utils/notify.js";

const router = Router();

// ---------- helpers ----------
function checkAddress(input = {}) {
  const fullName = String(input.fullName || "").trim();
  const phone = String(input.phone || "").replace(/\s+/g, "");
  const line = String(input.line || "").trim();
  const pincode = String(input.pincode || "").trim();
  if (fullName.length < 2) return { error: "Enter the receiver's name" };
  if (!/^\d{10}$/.test(phone)) return { error: "Enter a 10-digit phone number" };
  if (line.length < 10) return { error: "Enter the full delivery address" };
  if (!/^\d{6}$/.test(pincode)) return { error: "Enter a 6-digit pincode" };
  return { data: { fullName, phone, line, pincode } };
}

// Refuses a cart that has a problem. A prescription-only medicine without a doctor's prescription is
// "forbidden" (403); other problems (out of stock, too many) are a "conflict" with the current stock (409).
const rejectCart = (res, cart) => {
  const bad = cart.lines.find((l) => l.code === "RX_REQUIRED") || cart.lines.find((l) => l.problem);
  return res.status(bad.code === "RX_REQUIRED" ? 403 : 409).json({ message: `${bad.name}: ${bad.problem}` });
};

// ---------- patient: cart + checkout ----------

// POST /api/orders/preview  { items }  -> current prices, stock and problems for the cart page
router.post("/preview", protect, allow("patient"), async (req, res) => {
  const cart = await priceCart(req.user._id, req.body.items);
  if (cart.error) return res.status(400).json({ message: cart.error });
  res.json(cart);
});

// POST /api/orders/pay  { items, address }  -> step 1 of checkout: check the cart and the address
router.post("/pay", protect, allow("patient"), async (req, res) => {
  const cart = await priceCart(req.user._id, req.body.items);
  if (cart.error) return res.status(400).json({ message: cart.error });
  if (!cart.ok) return rejectCart(res, cart);
  const address = checkAddress(req.body.address);
  if (address.error) return res.status(400).json({ message: address.error });

  // The only payment is the built-in, clearly labelled "Test payment" (no real money is charged)
  res.json({ mode: "test", total: cart.total });
});

// POST /api/orders  { items, address, payment }  -> step 2: payment done, create the order
router.post("/", protect, allow("patient"), async (req, res) => {
  const cart = await priceCart(req.user._id, req.body.items);
  if (cart.error) return res.status(400).json({ message: cart.error });
  if (!cart.ok) return rejectCart(res, cart);
  const address = checkAddress(req.body.address);
  if (address.error) return res.status(400).json({ message: address.error });

  // 1. The payment must be the built-in test payment
  const payment = req.body.payment || {};
  if (payment.mode !== "test") return res.status(400).json({ message: "Use the test payment button" });
  const paymentMode = "test";
  const paymentId = `test_${crypto.randomUUID().slice(0, 8)}`;

  // 2. Take the medicines out of stock (refuses if there isn't enough)
  const stockProblem = await reserveStock(cart.lines);
  if (stockProblem) return res.status(409).json({ message: stockProblem });

  try {
    // 3. Create the order
    const order = await Order.create({
      patient: req.user._id,
      items: cart.lines.map((l) => ({ medicine: l.medicine, name: l.name, price: l.price, quantity: l.quantity })),
      total: cart.total,
      address: address.data,
      paymentId,
      paymentMode,
      timeline: [{ status: "placed", at: new Date() }],
    });
    sendOrderEmail(order._id, "placed"); // in the background
    res.status(201).json(order);
  } catch (err) {
    await releaseStock(cart.lines);
    throw err;
  }
});

// ---------- patient + pharmacist: list ----------

// GET /api/orders  -> patient: my orders, pharmacist: all orders
router.get("/", protect, allow("patient", "pharmacist"), async (req, res) => {
  const filter = req.user.role === "patient" ? { patient: req.user._id } : {};
  res.json(await Order.find(filter).populate("patient", "name phone email").sort({ createdAt: -1 }));
});

// ---------- pharmacist: move an order forward ----------

// POST /api/orders/:id/advance  -> placed > packed > shipped > delivered (one step at a time)
router.post("/:id/advance", protect, allow("pharmacist"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid order id" });
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  const next = ORDER_FLOW[ORDER_FLOW.indexOf(order.status) + 1];
  if (!next) return res.status(400).json({ message: "This order is already delivered" });

  // Only change it if the status is still what we just read (two clicks at once can't skip a step)
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: order.status },
    { $set: { status: next }, $push: { timeline: { status: next, at: new Date() } } },
    { new: true }
  ).populate("patient", "name phone email");
  if (!updated) return res.status(409).json({ message: "Someone else just updated this order. Refresh and try again." });

  if (next === "delivered") sendOrderEmail(updated._id, "delivered");
  res.json(updated);
});

export default router;
