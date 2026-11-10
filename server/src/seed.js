// Adds 4 demo doctors, 3 demo patients, 1 pharmacist and the medicine store so the app isn't empty.  Run: npm run seed
import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";
import Medicine from "./models/Medicine.js";

// Medicine store catalog: [name, category, price (Rs), stock, needs a prescription?, pack]
// Names are the plain medicine names doctors type in a prescription (strength goes in "dosage").
const medicines = [
  ["Paracetamol", "Pain & Fever", 20, 200, false, "Strip of 15 tablets"],
  ["Ibuprofen", "Pain & Fever", 35, 150, false, "Strip of 10 tablets"],
  ["Aspirin", "Pain & Fever", 15, 120, false, "Strip of 14 tablets"],
  ["Diclofenac Gel", "Pain & Fever", 90, 60, false, "30 g tube"],
  ["Amoxicillin", "Antibiotics", 85, 100, true, "Strip of 10 capsules"],
  ["Azithromycin", "Antibiotics", 120, 80, true, "Strip of 3 tablets"],
  ["Ciprofloxacin", "Antibiotics", 70, 80, true, "Strip of 10 tablets"],
  ["Cefixime", "Antibiotics", 95, 70, true, "Strip of 10 tablets"],
  ["Doxycycline", "Antibiotics", 60, 70, true, "Strip of 10 capsules"],
  ["Metronidazole", "Antibiotics", 30, 90, true, "Strip of 15 tablets"],
  ["Cetirizine", "Allergy & Cold", 25, 180, false, "Strip of 10 tablets"],
  ["Levocetirizine", "Allergy & Cold", 40, 120, false, "Strip of 10 tablets"],
  ["Loratadine", "Allergy & Cold", 30, 100, false, "Strip of 10 tablets"],
  ["Montelukast", "Allergy & Cold", 110, 60, true, "Strip of 10 tablets"],
  ["Cough Syrup", "Cough", 75, 90, false, "100 ml bottle"],
  ["Ambroxol Syrup", "Cough", 65, 80, false, "100 ml bottle"],
  ["Pantoprazole", "Digestive", 55, 110, true, "Strip of 15 tablets"],
  ["Omeprazole", "Digestive", 40, 120, false, "Strip of 10 capsules"],
  ["Domperidone", "Digestive", 35, 90, false, "Strip of 10 tablets"],
  ["ORS Sachet", "Digestive", 12, 300, false, "1 sachet"],
  ["Antacid Gel", "Digestive", 65, 70, false, "170 ml bottle"],
  ["Vitamin C", "Vitamins & Supplements", 90, 100, false, "Bottle of 30 tablets"],
  ["Vitamin D3", "Vitamins & Supplements", 120, 90, false, "Strip of 4 capsules"],
  ["Multivitamin", "Vitamins & Supplements", 150, 80, false, "Bottle of 30 tablets"],
  ["Iron and Folic Acid", "Vitamins & Supplements", 70, 100, false, "Strip of 30 tablets"],
  ["Calcium with Vitamin D3", "Vitamins & Supplements", 110, 90, false, "Strip of 15 tablets"],
  ["Metformin", "Diabetes & Heart", 28, 150, true, "Strip of 20 tablets"],
  ["Amlodipine", "Diabetes & Heart", 32, 120, true, "Strip of 15 tablets"],
  ["Atorvastatin", "Diabetes & Heart", 90, 100, true, "Strip of 15 tablets"],
  ["Antiseptic Liquid", "First Aid & Skin", 70, 100, false, "100 ml bottle"],
];

const doctors = [
  { name: "Dr. Arun Kumar", specialization: "General Physician", experience: 8, fee: 400 },
  { name: "Dr. Atkshaya", specialization: "Cardiologist", experience: 12, fee: 800 },
  { name: "Dr. Priya", specialization: "Dermatologist", experience: 6, fee: 500 },
  { name: "Dr. Divya", specialization: "Neurologist", experience: 15, fee: 900 },
];

// Three demo patients (all use the password patient123)
const patients = [
  { name: "Demo Patient", email: "patient@mediconnect.com", age: 25, gender: "male" },
  { name: "Ravi Kumar", email: "ravi@mediconnect.com", age: 34, gender: "male" },
  { name: "Sneha Rao", email: "sneha@mediconnect.com", age: 29, gender: "female" },
];

await mongoose.connect(process.env.MONGO_URI);
for (const [i, d] of doctors.entries()) {
  // Email = first name, e.g. "Dr. Arun Kumar" -> arun@mediconnect.com
  const email = d.name.replace(/^Dr\.?\s*/, "").split(" ")[0].toLowerCase() + "@mediconnect.com";
  const oldEmail = `doctor${i + 1}@mediconnect.com`; // from earlier seeds
  const existing = await User.findOne({ email: { $in: [email, oldEmail] } });
  if (existing) await User.updateOne({ _id: existing._id }, { $set: { ...d, email } }); // update if changed
  else await User.create({ ...d, email, password: "doctor123", role: "doctor", phone: "98400000" + (10 + i) });
}
for (const p of patients)
  if (!(await User.findOne({ email: p.email })))
    await User.create({ ...p, password: "patient123", role: "patient" });

// Patients created before the short Health IDs get one now. Their old long ID is kept so cards already
// downloaded still open. Patients that already have a short ID are left alone.
for (const p of await User.find({ role: "patient", healthId: { $exists: true, $not: /^MC-\d{2}-/ } })) {
  p.legacyHealthId = p.healthId;
  p.healthId = undefined; // the save below creates the new one
  await p.save();
}


// The pharmacist (pharmacists can't register themselves; they are created here)
if (!(await User.findOne({ email: "pharmacist@mediconnect.com" })))
  await User.create({ name: "Meena Pharmacist", email: "pharmacist@mediconnect.com", password: "pharmacist123", role: "pharmacist", phone: "9840000099" });

// Store catalog. Re-running the seed updates names/prices but never resets existing stock.
for (const [name, category, price, stock, requiresPrescription, pack] of medicines)
  await Medicine.updateOne({ name }, { $set: { category, price, requiresPrescription, pack }, $setOnInsert: { stock } }, { upsert: true });

console.log("Seed done. Doctor login: arun@mediconnect.com / doctor123 | Patient: patient@mediconnect.com / patient123");
console.log("Pharmacist login: pharmacist@mediconnect.com / pharmacist123 | Medicines in store:", await Medicine.countDocuments());
await mongoose.disconnect();
