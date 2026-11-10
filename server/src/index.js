import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import doctorRoutes from "./routes/doctors.js";
import appointmentRoutes from "./routes/appointments.js";
import predictionRoutes from "./routes/predictions.js";
import recordRoutes from "./routes/records.js";
import prescriptionRoutes from "./routes/prescriptions.js";
import medicineRoutes from "./routes/medicines.js";
import orderRoutes from "./routes/orders.js";
import scanRoutes from "./routes/scans.js";
import devRoutes from "./routes/dev.js";
import { startReminderJobs } from "./utils/reminders.js";
import { startExpiryJob } from "./utils/appointmentTime.js";
import { checkEmailSetup } from "./utils/mailer.js";
import { firstValidationMessage } from "./utils/errors.js";

// The server cannot work without these two, so stop right away with a clear message
for (const name of ["MONGO_URI", "JWT_SECRET"]) {
  if (!process.env[name]) {
    console.error(`Missing ${name}. Copy server/.env.example to server/.env and fill it in.`);
    process.exit(1);
  }
}

const production = process.env.NODE_ENV === "production";
const app = express();
app.use(helmet()); // safe default security headers; also removes the "X-Powered-By: Express" header
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));

// Prescription photos arrive as base64 text, so this route accepts a bigger body than the default
// 100 KB. It must be registered BEFORE the global express.json() below, which would reject them.
app.use("/api/scans", express.json({ limit: "8mb" }), scanRoutes);
app.use("/api/scans", (err, req, res, next) => {
  if (err.type === "entity.too.large") return res.status(413).json({ message: "The photo is too large. The limit is 4 MB." });
  next(err);
});

app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/orders", orderRoutes);

// Demo-only helpers (trigger reminders, preview emails). Never available in production, and even
// otherwise they only answer requests made from this same computer, never from the network.
const fromThisComputer = (req, res, next) =>
  ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress)
    ? next()
    : res.status(404).json({ message: "Route not found" });
if (!production) app.use("/api/dev", fromThisComputer, devRoutes);

// 404 + error handler
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Last stop for every error. The real error is always written to this server's console; the browser
// only gets a safe sentence. In production an unexpected error never shows its technical message.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  let status = 500;
  let message = "Something went wrong on our side. Please try again.";
  if (err.type === "entity.parse.failed") { status = 400; message = "The request is not valid JSON."; }
  else if (err.type === "entity.too.large") { status = 413; message = "The request is too large."; }
  else if (err.name === "CastError") { status = 400; message = "One of the values sent is not valid."; }
  else if (err.name === "ValidationError") { status = 400; message = firstValidationMessage(err); }
  else if (err.code === 11000) { status = 409; message = "That already exists."; }
  else if (!production) message = err.message; // developers see the reason while building

  if (status === 500) console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  else console.warn(`[error] ${req.method} ${req.originalUrl} -> ${status}: ${err.message}`);
  res.status(status).json({ message });
});

const PORT = process.env.PORT || 5000;
connectDB(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
    startReminderJobs(); // 8:00, 13:00, 20:00 medicine reminder emails
    startExpiryJob(); // past pending appointments become "expired"
    checkEmailSetup(); // prints whether emails will really be sent
  })
  .catch((e) => {
    console.error("DB connection failed:", e.message);
    process.exit(1);
  });
