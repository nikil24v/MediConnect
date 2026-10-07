import mongoose from "mongoose";

const predictionSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    symptoms: [String],
    results: [{ disease: String, confidence: Number }],
    model: String,
  },
  { timestamps: true }
);

export default mongoose.model("Prediction", predictionSchema);
