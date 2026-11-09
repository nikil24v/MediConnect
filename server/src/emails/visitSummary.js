import { layout, esc, fmtDate, medicineTable } from "./layout.js";

// Email sent when a doctor saves a prescription.
// `rx` needs doctor (name, specialization) and patient (name) filled in.
export function visitSummaryEmail(rx) {
  const patient = rx.patient.name;
  const doctor = rx.doctor?.name || "the doctor";

  const body = `
    <p style="margin:0 0 12px">${esc(patient)} had a consultation with <strong>${esc(doctor)}</strong>${rx.doctor?.specialization ? ` (${esc(rx.doctor.specialization)})` : ""} on ${fmtDate(rx.createdAt)}.</p>
    <p style="margin:0 0 4px;color:#64748b;font-size:12px">DIAGNOSIS</p>
    <p style="margin:0 0 12px;font-size:16px"><strong>${esc(rx.diagnosis)}</strong></p>
    <p style="margin:0;color:#64748b;font-size:12px">MEDICINES</p>
    ${medicineTable(rx.medicines)}
    ${rx.notes ? `<p style="margin:12px 0 4px;color:#64748b;font-size:12px">DOCTOR'S NOTES</p><p style="margin:0">${esc(rx.notes)}</p>` : ""}
    ${rx.followUpDate ? `<p style="margin:12px 0 0"><strong>Follow-up visit:</strong> ${fmtDate(rx.followUpDate)}</p>` : ""}
  `;

  return { subject: `Visit summary: ${patient} with ${doctor}`, html: layout("Visit summary", body) };
}
