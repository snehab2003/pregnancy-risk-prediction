"""
Pregnancy Risk Prediction - ROC Curve Analysis
Generates ROC curves and AUC scores for multi-class classification.
Visualizes model performance across different risk thresholds.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import label_binarize
from sklearn.metrics import roc_curve, auc

from model_loader import model, scaler


# Load dataset
df = pd.read_csv("../data/Maternal Health Risk Data Set.csv")

df.drop_duplicates(inplace=True)
df = df[df['Age'] >= 19]  # Match training script: remove outliers age 10-18

df['RiskLevel'] = df['RiskLevel'].map({
    'low risk': 0,
    'mid risk': 1,
    'high risk': 2
})

X = df.drop('RiskLevel', axis=1)
y = df['RiskLevel']


# Scale features
X_scaled = scaler.transform(X)


# Train-test split (match training script: 80/20, stratify)
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)


# Binarize labels
y_test_bin = label_binarize(y_test, classes=[0, 1, 2])


# Predict probabilities (Keras returns probabilities directly)
y_pred_prob = model.predict(X_test)


# Compute ROC
fpr = dict()
tpr = dict()
roc_auc = dict()

for i in range(3):
    fpr[i], tpr[i], _ = roc_curve(y_test_bin[:, i], y_pred_prob[:, i])
    roc_auc[i] = auc(fpr[i], tpr[i])


# Plot ROC
plt.figure()

class_names = ["Low Risk", "Medium Risk", "High Risk"]
for i in range(3):
    plt.plot(fpr[i], tpr[i], label=f"{class_names[i]} (AUC = {roc_auc[i]:.2f})")

plt.plot([0, 1], [0, 1], 'k--')

plt.xlabel("False Positive Rate")
plt.ylabel("True Positive Rate")
plt.title("ROC Curve for Pregnancy Risk Prediction")

plt.legend()
plt.show()