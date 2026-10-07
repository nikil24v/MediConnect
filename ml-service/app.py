"""
MediConnect ML Service (Flask) - runs on port 5001

  GET  /symptoms  -> list of 132 symptoms
  GET  /metrics   -> model accuracy info
  POST /predict   -> {"symptoms": ["itching", "skin_rash"]}  ->  top 3 diseases

Run:  python app.py
"""
import json
import os
import warnings

warnings.filterwarnings("ignore")  # hide harmless library warnings

import joblib
import pandas as pd
from flask import Flask, jsonify, request

BASE = os.path.dirname(os.path.abspath(__file__))

# Load the trained model + its info ONCE when the server starts
model = joblib.load(os.path.join(BASE, "model", "disease_model.joblib"))
with open(os.path.join(BASE, "model", "metadata.json")) as f:
    info = json.load(f)
SYMPTOMS = info["symptoms"]

app = Flask(__name__)


@app.get("/symptoms")
def symptoms():
    # "skin_rash" -> "Skin rash" for display
    return jsonify([{"key": s, "label": s.replace("_", " ").strip().capitalize()} for s in SYMPTOMS])


@app.get("/metrics")
def metrics():
    return jsonify(model=info["model"], rows_used=info["rows_used"], metrics=info["metrics"])


@app.post("/predict")
def predict():
    chosen = (request.get_json(silent=True) or {}).get("symptoms", [])
    chosen = [s for s in chosen if s in SYMPTOMS]
    if len(chosen) < 2:
        return jsonify(error="Please select at least 2 valid symptoms."), 400

    # Build one row of 132 zeros, put 1 for each chosen symptom
    row = pd.DataFrame([[1 if s in chosen else 0 for s in SYMPTOMS]], columns=SYMPTOMS)

    # Probability for every disease, then take the top 3
    probs = model.predict_proba(row)[0]
    top3 = sorted(zip(model.classes_, probs), key=lambda p: p[1], reverse=True)[:3]

    return jsonify(
        symptoms=chosen,
        predictions=[{"disease": d, "confidence": round(p * 100, 1)} for d, p in top3 if p > 0],
        model=info["model"],
        disclaimer="This is not a medical diagnosis. Please consult a doctor.",
    )


if __name__ == "__main__":
    app.run(port=5001)
