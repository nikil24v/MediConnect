import "dotenv/config";
import express from "express";
import cors from "cors";
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
import { checkEmailSetup } from "./utils/mailer.js";

const app = express();
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

// Demo-only helpers (trigger reminders, preview emails). Never available in production.
if (process.env.NODE_ENV !== "production") app.use("/api/dev", devRoutes);

// 404 + error handler
app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, req, res, next) => res.status(500).json({ message: err.message }));

const PORT = process.env.PORT || 5000;
connectDB(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
    startReminderJobs(); // 8:00, 13:00, 20:00 medicine reminder emails
    checkEmailSetup(); // prints whether emails will really be sent
  })
  .catch((e) => {
    console.error("DB connection failed:", e.message);
    process.exit(1);
  });
