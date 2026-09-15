# MediConnect — Hospital, Appointment & Pharmacy Management System

A full-stack **MERN** application with role-based access control (RBAC) across three dedicated
portals — **Admin**, **Doctor** and **Patient** — covering appointment scheduling, digital
prescriptions and in-app pharmacy ordering for a hospital/clinic setting.

## Highlights

- **Role-Based Access Control** with three portals (Admin / Doctor / Patient) across 10
  departments and 6 core modules: doctor management, patient management, appointment
  scheduling, digital prescriptions, pharmacy inventory & ordering, and dashboard analytics.
- **JWT authentication** with bcrypt password hashing, route-level RBAC middleware enforcing
  role permissions across 25+ REST API endpoints, and an Axios interceptor that auto-attaches
  the token to every request and reacts to session expiry without a hard page reload.
- **7 MongoDB data models** (User, Doctor, Patient, Appointment, Prescription, Medicine, Order)
  with real appointment-slot clash detection, atomic pharmacy stock deduction on checkout, and
  auto-completion of an appointment once a doctor files its prescription.
- **Admin analytics dashboard** with live aggregation queries (Mongo `$group`) visualized via
  Recharts — appointments by department, orders by status, revenue, low-stock alerts.
- **Responsive, component-based UI** built with Tailwind CSS and client-side routing via
  React Router DOM, with role-scoped protected routes and per-portal navigation.

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 18 (Vite), React Router DOM, Tailwind CSS, Recharts, Axios |
| Backend  | Node.js, Express, Mongoose |
| Database | MongoDB |
| Auth     | JWT + bcrypt, route-level RBAC middleware |

## Project structure

```
MediConnect/
├── server/                  Express REST API
│   └── src/
│       ├── config/          DB connection + shared constants (roles, departments, statuses)
│       ├── models/          User, Doctor, Patient, Appointment, Prescription, Medicine, Order
│       ├── middleware/      JWT auth (protect) + RBAC (authorize)
│       ├── controllers/     Business logic per resource
│       ├── routes/          Route definitions wired to controllers + middleware
│       └── utils/           Token generation, DB seed script
└── client/                  React (Vite) SPA
    └── src/
        ├── api/              Axios instance (interceptors) + typed endpoint helpers
        ├── context/          AuthContext (login/register/logout, session state)
        ├── components/       Shared UI: PortalLayout, ProtectedRoute, StatCard, Badge...
        └── pages/
            ├── auth/         Login, Register
            ├── admin/        Dashboard, Doctors, Patients, Appointments, Medicines, Orders
            ├── doctor/       Dashboard, Queue, Prescribe, Patients, Prescriptions
            └── patient/      Dashboard, Book Appointment, Prescriptions, Pharmacy, Orders, Profile
```

## Getting started

### 1. Backend

```bash
cd server
cp .env.example .env   # set MONGODB_URI and a real JWT_SECRET
npm install
npm run seed            # creates an admin account + 5 sample doctors + pharmacy stock
npm run dev
```

The seed script prints the admin and doctor login credentials it creates (default:
`admin@mediconnect.com` / `Admin@123`). Patients always self-register from the app.

### 2. Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173.

## Core flows

1. **Patient** registers, browses doctors by department, and books an appointment slot.
2. **Doctor** confirms the appointment from their queue, then records a diagnosis and one or
   more medicines — this automatically marks the appointment `completed`.
3. **Patient** sees the prescription under *My Prescriptions* and can order the medicines (or
   anything else in stock) from the *Pharmacy*; checkout atomically deducts stock and creates
   a bill.
4. **Admin** manages doctor accounts and pharmacy inventory, tracks every appointment/order, and
   reviews hospital-wide analytics on the dashboard.

## API overview (25+ endpoints)

- `POST /api/auth/register|login`, `GET /api/auth/me`
- `GET/POST/PATCH /api/doctors`, `PATCH /api/doctors/:id/active`
- `GET/PATCH /api/patients`
- `GET/POST /api/appointments`, `PATCH /api/appointments/:id/status`
- `GET/POST /api/prescriptions`
- `GET/POST/PATCH/DELETE /api/medicines`
- `GET/POST /api/orders`, `PATCH /api/orders/:id/status`
- `GET /api/dashboard/admin`, `GET /api/dashboard/doctor`

Every route beyond `/auth` requires a valid JWT; role-restricted routes are additionally
gated by an `authorize(...roles)` middleware, enforced server-side (verified independently of
the UI).

## Notes

- This is a portfolio/demo project, not a certified medical system — no PHI/HIPAA compliance
  work has been done.
- No email/notification or background-job layer by design; all state changes are synchronous
  and immediately reflected via the REST API.
