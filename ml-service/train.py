"""
MediConnect - Train the Disease Prediction Model (Random Forest)

What this file does:
  1. Load the dataset   (132 symptom columns of 0/1  +  1 disease column)
  2. Clean it           (drop empty column, fix names, remove duplicate rows)
  3. Split it           (75% to train, 25% to test)
  4. Train              Random Forest
  5. Test               check accuracy on the test part
  6. Save               the model + info, so app.py can use it

Run:  python train.py
"""
import json
import os
import warnings

warnings.filterwarnings("ignore")  # hide harmless library warnings

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split

BASE = os.path.dirname(os.path.abspath(__file__))

# ---------- 1. Load ----------
df = pd.read_csv(os.path.join(BASE, "data", "Training.csv"))

# ---------- 2. Clean ----------
df = df.loc[:, ~df.columns.str.startswith("Unnamed")]          # remove empty last column
df.columns = [c.strip().replace(" ", "") for c in df.columns]   # tidy symptom names
df["prognosis"] = df["prognosis"].str.strip().replace({          # fix spelling mistakes
    "(vertigo) Paroymsal  Positional Vertigo": "Vertigo (BPPV)",
    "Dimorphic hemmorhoids(piles)": "Hemorrhoids (Piles)",
    "Osteoarthristis": "Osteoarthritis",
    "Peptic ulcer diseae": "Peptic Ulcer Disease",
    "hepatitis A": "Hepatitis A",
    "Paralysis (brain hemorrhage)": "Paralysis (Brain Hemorrhage)",
})
print("Rows before cleaning:", len(df))
df = df.drop_duplicates()                                        # remove copied rows
print("Rows after removing duplicates:", len(df))

X = df.drop(columns=["prognosis"])   # inputs  = 132 symptoms (0/1)
y = df["prognosis"]                  # output  = disease name

# ---------- 3. Split ----------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, stratify=y, random_state=42
)

# ---------- 4. Train ----------
model = RandomForestClassifier(n_estimators=100, random_state=42)  # 100 decision trees
model.fit(X_train, y_train)

# ---------- 5. Test ----------
pred = model.predict(X_test)
metrics = {
    "accuracy": round(accuracy_score(y_test, pred) * 100, 2),
    "precision": round(precision_score(y_test, pred, average="macro", zero_division=0) * 100, 2),
    "recall": round(recall_score(y_test, pred, average="macro", zero_division=0) * 100, 2),
    "f1": round(f1_score(y_test, pred, average="macro", zero_division=0) * 100, 2),
}
print("Results (%):", metrics)

# ---------- 6. Save ----------
model.fit(X, y)  # retrain on ALL data before saving
os.makedirs(os.path.join(BASE, "model"), exist_ok=True)
joblib.dump(model, os.path.join(BASE, "model", "disease_model.joblib"))

info = {
    "model": "Random Forest",
    "symptoms": list(X.columns),
    "diseases": sorted(y.unique().tolist()),
    "rows_used": len(df),
    "metrics": metrics,
}
with open(os.path.join(BASE, "model", "metadata.json"), "w") as f:
    json.dump(info, f, indent=2)

print("Model saved -> model/disease_model.joblib")
