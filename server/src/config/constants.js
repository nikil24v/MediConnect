const ROLES = Object.freeze({
  ADMIN: "admin",
  DOCTOR: "doctor",
  PATIENT: "patient",
});

const DEPARTMENTS = Object.freeze([
  "General Medicine",
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Dermatology",
  "ENT",
  "Gynecology",
  "Psychiatry",
  "Ophthalmology",
]);

const APPOINTMENT_STATUS = Object.freeze({
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
});

const ORDER_STATUS = Object.freeze({
  PENDING: "pending",
  PAID: "paid",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
});

module.exports = { ROLES, DEPARTMENTS, APPOINTMENT_STATUS, ORDER_STATUS };
