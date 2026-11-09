import mongoose from "mongoose";
import Medicine from "../models/Medicine.js";
import Prescription from "../models/Prescription.js";

export const MAX_QTY = 20; // most units of one medicine in one order

// "Paracetamol  " and "paracetamol" are the same medicine
export const norm = (text) => String(text || "").toLowerCase().replace(/\s+/g, " ").trim();

// Checks a cart against the REAL catalog (never trust prices/stock sent by the browser).
// items = [{ medicine: "<id>", quantity: 2 }]
// Returns { error } for a broken cart, or { lines, total, ok }.
// Each line has `problem` = null, or a message such as "Out of stock".
export async function priceCart(patientId, items) {
  if (!Array.isArray(items) || items.length === 0) return { error: "Your cart is empty" };

  // Add up the quantity of each medicine
  const quantities = new Map();
  for (const item of items) {
    const qty = Number(item.quantity);
    if (!mongoose.isValidObjectId(item.medicine) || !Number.isInteger(qty) || qty < 1)
      return { error: "Your cart has an invalid item" };
    const id = String(item.medicine);
    quantities.set(id, (quantities.get(id) || 0) + qty);
  }

  const medicines = await Medicine.find({ _id: { $in: [...quantities.keys()] } });
  if (medicines.length !== quantities.size) return { error: "Some medicines in your cart are no longer sold" };

  // Names of every medicine a DOCTOR has prescribed to this patient. Photos the patient scanned don't
  // count, otherwise anyone could upload any picture to unlock prescription-only medicines.
  let prescribed = new Set();
  if (medicines.some((m) => m.requiresPrescription)) {
    const prescriptions = await Prescription.find({ patient: patientId, source: "doctor" }).select("medicines.name");
    prescribed = new Set(prescriptions.flatMap((p) => p.medicines.map((m) => norm(m.name))));
  }

  const lines = medicines.map((m) => {
    const quantity = quantities.get(String(m._id));
    let problem = null;
    if (quantity > MAX_QTY) problem = `You can order at most ${MAX_QTY} at a time`;
    else if (m.stock === 0) problem = "Out of stock";
    else if (quantity > m.stock) problem = `Only ${m.stock} left in stock`;
    else if (m.requiresPrescription && !prescribed.has(norm(m.name))) problem = "Needs a prescription that includes this medicine";

    return {
      medicine: m._id, name: m.name, price: m.price, quantity, stock: m.stock,
      requiresPrescription: m.requiresPrescription, imageUrl: m.imageUrl, pack: m.pack, problem,
    };
  });

  const total = Math.round(lines.reduce((sum, l) => sum + l.price * l.quantity, 0) * 100) / 100;
  return { lines, total, ok: lines.every((l) => !l.problem) };
}

// Takes the units out of stock. The check "stock >= quantity" and the subtraction happen in ONE
// database step, so two people buying the last unit at the same moment can never both succeed.
// Returns null on success, or a message (and puts back anything already taken).
export async function reserveStock(lines) {
  const taken = [];
  for (const line of lines) {
    const result = await Medicine.updateOne(
      { _id: line.medicine, stock: { $gte: line.quantity } },
      { $inc: { stock: -line.quantity } }
    );
    if (result.modifiedCount !== 1) {
      await releaseStock(taken);
      return `${line.name} just went out of stock or has fewer units left. Please update your cart.`;
    }
    taken.push(line);
  }
  return null;
}

// Puts units back (used when something fails after stock was taken)
export const releaseStock = (lines) =>
  Promise.all(lines.map((l) => Medicine.updateOne({ _id: l.medicine }, { $inc: { stock: l.quantity } })));
