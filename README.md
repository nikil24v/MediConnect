# MediConnect – AI-Powered Healthcare Platform

MediConnect is a MERN stack web app that connects **patients** and **doctors**.
It has a **Machine Learning symptom checker**: the patient selects symptoms and
the model predicts the top 3 possible diseases. It then suggests the right specialist,
and the patient can book that doctor directly.

## Architecture

| Folder        | What it is                                                 |
| ------------- | ---------------------------------------------------------- |
| `client/`     | React frontend (UI, pages, routing)                        |
| `server/`     | Express REST API, JWT auth, MongoDB models                 |
| `ml-service/` | Python: dataset, Random Forest training, Flask predict API |

## Features (Review 1)

**Patient:** register/login · AI symptom checker (132 symptoms → 41 diseases) ·
specialist suggestion · find & book doctors (date + time slot) · cancel appointments ·
health history of all AI checks · dashboard · profile

**Doctor:** dashboard (today's visits, pending requests) · accept / reject / complete
appointments · view patient's **AI pre-screening report** · add notes for the patient

## Machine Learning (ml-service)

- **Dataset:** Disease Prediction dataset (Kaggle) – 4,920 rows, 132 symptom columns (0/1), 41 diseases
- **Cleaning:** removed duplicate rows → **304 unique records**
- **Algorithm:** Random Forest (100 decision trees, majority vote)
- **Split:** 75% train / 25% test
- **Result:** Accuracy, Precision, Recall, F1 = 100% on test data (small, clean dataset)
- `train.py` trains and saves the model → `app.py` loads it and serves predictions

## How to run (Windows / Linux)

### 1. Requirements

- Node.js 18+
- Python 3.10+
- MongoDB: either local MongoDB Community Server, or a free MongoDB Atlas cluster

### 2. ML service (terminal 1)

```bash
cd ml-service
pip install -r requirements.txt
python train.py        # trains the model (already trained, re-run anytime)
python app.py          # runs on http://localhost:5001
```

### 3. Backend (terminal 2)

```bash
cd server
npm install
copy .env.example .env      # Linux/Mac: cp .env.example .env
# edit .env -> set MONGO_URI (local or Atlas) and a JWT_SECRET
npm run seed                # adds 9 demo doctors + 1 demo patient
npm run dev                 # http://localhost:5000
```

### 4. Frontend (terminal 3)

```bash
cd client
npm install
npm run dev                 # open http://localhost:5173
```

### Demo logins

| Role    | Email                   | Password   |
| ------- | ----------------------- | ---------- |
| Patient | patient@mediconnect.com | patient123 |
| Doctor  | arun@mediconnect.com    | doctor123  |

All 9 doctors log in with their first name, e.g. `priya@mediconnect.com`, password `doctor123`

## API summary

| Method  | Route                     | Who     | Purpose                 |
| ------- | ------------------------- | ------- | ----------------------- |
| POST    | /api/auth/register        | public  | Create account          |
| POST    | /api/auth/login           | public  | Login → JWT             |
| GET/PUT | /api/auth/me              | any     | Get / update profile    |
| GET     | /api/doctors              | any     | List doctors            |
| GET     | /api/appointments         | any     | My appointments         |
| POST    | /api/appointments         | patient | Book (slot clash check) |
| PATCH   | /api/appointments/:id     | both    | Status / doctor notes   |
| GET     | /api/predictions/symptoms | any     | Symptom list (from ML)  |
| POST    | /api/predictions          | patient | Run ML + save result    |
| GET     | /api/predictions          | patient | My AI history           |

## Future implementation (Review 2)

- **AI prescription scanner:** upload a prescription photo → Vision AI / OCR extracts medicines → patient confirms → saved
- **DevOps:** Docker + Docker Compose, CI/CD pipeline with GitHub Actions
- **Cloud deployment:** Vercel (frontend), Render (backend + ML), MongoDB Atlas
- **Monitoring:** health-check endpoints and logging

> ⚠️ AI predictions are for information only and are not a medical diagnosis.
