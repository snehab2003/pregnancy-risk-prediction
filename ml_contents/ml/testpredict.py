
"""
Pregnancy Risk Prediction - Interactive Prediction Tool
Uses trained Keras MLP model to predict maternal health risk level.
"""

import pandas as pd
import numpy as np
from model_loader import model, scaler

labels = {
    0: "LOW RISK",
    1: "MEDIUM RISK",
    2: "HIGH RISK"
}

def get_valid_input(prompt, min_val=None, max_val=None):
    """Get validated numeric input from user."""
    while True:
        try:
            value = float(input(prompt))
            if min_val is not None and value < min_val:
                print(f"Value must be >= {min_val}")
                continue
            if max_val is not None and value > max_val:
                print(f"Value must be <= {max_val}")
                continue
            return value
        except ValueError:
            print("Please enter a valid number.")

print("🩺 Pregnancy Risk Prediction Tool")
print("=" * 40)

# Get validated inputs
age = get_valid_input("Age (years): ", min_val=19, max_val=100)
systolic = get_valid_input("Systolic BP (mmHg): ", min_val=50, max_val=200)
diastolic = get_valid_input("Diastolic BP (mmHg): ", min_val=30, max_val=130)
blood_sugar = get_valid_input("Blood Sugar (mmol/L): ", min_val=0, max_val=20)
temperature = get_valid_input("Body Temperature (°F): ", min_val=95, max_val=105)
heart_rate = get_valid_input("Heart Rate (bpm): ", min_val=40, max_val=150)

data = pd.DataFrame({
    "Age": [age],
    "SystolicBP": [systolic],
    "DiastolicBP": [diastolic],
    "BS": [blood_sugar],
    "BodyTemp": [temperature],
    "HeartRate": [heart_rate]
})

data_scaled = scaler.transform(data)

probabilities = model.predict(data_scaled)[0]
risk_class = np.argmax(probabilities)

print("\nPrediction Probabilities:")
for i, prob in enumerate(probabilities):
    print(f"  {labels[i]}: {prob:.4f}")

print(f"\nPredicted Risk Level: {labels[risk_class]}")