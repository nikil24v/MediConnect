require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Medicine = require("../models/Medicine");
const { ROLES } = require("../config/constants");

const SAMPLE_DOCTORS = [
  { name: "Ananya Rao", department: "General Medicine", specialization: "Internal Medicine", experienceYears: 8, consultationFee: 400 },
  { name: "Vikram Shah", department: "Cardiology", specialization: "Interventional Cardiology", experienceYears: 12, consultationFee: 800 },
  { name: "Priya Nair", department: "Pediatrics", specialization: "Child Care", experienceYears: 6, consultationFee: 350 },
  { name: "Rohan Mehta", department: "Orthopedics", specialization: "Joint Replacement", experienceYears: 10, consultationFee: 600 },
  { name: "Sneha Iyer", department: "Dermatology", specialization: "Cosmetic Dermatology", experienceYears: 5, consultationFee: 450 },
];

const SAMPLE_MEDICINES = [
  { name: "Paracetamol 650mg", category: "Painkiller", price: 25, stock: 200, unit: "strip of 10" },
  { name: "Amoxicillin 500mg", category: "Antibiotic", price: 60, stock: 150, unit: "strip of 10" },
  { name: "Cetirizine 10mg", category: "Antihistamine", price: 18, stock: 180, unit: "strip of 10" },
  { name: "Vitamin C 500mg", category: "Supplement", price: 90, stock: 100, unit: "bottle of 30" },
  { name: "Omeprazole 20mg", category: "Antacid", price: 45, stock: 120, unit: "strip of 10" },
  { name: "ORS Sachet", category: "Rehydration", price: 10, stock: 300, unit: "sachet" },
];

async function seed() {
  await connectDB(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mediconnect");

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@mediconnect.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@123";

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: "System Admin",
      email: adminEmail,
      password: adminPassword,
      role: ROLES.ADMIN,
    });
    console.log(`[seed] created admin -> ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`[seed] admin already exists -> ${adminEmail}`);
  }

  for (const doc of SAMPLE_DOCTORS) {
    const email = doc.name.toLowerCase().replace(/[^a-z]+/g, ".") + "@mediconnect.com";
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`[seed] doctor already exists -> ${email}`);
      continue;
    }
    const user = await User.create({
      name: doc.name,
      email,
      password: "Doctor@123",
      role: ROLES.DOCTOR,
    });
    await Doctor.create({
      user: user._id,
      department: doc.department,
      specialization: doc.specialization,
      experienceYears: doc.experienceYears,
      consultationFee: doc.consultationFee,
    });
    console.log(`[seed] created doctor -> ${email} / Doctor@123 (${doc.department})`);
  }

  for (const med of SAMPLE_MEDICINES) {
    const existing = await Medicine.findOne({ name: med.name });
    if (existing) continue;
    await Medicine.create(med);
    console.log(`[seed] created medicine -> ${med.name}`);
  }

  console.log("[seed] done. Patients can self-register from the app's Register page.");
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
