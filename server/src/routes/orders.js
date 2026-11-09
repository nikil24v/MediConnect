import { Router } from "express";
import mongoose from "mongoose";
import crypto from "node:crypto";
import Order, { ORDER_FLOW } from "../models/Order.js";
import Payment from "../models/Payment.js";
import { protect, allow } from "../middleware/auth.js";
import { priceCart, reserveStock, releaseStock } from "../utils/cart.js";
import { sendOrderEmail } from "../utils/notify.js";

const router = Router();

// ---------- Razorpay helpers (TEST mode keys start with rzp_test_) ----------
const razorpayConfigured = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

// Asks Razorpay to create a payment order for this amount (paise). Needs internet + valid keys.
async function createRazorpayOrder(amountInPaise) {
  const login = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${login}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountInPaise, currency: "INR", receipt: `mc_${Date.now()}` }),
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.description || "Razorpay refused the request");
  return data;
}

// Razorpay signs "<order id>|<payment id>" with OUR secret key. Only a real, completed payment
// can produce a signature that matches what we calculate here.
function signatureIsValid(razorpayOrderId, razorpayPaymentId, signature) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ---------- other helpers ----------
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

const firstProblem = (cart) => {
  const bad = cart.lines.find((l) => l.problem);
  return `${bad.name}: ${bad.problem}`;
};

// ---------- patient: cart + checkout ----------

// GET /api/orders/payment-config  -> tells the checkout page which payment button to show
router.get("/payment-config", protect, allow("patient"), (req, res) => {
  res.json({ mode: razorpayConfigured() ? "razorpay" : "test" });
});

// POST /api/orders/preview  { items }  -> current prices, stock and problems for the cart page
router.post("/preview", protect, allow("patient"), async (req, res) => {
  const cart = await priceCart(req.user._id, req.body.items);
  if (cart.error) return res.status(400).json({ message: cart.error });
  res.json(cart);
});

// POST /api/orders/pay  { items, address }  -> step 1 of checkout: check everything, start the payment
router.post("/pay", protect, allow("patient"), async (req, res) => {
  const cart = await priceCart(req.user._id, req.body.items);
  if (cart.error) return res.status(400).json({ message: cart.error });
  if (!cart.ok) return res.status(409).json({ message: firstProblem(cart) });
  const address = checkAddress(req.body.address);
  if (address.error) return res.status(400).json({ message: address.error });

  // No Razorpay keys -> the website shows a clearly labelled "Test payment" button instead
  if (!razorpayConfigured()) return res.json({ mode: "test", total: cart.total });

  try {
    const amount = Math.round(cart.total * 100); // rupees -> paise
    const razorpayOrder = await createRazorpayOrder(amount);
    await Payment.create({ user: req.user._id, razorpayOrderId: razorpayOrder.id, amount });
    res.json({ mode: "razorpay", total: cart.total, amount, razorpayOrderId: razorpayOrder.id, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error("[razorpay] could not create order:", err.message);
    res.status(502).json({ message: "Could not start the payment. Please try again." });
  }
});

// POST /api/orders  { items, address, payment }  -> step 2: payment done, create the order
router.post("/", protect, allow("patient"), async (req, res) => {
  const cart = await priceCart(req.user._id, req.body.items);
  if (cart.error) return res.status(400).json({ message: cart.error });
  if (!cart.ok) return res.status(409).json({ message: firstProblem(cart) });
  const address = checkAddress(req.body.address);
  if (address.error) return res.status(400).json({ message: address.error });

  // 1. Is the payment real?
  const payment = req.body.payment || {};
  let paymentMode, paymentId, paymentRecord = null;
  if (razorpayConfigured()) {
    const { razorpay_order_id: orderId, razorpay_payment_id: payId, razorpay_signature: signature } = payment;
    if (!orderId || !payId || !signature) return res.status(400).json({ message: "Payment details are missing" });
    if (!signatureIsValid(orderId, payId, signature)) return res.status(400).json({ message: "Payment could not be verified" });
    // The payment must be one we started for THIS user, for exactly this cart's amount, and not used before
    paymentRecord = { razorpayOrderId: orderId, user: req.user._id, amount: Math.round(cart.total * 100), used: false };
    paymentMode = "razorpay";
    paymentId = payId;
  } else {
    if (payment.mode !== "test") return res.status(400).json({ message: "Use the test payment button" });
    paymentMode = "test";
    paymentId = `test_${crypto.randomUUID().slice(0, 8)}`;
  }

  // 2. Take the medicines out of stock (refuses if there isn't enough)
  const stockProblem = await reserveStock(cart.lines);
  if (stockProblem) return res.status(409).json({ message: stockProblem });

  try {
    // 3. Use up the payment (so it can't be used for a second order)
    if (paymentRecord && !(await Payment.findOneAndUpdate(paymentRecord, { used: true }))) {
      await releaseStock(cart.lines);
      return res.status(400).json({ message: "This payment does not match your cart, or was already used" });
    }

    // 4. Create the order
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
