import { layout, esc, cap } from "./layout.js";

// Email sent at 8:00 / 13:00 / 20:00 with the medicines to take in that time slot.
// `items` = list of medicines (name, dosage, instructions) for this patient.
export function medicineReminderEmail({ patient, slot, items }) {
  const label = cap(slot);

  const list = items
    .map(
      (m) => `<li style="margin:0 0 10px;font-size:15px"><strong>${esc(m.name)}</strong>${m.dosage ? ` - ${esc(m.dosage)}` : ""}${
        m.instructions ? `<br><span style="color:#64748b;font-size:13px">${esc(m.instructions)}</span>` : ""
      }</li>`
    )
    .join("");

  const body = `
    <p style="margin:0 0 12px">This is a reminder for <strong>${esc(patient.name)}</strong>. Please take these medicines now:</p>
    <ul style="padding-left:20px;margin:0 0 8px">${list}</ul>
  `;

  return { subject: `${label} medicine reminder for ${patient.name}`, html: layout(`${label} medicines`, body) };
}
