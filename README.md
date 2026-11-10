# MediConnect – AI-Powered Healthcare Platform

MediConnect is a MERN stack web app for **patients**, **doctors** and a **pharmacist**. A patient can check
symptoms with a Machine Learning model, book a doctor, receive a digital prescription, carry a QR health
card, scan a paper prescription with AI, and order medicines online. Doctors manage visits and write
prescriptions. The pharmacist packs and ships the orders and keeps the stock up to date.

> ⚠️ AI predictions are for information only and are not a medical diagnosis.

## Roles and features

**Patient**
- Register / login, profile (blood group, allergies, conditions, emergency contact, family email)
- **AI symptom checker:** pick symptoms, get the top 3 possible diseases with confidence and a suggested specialist
- Find doctors and book a slot (a doctor cannot be double-booked, and a patient cannot hold two appointments at the same time)
- Appointments with status **pending, confirmed, completed, cancelled or expired** (a request nobody accepted in time expires automatically)
- **Health Card:** personal QR code and a short Health ID such as `MC-26-7K4P9Q`, downloadable as an image
- **Digital prescriptions:** written by the doctor, shown in Health History and downloadable as a **PDF**
- **AI prescription scanner:** upload a photo of a paper prescription, the AI (Google Gemini) reads the medicines, the patient checks and edits them, then saves
- **Medicine store:** search, cart, checkout with a test payment (or Razorpay test mode), order tracking (placed, packed, shipped, delivered). Prescription-only medicines are sold only against a doctor's prescription
- **Emails:** order confirmation and delivery, visit summary after each consultation, and medicine reminders at 8:00, 13:00 and 20:00. A family member can receive the visit summaries and reminders too

**Doctor**
- Dashboard with today's visits and pending requests
- Accept, reject, complete appointments, see the patient's AI pre-screening report
- Write and edit prescriptions. The medicine name box suggests medicines from the store (free text still works for medicines the store does not stock)
- **Scan Health ID:** open a patient's record by QR link or by typing the Health ID: health details, past visits with their prescriptions, and prescriptions the patient uploaded

**Pharmacist** (accounts are created by the seed script, nobody can register as a pharmacist)
- Dashboard with new orders and low-stock medicines
- Orders: move each order to the next step (placed, packed, shipped, delivered)
- **Inventory:** every medicine with its stock, edit the number and save, low stock is highlighted

## Architecture

| Folder        | What it is                                                                   |
| ------------- | ---------------------------------------------------------------------------- |
| `client/`     | React 19 + Vite frontend (pages, routing, plain CSS)                         |
| `server/`     | Express 5 REST API, MongoDB (Mongoose), JWT auth, e-mail, PDF, scheduled jobs |
| `ml-service/` | Python: dataset, Random Forest training, Flask prediction API                |

Browser → React (`:5173`) → Express API (`:5000`) → MongoDB, and the API calls the ML service (`:5001`).
The Gemini API (scanner), Gmail (emails) and Razorpay (payments) are optional and only used when configured.

## Machine Learning (`ml-service`)

- **Dataset:** Disease Prediction dataset (Kaggle), 4,920 rows, 132 symptom columns (0/1), 41 diseases
- **Cleaning:** removed duplicate rows, leaving **304 unique records**
- **Algorithm:** Random Forest (100 decision trees, majority vote)
- **Split:** 75% train / 25% test
- **Result:** accuracy, precision, recall and F1 are 100% on the test data (a small, clean dataset, so expect lower accuracy on real patients)
- `train.py` trains and saves the model, `app.py` loads it and serves predictions
- The dataset contains the column `fluid_overload` twice and the first copy is empty, so the app lists it once as "Fluid overload"

## How to run

### 1. Requirements

- Node.js 20 or newer
- Python 3.10 – 3.12 (3.12 is what this project was tested with)
- MongoDB Community Server running locally, or a free MongoDB Atlas cluster

On Windows use **PowerShell or Command Prompt** (not a WSL/Linux terminal if MongoDB is installed on Windows, because WSL cannot reach it).
If PowerShell says *"running scripts is disabled"*, type `npm.cmd` instead of `npm`.

### 2. ML service (terminal 1)

