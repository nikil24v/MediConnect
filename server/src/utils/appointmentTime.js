import cron from "node-cron";
import Appointment from "../models/Appointment.js";

const pad = (n) => String(n).padStart(2, "0");

// Current local date "2026-10-07" and time "14:30" (same text format the appointments are stored in)
export const nowParts = (d = new Date()) => ({
  date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
  time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
});

// Only exactly "2026-10-07" is accepted. Odd spellings such as "2026-10-7", "10:30 " or "10:30:00" would
// count as a DIFFERENT slot for the database and let the same time be booked twice.
export const isValidDate = (s) => {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !isNaN(d) && d.toISOString().slice(0, 10) === s; // rejects 2026-02-31 and the like
};
export const isValidTime = (s) => typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

// A request nobody accepted before its time has passed can never happen any more: mark it "expired".
export async function expirePastAppointments(now = new Date()) {
  const { date, time } = nowParts(now);
  const result = await Appointment.updateMany(
    { status: "pending", $or: [{ date: { $lt: date } }, { date, time: { $lte: time } }] },
    { $set: { status: "expired" } }
  );
  if (result.modifiedCount) console.log(`[appointments] ${result.modifiedCount} past pending appointment(s) marked expired`);
  return result.modifiedCount;
}

// Runs once at startup and then every 10 minutes (the appointment lists also check when they are opened)
export function startExpiryJob() {
  expirePastAppointments().catch((err) => console.error("[appointments] expiry check failed:", err.message));
  cron.schedule("*/10 * * * *", () =>
    expirePastAppointments().catch((err) => console.error("[appointments] expiry check failed:", err.message))
  );
}
