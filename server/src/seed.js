// Adds demo doctors + a demo patient so the app isn't empty.  Run: npm run seed
import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";

const doctors = [
  { name: "Dr. Arun Kumar", specialization: "General Physician", experience: 8, fee: 400 },
  { name: "Dr. Atkshaya", specialization: "Cardiologist", experience: 12, fee: 800 },
  { name: "Dr. Priya", specialization: "Dermatologist", experience: 6, fee: 500 },
  { name: "Dr. Suresh", specialization: "Gastroenterologist", experience: 10, fee: 700 },
  { name: "Dr. Divya", specialization: "Neurologist", experience: 15, fee: 900 },
  { name: "Dr. Ramesh", specialization: "Pulmonologist", experience: 9, fee: 650 },
  { name: "Dr. Lakshmi", specialization: "Endocrinologist", experience: 11, fee: 750 },
  { name: "Dr. Vignesh", specialization: "Orthopedic", experience: 7, fee: 600 },
  { name: "Dr. Anitha", specialization: "Urologist", experience: 9, fee: 650 },
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
if (!(await User.findOne({ email: "patient@mediconnect.com" })))
  await User.create({ name: "Demo Patient", email: "patient@mediconnect.com", password: "patient123", role: "patient", age: 25, gender: "male" });

console.log("Seed done. Doctor login: arun@mediconnect.com / doctor123 | Patient: patient@mediconnect.com / patient123");
await mongoose.disconnect();
