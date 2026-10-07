// Which specialist to suggest for each predicted disease
const SPECIALIST = {
  "Fungal infection": "Dermatologist", Acne: "Dermatologist", Psoriasis: "Dermatologist", Impetigo: "Dermatologist",
  "Chicken pox": "Dermatologist", "Drug Reaction": "Dermatologist", Allergy: "General Physician",
  GERD: "Gastroenterologist", "Peptic Ulcer Disease": "Gastroenterologist", Gastroenteritis: "Gastroenterologist",
  "Chronic cholestasis": "Gastroenterologist", Jaundice: "Gastroenterologist", "Alcoholic hepatitis": "Gastroenterologist",
  "Hepatitis A": "Gastroenterologist", "Hepatitis B": "Gastroenterologist", "Hepatitis C": "Gastroenterologist",
  "Hepatitis D": "Gastroenterologist", "Hepatitis E": "Gastroenterologist", "Hemorrhoids (Piles)": "Gastroenterologist",
  "Heart attack": "Cardiologist", Hypertension: "Cardiologist", "Varicose veins": "Cardiologist",
  Migraine: "Neurologist", "Paralysis (Brain Hemorrhage)": "Neurologist", "Vertigo (BPPV)": "Neurologist",
  "Cervical spondylosis": "Neurologist",
  Diabetes: "Endocrinologist", Hypothyroidism: "Endocrinologist", Hyperthyroidism: "Endocrinologist",
  Hypoglycemia: "Endocrinologist",
  Arthritis: "Orthopedic", Osteoarthritis: "Orthopedic",
  "Urinary tract infection": "Urologist",
  "Bronchial Asthma": "Pulmonologist", Pneumonia: "Pulmonologist", Tuberculosis: "Pulmonologist",
};
export const specialistFor = (disease) => SPECIALIST[disease] || "General Physician";

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const fmtTime = (t) => {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

export const initials = (name = "") =>
  name.replace(/^Dr\.?\s*/i, "").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

export const TIME_SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];

export const today = () => new Date().toISOString().slice(0, 10);
