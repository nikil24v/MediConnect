// Shared look for every email. Emails need inline CSS, so the styles are written inline.

// Makes user-typed text safe to put inside HTML
export const esc = (text = "") =>
  String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

// Table of medicines used by the visit summary
export function medicineTable(medicines) {
  const cell = "padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:14px;";
  const rows = medicines
    .map(
      (m) => `<tr>
        <td style="${cell}"><strong>${esc(m.name)}</strong></td>
        <td style="${cell}">${esc(m.dosage || "-")}</td>
        <td style="${cell}">${m.frequency.map(cap).join(", ")}</td>
        <td style="${cell}">${m.durationDays}</td>
        <td style="${cell}">${esc(m.instructions || "-")}</td>
      </tr>`
    )
    .join("");
  const head = "padding:8px 10px;background:#0f766e;color:#fff;font-size:12px;text-align:left;";
  return `<table style="width:100%;border-collapse:collapse;margin:12px 0">
    <tr><th style="${head}">Medicine</th><th style="${head}">Dosage</th><th style="${head}">When</th><th style="${head}">Days</th><th style="${head}">Instructions</th></tr>
    ${rows}
  </table>`;
}

// Wraps the message body in the MediConnect header and footer
export function layout(title, body) {
  return `<!doctype html>
<html><head><meta charset="utf-8"></head><body style="margin:0;background:#f6f8fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#0f766e;color:#fff;padding:18px 24px;border-radius:12px 12px 0 0;font-size:20px;font-weight:bold;">MediConnect</div>
    <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;">
      <h2 style="margin:0 0 14px;font-size:20px;">${esc(title)}</h2>
      ${body}
    </div>
    <p style="font-size:12px;color:#64748b;text-align:center;margin-top:16px;">
      Automated message from MediConnect. Take medicines only as advised by your doctor.
    </p>
  </div>
</body></html>`;
}
