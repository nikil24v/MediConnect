import { Router } from "express";
import { sendRemindersForSlot, SLOTS } from "../utils/reminders.js";
import { outbox } from "../utils/mailer.js";

// DEMO HELPERS - only mounted when NODE_ENV is not "production" (see index.js).
// They are plain GET routes so you can open them straight from the browser address bar.
const router = Router();

// GET /api/dev/reminders/morning | afternoon | night  -> send that reminder slot right now
router.get("/reminders/:slot", async (req, res) => {
  if (!SLOTS[req.params.slot]) return res.status(400).json({ message: "Slot must be morning, afternoon or night" });
  res.json(await sendRemindersForSlot(req.params.slot));
});

// GET /api/dev/outbox  -> emails that were printed instead of sent (when EMAIL_USER/EMAIL_PASS are missing)
router.get("/outbox", (req, res) => {
  res.json(outbox.map((m, i) => ({ preview: `/api/dev/outbox/${i}`, to: m.to, subject: m.subject, at: m.at })));
});

// GET /api/dev/outbox/0  -> opens the newest email as a web page (1 = the one before, ...)
router.get("/outbox/:n", (req, res) => {
  const mail = outbox[Number(req.params.n)];
  if (!mail) return res.status(404).json({ message: "No such email in the outbox" });
  res.type("html").send(mail.html);
});

export default router;
