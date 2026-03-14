"""
Pregnancy Risk Prediction - Model Loader
Loads the trained Keras MLP model and StandardScaler for predictions.
"""

import os
import joblib
from tensorflow.keras.models import load_model

# Get current folder path (ml/)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Model paths (Keras .keras format, scaler .pkl)
MODEL_PATH = os.path.join(BASE_DIR, "models", "mlp_model.keras")
SCALER_PATH = os.path.join(BASE_DIR, "models", "scaler.pkl")

# Load model and scaler ONCE
model = load_model(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)

label_map = {
    0: "LOW RISK",
    1: "MEDIUM RISK",
    2: "HIGH RISK"
}
