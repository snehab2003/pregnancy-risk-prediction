#!/usr/bin/env python
"""
Standalone ML prediction service for pregnancy risk assessment
This script can be called from Django without importing TensorFlow in the main process
"""
import sys
import os
import json

# Add the ml_contents path
ml_path = os.path.join(os.path.dirname(__file__), 'ml_contents')
sys.path.insert(0, ml_path)

def predict_risk(age, systolic_bp, diastolic_bp, blood_sugar, body_temp, heart_rate):
    """Make a risk prediction using the trained model"""
    try:
        from ml.model_loader import model, scaler
        import pandas as pd
        import numpy as np

        # Convert body temperature from Celsius to Fahrenheit (model expects Fahrenheit)
        body_temp_f = (body_temp * 9/5) + 32

        # Create input data
        data = pd.DataFrame({
            "Age": [float(age)],
            "SystolicBP": [float(systolic_bp)],
            "DiastolicBP": [float(diastolic_bp)],
            "BS": [float(blood_sugar)],
            "BodyTemp": [float(body_temp_f)],
            "HeartRate": [float(heart_rate)]
        })

        # Scale the data
        data_scaled = scaler.transform(data)

        # Make prediction
        probabilities = model.predict(data_scaled)[0]
        risk_class = np.argmax(probabilities)

        # Map to labels
        labels = {0: "LOW RISK", 1: "MEDIUM RISK", 2: "HIGH RISK"}

        result = {
            "risk_level": labels[risk_class],
            "probabilities": {
                "low_risk": float(probabilities[0]),
                "medium_risk": float(probabilities[1]),
                "high_risk": float(probabilities[2])
            },
            "risk_class": int(risk_class)
        }

        return result

    except ImportError as e:
        # Fallback: simple rule-based prediction if TensorFlow fails
        print(f"TensorFlow not available ({e}), using rule-based fallback", file=sys.stderr)

        age = float(age)
        systolic_bp = float(systolic_bp)
        diastolic_bp = float(diastolic_bp)
        blood_sugar = float(blood_sugar)
        body_temp = float(body_temp)
        heart_rate = float(heart_rate)

        # Simple risk scoring based on medical thresholds
        risk_score = 0

        # Age factor
        if age > 35:
            risk_score += 0.2
        elif age < 20:
            risk_score += 0.1

        # Blood pressure
        if systolic_bp > 140 or diastolic_bp > 90:
            risk_score += 0.4
        elif systolic_bp > 120 or diastolic_bp > 80:
            risk_score += 0.2

        # Blood sugar
        if blood_sugar > 140:
            risk_score += 0.3
        elif blood_sugar > 100:
            risk_score += 0.1

        # Body temperature
        if body_temp > 38:
            risk_score += 0.2
        elif body_temp < 36:
            risk_score += 0.1

        # Heart rate
        if heart_rate > 100:
            risk_score += 0.2
        elif heart_rate < 60:
            risk_score += 0.1

        # Determine risk level
        if risk_score > 0.7:
            risk_level = "HIGH RISK"
            risk_class = 2
            probabilities = {"low_risk": 0.1, "medium_risk": 0.2, "high_risk": 0.7}
        elif risk_score > 0.3:
            risk_level = "MEDIUM RISK"
            risk_class = 1
            probabilities = {"low_risk": 0.3, "medium_risk": 0.5, "high_risk": 0.2}
        else:
            risk_level = "LOW RISK"
            risk_class = 0
            probabilities = {"low_risk": 0.7, "medium_risk": 0.2, "high_risk": 0.1}

        return {
            "risk_level": risk_level,
            "probabilities": probabilities,
            "risk_class": risk_class,
            "fallback": True  # Indicate this is rule-based, not ML
        }

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    # Read input from command line arguments
    if len(sys.argv) != 7:
        print(json.dumps({"error": "Invalid number of arguments. Expected: age systolic_bp diastolic_bp blood_sugar body_temp heart_rate"}))
        sys.exit(1)

    try:
        age = sys.argv[1]
        systolic_bp = sys.argv[2]
        diastolic_bp = sys.argv[3]
        blood_sugar = sys.argv[4]
        body_temp = sys.argv[5]
        heart_rate = sys.argv[6]

        result = predict_risk(age, systolic_bp, diastolic_bp, blood_sugar, body_temp, heart_rate)
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))