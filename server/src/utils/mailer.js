import nodemailer from "nodemailer";

// Sends one email through Gmail SMTP (EMAIL_USER + EMAIL_PASS = a Gmail "app password").
// If those are missing, the email is NOT sent: a warning is printed to the console instead.
// This function never throws, so a mail problem can never break the app.

const mailConfigured = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

let transporter = null; // created the first time we need it
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      // give up quickly instead of hanging for minutes if Gmail is unreachable
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    });
  }
  return transporter;
};

export async function sendMail({ to, subject, html }) {
  const recipients = [].concat(to).filter(Boolean);
  if (recipients.length === 0) return { ok: false, mode: "none" };

  if (!mailConfigured()) {
    console.warn(`[email] NOT SENT (EMAIL_USER / EMAIL_PASS are missing in server/.env) to: ${recipients.join(", ")} | subject: "${subject}"`);
    return { ok: true, mode: "console" };
  }

  try {
    const info = await getTransporter().sendMail({ from: `"MediConnect" <${process.env.EMAIL_USER}>`, to: recipients.join(", "), subject, html });
    const rejected = info.rejected || [];
    if (rejected.length) console.error(`[email] Gmail REJECTED these addresses: ${rejected.join(", ")}`);
    if ((info.accepted || []).length) console.log(`[email] SENT to: ${info.accepted.join(", ")} | subject: "${subject}"`);
    return { ok: (info.accepted || []).length > 0, mode: "smtp", rejected };
  } catch (err) {
    // err.response is Gmail's own message, e.g. "535 Username and Password not accepted"
    console.error(`[email] FAILED to: ${recipients.join(", ")} | subject: "${subject}" | ${err.code || "error"}: ${err.response || err.message}`);
    if (err.code === "EAUTH") console.error("[email] Gmail refused the login. EMAIL_PASS must be a 16-character App Password (no spaces), not your normal password.");
    return { ok: false, mode: "smtp", error: err.message };
  }
}

// Called once when the server starts: says clearly whether emails will really be sent.
export async function checkEmailSetup() {
  if (!mailConfigured()) {
    console.warn("[email] OFF: EMAIL_USER / EMAIL_PASS are missing in server/.env. Emails are only printed in this terminal, never sent.");
    return;
  }
  try {
    await getTransporter().verify(); // logs in to Gmail, sends nothing
    console.log(`[email] ON: Gmail login works. Emails are sent from ${process.env.EMAIL_USER}`);
  } catch (err) {
    console.error(`[email] Gmail login FAILED: ${err.response || err.message}`);
    console.error("[email] Check EMAIL_USER, and that EMAIL_PASS is a 16-character App Password with no spaces.");
  }
}