```bash
cd ml-service
python -m venv venv
venv\Scripts\activate            # Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
python train.py                  # optional: the trained model is already included
python app.py                    # http://localhost:5001
```

### 3. Backend (terminal 2)

```bash
cd server
npm install
copy .env.example .env           # Linux/Mac: cp .env.example .env
# edit .env: set JWT_SECRET (and MONGO_URI if it is not the local default)
npm run seed                     # demo doctors, patients, pharmacist and the medicine store
npm run dev                      # http://localhost:5000
```

`npm run seed` is safe to run again: it only adds or updates, it never deletes users, appointments or orders, and it keeps the stock you set.

### 4. Frontend (terminal 3)

```bash
cd client
npm install
npm run dev                      # open http://localhost:5173
```

### Demo accounts (created by `npm run seed`)

| Role       | Email                                                                   | Password        |
| ---------- | ----------------------------------------------------------------------- | --------------- |
| Patient    | `patient@mediconnect.com`, `ravi@mediconnect.com`, `sneha@mediconnect.com` | `patient123`    |
| Doctor     | `arun@mediconnect.com` (General Physician), `atkshaya@mediconnect.com` (Cardiologist), `priya@mediconnect.com` (Dermatologist), `divya@mediconnect.com` (Neurologist) | `doctor123`     |
| Pharmacist | `pharmacist@mediconnect.com`                                            | `pharmacist123` |

New accounts need a password of at least 8 characters and a 10-digit phone number (if a phone number is given).

## Environment variables (`server/.env`, see `server/.env.example`)

| Variable                              | Needed?  | Purpose                                                                 |
| ------------------------------------- | -------- | ----------------------------------------------------------------------- |
| `MONGO_URI`                           | required | MongoDB connection string                                               |
| `JWT_SECRET`                          | required | Secret used to sign login tokens (use a long random text)               |
| `PORT`                                | optional | API port (default 5000)                                                 |
| `ML_URL`                              | optional | Address of the ML service (default `http://localhost:5001`)             |
| `CLIENT_URL`                          | optional | Address of the website, used for CORS and the QR link                   |
| `NODE_ENV`                            | optional | `production` hides the demo routes and technical error messages         |
| `EMAIL_USER`, `EMAIL_PASS`            | optional | Gmail address and Gmail **App Password**. Without them emails are only printed in the server console |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | optional | Razorpay **test** keys. Without them checkout uses a labelled "Test payment" button |
| `GEMINI_API_KEY`, `GEMINI_MODEL`      | optional | Google Gemini key for the prescription scanner. Without it the scanner says it is not configured |

The frontend has one optional variable, `VITE_API_URL` (default `http://localhost:5000/api`), see `client/.env.example`.

**Gmail App Password:** Google Account → Security → turn on 2-Step Verification → App passwords → create one named
`MediConnect` → put the 16 characters (no spaces) in `EMAIL_PASS`. Restart the server. On start it prints
`[email] ON: Gmail login works` or the reason it does not.

## Security

- Passwords hashed with bcrypt, JWT login tokens, roles checked on the server for every protected route
- `helmet` security headers, login rate limit (10 wrong attempts per 15 minutes), rate limit on Health ID lookups
- Strict date/time format and database unique indexes against double booking
- Prescription-only medicines are checked on the server against the patient's prescriptions from a doctor
- A scanned photo is checked by its real file type and size, and the AI key is only ever used on the server
- In production the server never sends technical error text to the browser (it is logged on the server instead)

## Deploy on Render

`render.yaml` describes the three services: **mediconnect-api** (Node), **mediconnect-ml** (Python) and
**mediconnect-web** (static React build). Render's free plan is enough.

1. **Push the code to GitHub.**
2. **Create a free MongoDB Atlas database** (Render cannot reach a database on your own computer):
   Database Access → add a user with read/write rights · Network Access → allow `0.0.0.0/0` (Render has no fixed address) ·
   Connect → Drivers → copy the `mongodb+srv://...` string and add `/mediconnect` before the `?`.
3. **Fill the Atlas database once** from your computer (adds the demo accounts and the medicine store):
   ```powershell
   cd server
   $env:MONGO_URI = "mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/mediconnect?retryWrites=true&w=majority"
   npm run seed
   ```
