import Prescription from "../models/Prescription.js";
import Order from "../models/Order.js";
import { sendMail } from "./mailer.js";
import { visitSummaryEmail } from "../emails/visitSummary.js";
import { orderPlacedEmail, orderDeliveredEmail } from "../emails/orderEmails.js";

// Who should get an email about this patient: the patient, plus the family
// member if the patient turned "Send visit summaries to family" on.
export function recipientsFor(patient) {
  const list = [patient.email];
  if (patient.notifyFamily && patient.familyEmail) list.push(patient.familyEmail);
  return list;
}

// Emails the patient when their order is placed ("placed") or delivered ("delivered"). Never throws.
export async function sendOrderEmail(orderId, type) {
  try {
    const order = await Order.findById(orderId).populate("patient", "name email");
    if (!order?.patient) return;

    const { subject, html } = type === "delivered" ? orderDeliveredEmail(order) : orderPlacedEmail(order);
    await sendMail({ to: order.patient.email, subject, html }); // only the patient (not family)
  } catch (err) {
    console.error(`[email] could not send "${type}" order email:`, err.message);
  }
}

// Emails the visit summary after a doctor saves a prescription. Never throws.
export async function sendVisitSummary(prescriptionId) {
  try {
    const rx = await Prescription.findById(prescriptionId)
      .populate("doctor", "name specialization")
      .populate("patient", "name email notifyFamily familyEmail");
    if (!rx?.patient) return;

    const { subject, html } = visitSummaryEmail(rx);
    await sendMail({ to: recipientsFor(rx.patient), subject, html });
  } catch (err) {
    console.error("[email] could not send visit summary:", err.message);
  }
}
