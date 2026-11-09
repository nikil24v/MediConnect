import cron from "node-cron";
import Prescription from "../models/Prescription.js";
import { sendMail } from "./mailer.js";
import { recipientsFor } from "./notify.js";
import { medicineReminderEmail } from "../emails/medicineReminder.js";

const TIMEZONE = "Asia/Kolkata";

// When each reminder runs (cron format: minute hour day month weekday)
export const SLOTS = {
  morning: "0 8 * * *", // 8:00 AM
  afternoon: "0 13 * * *", // 1:00 PM
  night: "0 20 * * *", // 8:00 PM
};

// Turns a date into a whole-day number in Indian time, so two dates can be subtracted
function dayNumber(date) {
  const [y, m, d] = date.toLocaleDateString("en-CA", { timeZone: TIMEZONE }).split("-").map(Number); // "2026-11-01"
  return Date.UTC(y, m - 1, d) / 86400000;
}

// Sends the reminders for one slot. Every patient gets ONE email with all their medicines
// for that slot, from every active prescription (doctor-written or uploaded).
export async function sendRemindersForSlot(slot, now = new Date()) {
  const today = dayNumber(now);

  // A medicine lasts at most 365 days, so older prescriptions can never be active
  const prescriptions = await Prescription.find({ createdAt: { $gte: new Date(now - 366 * 86400000) } })
    .populate("patient", "name email notifyFamily familyEmail");

  const byPatient = new Map(); // patient id -> { patient, items: [medicines to take now] }
  for (const rx of prescriptions) {
    if (!rx.patient) continue;
    const dayIndex = today - dayNumber(rx.createdAt); // 0 = the day it was prescribed

    for (const med of rx.medicines) {
      const active = dayIndex >= 0 && dayIndex < med.durationDays;
      if (!active || !med.frequency.includes(slot)) continue;

      const entry = byPatient.get(String(rx.patient._id)) || { patient: rx.patient, items: [] };
      entry.items.push(med);
      byPatient.set(String(rx.patient._id), entry);
    }
  }

  const emails = [];
  for (const { patient, items } of byPatient.values()) {
    const { subject, html } = medicineReminderEmail({ patient, slot, items });
    const to = recipientsFor(patient);
    const result = await sendMail({ to, subject, html });
    emails.push({ to, subject, medicines: items.length, ok: result.ok });
  }
  return { slot, patients: emails.length, emails };
}

// Starts the three daily jobs (called once when the server starts)
export function startReminderJobs() {
  for (const [slot, schedule] of Object.entries(SLOTS)) {
    cron.schedule(
      schedule,
      () => sendRemindersForSlot(slot).catch((err) => console.error(`[reminders] ${slot} failed:`, err.message)),
      { timezone: TIMEZONE }
    );
  }
  console.log("Medicine reminders scheduled for 8:00, 13:00 and 20:00 (Asia/Kolkata)");
}