4. **On Render:** New → **Blueprint** → choose this repository. Render reads `render.yaml` and asks for the values marked
   `sync: false`. Enter your Atlas string for `MONGO_URI` and your Gemini key for `GEMINI_API_KEY`. For `CLIENT_URL`, `ML_URL`
   and `VITE_API_URL` type any temporary text, because the real addresses do not exist yet.
5. **When the three services have deployed**, open each one and copy its address (`https://....onrender.com`). Render adds a
   suffix if a name is taken, so always use the address it shows. Then set:
   - API service → `CLIENT_URL` = the website address and `ML_URL` = the ML service address (no `/` at the end)
   - Website service → `VITE_API_URL` = the API address **plus `/api`**

   Each change redeploys that service automatically.
6. Open the website address and log in with a demo account.

Things to know about the free plan:
- A service that has not been used for about 15 minutes **goes to sleep**. The first request afterwards takes 30 to 60 seconds.
  Before a demo, open `https://<api address>/api/health` and `https://<ml address>/metrics` once to wake them up.
- Scheduled medicine reminders only run while the API is awake.
- Free services **cannot send e-mail through Gmail** (Render blocks the SMTP ports), so leave `EMAIL_USER` and `EMAIL_PASS` out.
  The app works without them and logs a warning. A paid instance, or an e-mail service that works over HTTPS, is needed for e-mail.
- Without Razorpay keys checkout uses the labelled "Test payment" button.

## API summary

| Method        | Route                                 | Who        | Purpose                                         |
| ------------- | ------------------------------------- | ---------- | ----------------------------------------------- |
| POST          | `/api/auth/register`                  | public     | Create a patient or doctor account              |
| POST          | `/api/auth/login`                     | public     | Login, returns a JWT                            |
| GET / PUT     | `/api/auth/me`                        | any        | Get / update my profile                         |
| GET           | `/api/doctors`                        | any        | List doctors                                    |
| GET           | `/api/appointments`                   | patient, doctor | My appointments                            |
| GET           | `/api/appointments/booked`            | any        | Times already taken for a doctor and date       |
| POST          | `/api/appointments`                   | patient    | Book (slot and patient-clash checks)            |
| PATCH         | `/api/appointments/:id`               | patient, doctor | Change status / doctor notes               |
| GET           | `/api/predictions/symptoms`           | any        | Symptom list (from the ML service)              |
| POST / GET    | `/api/predictions`                    | patient    | Run the model and save / list my history        |
| DELETE        | `/api/predictions/:id`                | patient    | Delete one history item                         |
| GET           | `/api/records/me`                     | patient    | My health card data                             |
| GET           | `/api/records/:healthId`              | doctor     | A patient's record by Health ID                 |
| GET / POST    | `/api/prescriptions`                  | any / doctor | List mine / write one                         |
| GET / PUT     | `/api/prescriptions/appointment/:id`, `/:id` | doctor, patient | Read / edit a prescription       |
| GET           | `/api/prescriptions/:id/pdf`          | patient, doctor | Download as PDF                            |
| POST          | `/api/scans`, `/api/scans/save`       | patient    | Read a prescription photo / save the reviewed list |
| GET           | `/api/medicines`, `/categories`       | any        | Store catalogue (search, category, case-insensitive sort) |
| POST          | `/api/medicines/match`                | patient    | Find prescription medicines in the store        |
| PATCH         | `/api/medicines/:id/stock`            | pharmacist | Set the stock of a medicine                     |
| POST          | `/api/orders/preview`, `/api/orders/pay`, `/api/orders` | patient | Check the cart, start the payment, place the order |
| GET           | `/api/orders/payment-config`          | patient    | Which payment button to show (test or Razorpay) |
| GET           | `/api/orders`                         | patient, pharmacist | My orders / all orders                 |
| POST          | `/api/orders/:id/advance`             | pharmacist | Move an order to its next status                |
| GET           | `/api/dev/...`                        | this computer only | Demo helpers (trigger reminders, preview e-mails). Off in production |

## Future work

- Docker and Docker Compose, CI/CD with GitHub Actions
- Cloud deployment (for example Vercel for the frontend, Render for the API and ML service, MongoDB Atlas)
- Automated tests and monitoring
- Approval of new doctor accounts by an administrator
