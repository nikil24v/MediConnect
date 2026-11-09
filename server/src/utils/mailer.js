import nodemailer from "nodemailer";

// Sends one email through Gmail SMTP (EMAIL_USER + EMAIL_PASS = a Gmail "app password").
// If those are missing, the email is NOT sent: it is printed to the console and kept in
// `outbox` so you can preview it in the browser during a demo (dev route only).
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

export const outbox = []; // newest first, only used when email is not configured

export async function sendMail({ to, subject, html }) {
  const recipients = [].concat(to).filter(Boolean);
  if (recipients.length === 0) return { ok: false, mode: "none" };

  if (!mailConfigured()) {
    console.log(`[email NOT SENT - EMAIL_USER/EMAIL_PASS not set] to: ${recipients.join(", ")} | subject: "${subject}"`);
    outbox.unshift({ to: recipients, subject, html, at: new Date() });
    outbox.length = Math.min(outbox.length, 20);
    return { ok: true, mode: "console" };
  }

  try {
    await getTransporter().sendMail({ from: `"MediConnect" <${process.env.EMAIL_USER}>`, to: recipients.join(", "), subject, html });
    console.log(`[email sent] to: ${recipients.join(", ")} | subject: "${subject}"`);
    return { ok: true, mode: "smtp" };
  } catch (err) {
    console.error(`[email FAILED] ${err.message}`);
    return { ok: false, mode: "smtp", error: err.message };
  }
}
