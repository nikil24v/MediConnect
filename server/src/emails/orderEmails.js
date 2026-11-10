import { layout, esc, fmtDate } from "./layout.js";

// "#A1B2C3" - a short order number made from the end of the database id
export const orderNo = (order) => `#${String(order._id).slice(-6).toUpperCase()}`;

const rupees = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

function itemsTable(order) {
  const cell = "padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:14px;";
  const head = "padding:8px 10px;background:#0f766e;color:#fff;font-size:12px;text-align:left;";
  const rows = order.items
    .map((i) => `<tr><td style="${cell}">${esc(i.name)}</td><td style="${cell}">${i.quantity}</td><td style="${cell}">${rupees(i.price * i.quantity)}</td></tr>`)
    .join("");
  return `<table style="width:100%;border-collapse:collapse;margin:12px 0">
    <tr><th style="${head}">Medicine</th><th style="${head}">Qty</th><th style="${head}">Price</th></tr>
    ${rows}
    <tr><td style="${cell}" colspan="2"><strong>Total</strong></td><td style="${cell}"><strong>${rupees(order.total)}</strong></td></tr>
  </table>`;
}

// Email 1: the order was placed
export function orderPlacedEmail(order) {
  const a = order.address;
  const body = `
    <p style="margin:0 0 12px">Thank you, ${esc(order.patient.name)}! We have received your order <strong>${orderNo(order)}</strong> and the pharmacy will pack it soon.</p>
    ${itemsTable(order)}
    <p style="margin:12px 0 4px;color:#64748b;font-size:12px">DELIVERY ADDRESS</p>
    <p style="margin:0">${esc(a.fullName)}, ${esc(a.phone)}<br>${esc(a.line)} - ${esc(a.pincode)}</p>
    <p style="margin:12px 0 0;font-size:13px;color:#64748b">Payment: TEST payment (no real money) &middot; ${esc(order.paymentId)}</p>
  `;
  return { subject: `Order ${orderNo(order)} placed`, html: layout("Order placed", body) };
}

// Email 2: the order was delivered
export function orderDeliveredEmail(order) {
  const body = `
    <p style="margin:0 0 12px">Good news, ${esc(order.patient.name)}! Your order <strong>${orderNo(order)}</strong> was delivered on ${fmtDate(new Date())}.</p>
    ${itemsTable(order)}
    <p style="margin:12px 0 0">Take your medicines exactly as your doctor advised. Get well soon!</p>
  `;
  return { subject: `Order ${orderNo(order)} delivered`, html: layout("Order delivered", body) };
}
