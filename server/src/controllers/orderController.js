const Order = require("../models/Order");
const Medicine = require("../models/Medicine");
const Patient = require("../models/Patient");
const { ROLES } = require("../config/constants");

// POST /api/orders - patient checks out their pharmacy cart
// body: { items: [{ medicineId, quantity }], prescriptionId? }
async function createOrder(req, res, next) {
  try {
    const { items, prescriptionId } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "At least one item is required" });
    }

    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(404).json({ error: "Patient profile not found" });

    const orderItems = [];
    let totalAmount = 0;

    for (const { medicineId, quantity } of items) {
      const qty = Number(quantity) || 0;
      if (qty < 1) return res.status(400).json({ error: "Quantity must be at least 1" });

      const medicine = await Medicine.findById(medicineId);
      if (!medicine) return res.status(404).json({ error: `Medicine ${medicineId} not found` });
      if (medicine.stock < qty) {
        return res.status(409).json({ error: `Not enough stock for ${medicine.name}` });
      }

      medicine.stock -= qty;
      await medicine.save();

      orderItems.push({ medicine: medicine._id, name: medicine.name, price: medicine.price, quantity: qty });
      totalAmount += medicine.price * qty;
    }

    const order = await Order.create({
      patient: patient._id,
      prescription: prescriptionId || undefined,
      items: orderItems,
      totalAmount,
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

// GET /api/orders - scoped by role
async function listOrders(req, res, next) {
  try {
    const filter = {};
    if (req.user.role === ROLES.PATIENT) {
      const patient = await Patient.findOne({ user: req.user._id });
      filter.patient = patient?._id;
    }
    if (req.query.status) filter.status = req.query.status;

    const orders = await Order.find(filter)
      .populate({ path: "patient", populate: { path: "user", select: "name email phone" } })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/orders/:id/status - admin only
async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    next(err);
  }
}

module.exports = { createOrder, listOrders, updateOrderStatus };
