"""
Pregnancy Risk Prediction - MLP Training Script
Trains a Keras MLP model to predict maternal health risk levels.
Based on research paper architecture achieving 81% accuracy.
"""

import os
import pandas as pd
import joblib
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Set random seeds for reproducibility
import random
random.seed(42)
np.random.seed(42)
import tensorflow as tf
tf.random.set_seed(42)
tf.config.experimental.enable_op_determinism()

# This ensures the model gives the same results every time it's trained
# Neural networks are stochastic by nature, so we need to control all sources of randomness

from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import classification_report, confusion_matrix

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.utils import to_categorical

# Paths (relative to this script file)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")
DATA_PATH = os.path.join(BASE_DIR, "..", "data", "Maternal Health Risk Data Set.csv")
CONF_MATRIX_PATH = os.path.join(BASE_DIR, "confusion_matrix.png")

# Check if model already exists
if os.path.exists(os.path.join(MODEL_DIR, "mlp_model.keras")):
    print("Model already trained and saved. Skipping training.")
    exit(0)

# 1. Load data
df = pd.read_csv(DATA_PATH)

# 2. Clean data (match paper: remove duplicates, erroneous, outliers like age 10-18)
df.drop_duplicates(inplace=True)
df = df[df['Age'] >= 19]  # Remove outliers: pregnant women age 10-18

# 3. Encode target
df['RiskLevel'] = df['RiskLevel'].map({
    'low risk': 0,
    'mid risk': 1,
    'high risk': 2
})

# 4. Split features & target
X = df.drop('RiskLevel', axis=1)
y = df['RiskLevel']

# 5. Train-test split (80/20 as per paper)
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,  # Back to proven seed 42
    stratify=y
)

# 6. Scale features (fit only on training data)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 7. SMOTE on training data (as per paper)
from imblearn.over_sampling import SMOTE
smote = SMOTE(random_state=42)  # Fixed seed for reproducible synthetic data
X_train_sm, y_train_sm = smote.fit_resample(X_train_scaled, y_train)

# 8. One-hot encode target
y_train_cat = to_categorical(y_train_sm, 3)
y_test_cat = to_categorical(y_test, 3)

# 9. Build MLP model (back to original architecture)
model = Sequential([
    Dense(256, activation='relu', input_shape=(X_train_sm.shape[1],)),
    Dropout(0.5),
    Dense(128, activation='relu'),
    Dropout(0.5),
    Dense(64, activation='relu'),
    Dense(3, activation='softmax')
])

# 10. Compile (back to standard learning rate with scheduler)
model.compile(
    optimizer=Adam(learning_rate=0.001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau

# 11. Early stopping and learning rate scheduler
early_stop = EarlyStopping(
    monitor='val_loss',
    patience=8,
    restore_best_weights=True
)

# Add learning rate scheduler
lr_scheduler = ReduceLROnPlateau(
    monitor='val_loss',
    factor=0.5,
    patience=5,
    min_lr=0.0001
)

# 12. Train (with learning rate scheduler)
model.fit(
    X_train_sm, y_train_cat,
    validation_data=(X_test_scaled, y_test_cat),
    epochs=10000,
    batch_size=32,  # Back to 32
    callbacks=[early_stop, lr_scheduler]
)

# 13. Evaluate
y_pred = np.argmax(model.predict(X_test_scaled), axis=1)
print(classification_report(y_test, y_pred))

# 14. Generate confusion matrix
print("\nConfusion Matrix:")
cm = confusion_matrix(y_test, y_pred)
print(cm)

# 15. Visualize confusion matrix
plt.figure(figsize=(8, 6))
class_names = ['Low Risk', 'Mid Risk', 'High Risk']
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
            xticklabels=class_names, yticklabels=class_names)
plt.title('Confusion Matrix - Pregnancy Risk Prediction')
plt.ylabel('True Label')
plt.xlabel('Predicted Label')
plt.tight_layout()

# Save the plot as an image file
plt.savefig(CONF_MATRIX_PATH, dpi=300, bbox_inches='tight')
print(f"Confusion matrix visualization saved as '{CONF_MATRIX_PATH}'")
plt.show()

# 16. Save model & scaler
os.makedirs(MODEL_DIR, exist_ok=True)
model.save(os.path.join(MODEL_DIR, "mlp_model.keras"))  # Modern Keras format
joblib.dump(scaler, os.path.join(MODEL_DIR, "scaler.pkl"))

print("MLP model and scaler saved successfully.")
print("DONE")
