import pandas as pd
import joblib
import numpy as np

from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from imblearn.over_sampling import SMOTE
from sklearn.metrics import classification_report

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.utils import to_categorical

# 1. Load data
df = pd.read_csv("../data/Maternal Health Risk Data Set.csv")

# 2. Clean data
df.drop_duplicates(inplace=True)
df = df[df['Age'] > 18]

# 3. Encode target
df['RiskLevel'] = df['RiskLevel'].map({
    'low risk': 0,
    'mid risk': 1,
    'high risk': 2
})

# 4. Split features & target
X = df.drop('RiskLevel', axis=1)
y = df['RiskLevel']

# 5. Scale features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 6. Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# 7. SMOTE
smote = SMOTE(random_state=42)
X_train_sm, y_train_sm = smote.fit_resample(X_train, y_train)

# 8. One-hot encode target
y_train_cat = to_categorical(y_train_sm, 3)
y_test_cat = to_categorical(y_test, 3)

# 9. Build MLP model
model = Sequential([
    Dense(256, activation='relu', input_shape=(X_train_sm.shape[1],)),
    Dropout(0.5),
    Dense(128, activation='relu'),
    Dropout(0.5),
    Dense(64, activation='relu'),
    Dense(3, activation='softmax')
])

# 10. Compile
model.compile(
    optimizer=Adam(learning_rate=0.001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# 11. Early stopping
early_stop = EarlyStopping(
    monitor='val_loss',
    patience=30,
    restore_best_weights=True
)

# 12. Train
model.fit(
    X_train_sm, y_train_cat,
    validation_data=(X_test, y_test_cat),
    epochs=300,
    batch_size=32,
    callbacks=[early_stop]
)

# 13. Evaluate
y_pred = np.argmax(model.predict(X_test), axis=1)
print(classification_report(y_test, y_pred))
from sklearn.metrics import confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

# Confusion matrix
cm = confusion_matrix(y_test, y_pred)

# Plot
sns.heatmap(
    cm,
    annot=True,
    fmt='d',
    cmap='Blues',
    xticklabels=["Low Risk", "Medium Risk", "High Risk"],
    yticklabels=["Low Risk", "Medium Risk", "High Risk"]
)

plt.xlabel("Predicted Label")
plt.ylabel("True Label")
plt.title("Confusion Matrix for Pregnancy Risk Prediction")
plt.show()


# 14. Save model & scaler
model.save("models/mlp_model.h5")
joblib.dump(scaler, "models/scaler.pkl")

print("MLP model and scaler saved successfully.")
