"""
Pregnancy Risk Prediction - Cross-Validation Analysis
Performs 5-fold cross-validation with Keras MLP model.
Evaluates model stability and generalization performance.
"""

from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.optimizers import Adam
from imblearn.over_sampling import SMOTE
import pandas as pd
import numpy as np

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

# Scaling
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Cross-validation setup
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
accuracies = []

def create_model():
    # Match exact architecture from training script
    model = Sequential([
        Dense(256, activation='relu', input_shape=(X_scaled.shape[1],)),
        Dropout(0.5),
        Dense(128, activation='relu'),
        Dropout(0.5),
        Dense(64, activation='relu'),
        Dense(3, activation='softmax')
    ])
    model.compile(optimizer=Adam(learning_rate=0.001),
                  loss='categorical_crossentropy',  # Match training script
                  metrics=['accuracy'])
    return model

print("Performing 5-fold cross-validation with Keras MLP...")

for fold, (train_idx, val_idx) in enumerate(skf.split(X_scaled, y)):
    X_train_fold, X_val_fold = X_scaled[train_idx], X_scaled[val_idx]
    y_train_fold, y_val_fold = y.iloc[train_idx], y.iloc[val_idx]

    # Apply SMOTE to training fold (match training script)
    smote = SMOTE(random_state=42)
    X_train_smote, y_train_smote = smote.fit_resample(X_train_fold, y_train_fold)

    # One-hot encode targets (match training script)
    from tensorflow.keras.utils import to_categorical
    y_train_cat = to_categorical(y_train_smote, 3)
    y_val_cat = to_categorical(y_val_fold, 3)

    # Create and train model
    model = create_model()
    model.fit(X_train_smote, y_train_cat,
              validation_data=(X_val_fold, y_val_cat),
              epochs=100, batch_size=32, verbose=0)

    # Evaluate
    y_pred_prob = model.predict(X_val_fold)
    y_pred = np.argmax(y_pred_prob, axis=1)
    acc = accuracy_score(y_val_fold, y_pred)
    accuracies.append(acc)
    print(f"Fold {fold+1}: Accuracy = {acc:.4f}")

print(f"\nCross-validation results:")
print(f"Mean Accuracy: {np.mean(accuracies):.4f} ± {np.std(accuracies):.4f}")
print(f"Individual fold accuracies: {accuracies}")