"""
MediConnect ML Service (Flask) - runs on port 5001

  GET  /symptoms  -> list of symptoms (132 columns in the dataset, one duplicate hidden)
  GET  /metrics   -> model accuracy info
  POST /predict   -> {"symptoms": ["itching", "skin_rash"]}  ->  top 3 diseases

Run on your computer:  python app.py
Run in production:    gunicorn app:app --bind 0.0.0.0:$PORT
"""
import json
import os
import re
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
SYMPTOMS = info["symptoms"]  # the exact columns the model was trained on (do not change this list)

# The dataset has the column "fluid_overload" twice. pandas renamed the second one "fluid_overload.1".
# The first copy is empty (all zeros) and the second holds the real data. The model needs both columns,
# but people should see one "Fluid overload": show the real column, hide the empty one.
DUPLICATE = re.compile(r"\.\d+$")  # a trailing ".1", ".2" ...
EMPTY_COPIES = {DUPLICATE.sub("", s) for s in SYMPTOMS if DUPLICATE.search(s)}  # {"fluid_overload"}
SHOWN = [s for s in SYMPTOMS if s not in EMPTY_COPIES]
ALIAS = {DUPLICATE.sub("", s): s for s in SYMPTOMS if DUPLICATE.search(s)}  # "fluid_overload" -> "fluid_overload.1"


def label(key):
    # "skin_rash" -> "Skin rash", "fluid_overload.1" -> "Fluid overload"
    return DUPLICATE.sub("", key).replace("_", " ").strip().capitalize()

app = Flask(__name__)


@app.get("/symptoms")
def symptoms():
    return jsonify([{"key": s, "label": label(s)} for s in SHOWN])


@app.get("/metrics")
def metrics():
    return jsonify(model=info["model"], rows_used=info["rows_used"], metrics=info["metrics"])


@app.post("/predict")
def predict():
    chosen = (request.get_json(silent=True) or {}).get("symptoms", [])
    chosen = [ALIAS.get(s, s) for s in chosen if isinstance(s, str)]  # the hidden name still means the real column
    chosen = list(dict.fromkeys(s for s in chosen if s in SYMPTOMS))  # valid ones only, no repeats
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
    app.run(port=int(os.environ.get("PORT", 5001)))  # the hosting service tells us the port through PORT
