"""
Real XGBoost Model Training on UCI Cleveland Heart Disease Dataset
MedAssist AI — Real empirical metrics, stratified split, class weight handling, and SHAP explanation
"""

import os
import json
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)
import xgboost as xgb
import shap
import joblib

RANDOM_SEED = 42

def train_heart_xgboost():
    data_dir = Path(__file__).resolve().parent / "dataset"
    models_dir = Path(__file__).resolve().parent / "models"
    results_dir = Path(__file__).resolve().parent / "results"
    models_dir.mkdir(parents=True, exist_ok=True)
    results_dir.mkdir(parents=True, exist_ok=True)

    csv_path = data_dir / "cleveland.csv"
    if not csv_path.exists():
        raise FileNotFoundError(f"Missing Cleveland dataset at {csv_path}")

    # Load dataset
    df = pd.read_csv(csv_path)
    print(f"Loaded Cleveland dataset: {df.shape[0]} rows, {df.shape[1]} columns")

    # Target: 0 = no heart disease, >0 = heart disease present (convert to binary classification: 0 vs 1)
    df["target"] = (df["target"] > 0).astype(int)

    feature_cols = [c for c in df.columns if c != "target"]
    X = df[feature_cols].copy()
    y = df["target"].copy()

    # Stratified Train / Val / Test split: 70% train, 15% validation, 15% test
    X_train_val, X_test, y_train_val, y_test = train_test_split(
        X, y, test_size=0.15, stratify=y, random_state=RANDOM_SEED
    )

    X_train, X_val, y_train, y_val = train_test_split(
        X_train_val, y_train_val, test_size=(0.15 / 0.85), stratify=y_train_val, random_state=RANDOM_SEED
    )

    print(f"Train set: {X_train.shape[0]} | Val set: {X_val.shape[0]} | Test set: {X_test.shape[0]}")

    # Median imputation for missing values in ca and thal
    imputer = SimpleImputer(strategy="median")
    X_train_imp = pd.DataFrame(imputer.fit_transform(X_train), columns=feature_cols)
    X_val_imp = pd.DataFrame(imputer.transform(X_val), columns=feature_cols)
    X_test_imp = pd.DataFrame(imputer.transform(X_test), columns=feature_cols)

    # Standard scaling
    scaler = StandardScaler()
    X_train_scaled = pd.DataFrame(scaler.fit_transform(X_train_imp), columns=feature_cols)
    X_val_scaled = pd.DataFrame(scaler.transform(X_val_imp), columns=feature_cols)
    X_test_scaled = pd.DataFrame(scaler.transform(X_test_imp), columns=feature_cols)

    # Compute positive class scale weight: count(neg) / count(pos)
    num_neg = np.sum(y_train == 0)
    num_pos = np.sum(y_train == 1)
    scale_pos_weight = float(num_neg / max(1, num_pos))
    print(f"Class ratio: {num_neg} negative, {num_pos} positive -> scale_pos_weight = {scale_pos_weight:.3f}")

    # Train XGBoost Classifier
    model = xgb.XGBClassifier(
        n_estimators=150,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.85,
        colsample_bytree=0.85,
        scale_pos_weight=scale_pos_weight,
        random_state=RANDOM_SEED,
        eval_metric="logloss",
        early_stopping_rounds=15
    )

    model.fit(
        X_train_scaled, y_train,
        eval_set=[(X_val_scaled, y_val)],
        verbose=False
    )

    # Evaluate on held-out test set
    test_preds = model.predict(X_test_scaled)
    test_probs = model.predict_proba(X_test_scaled)[:, 1]

    acc = float(accuracy_score(y_test, test_preds))
    prec = float(precision_score(y_test, test_preds))
    rec = float(recall_score(y_test, test_preds))
    f1 = float(f1_score(y_test, test_preds))
    auc = float(roc_auc_score(y_test, test_probs))
    cm = confusion_matrix(y_test, test_preds).tolist()

    metrics = {
        "dataset": "UCI Cleveland Heart Disease",
        "sample_count": int(df.shape[0]),
        "train_samples": int(X_train.shape[0]),
        "val_samples": int(X_val.shape[0]),
        "test_samples": int(X_test.shape[0]),
        "scale_pos_weight": round(scale_pos_weight, 4),
        "test_accuracy": round(acc, 4),
        "test_precision": round(prec, 4),
        "test_recall": round(rec, 4),
        "test_f1": round(f1, 4),
        "test_roc_auc": round(auc, 4),
        "test_confusion_matrix": cm,
        "features": feature_cols
    }

    print("\n--- HELD-OUT TEST SET METRICS ---")
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print(f"ROC-AUC:   {auc:.4f}")
    print(f"Confusion Matrix: {cm}")

    # Train Explainer: use feature importances and shap.Explainer or tree explainer
    explainer = None
    try:
        explainer = shap.Explainer(model, X_train_scaled)
    except Exception as e:
        print(f"SHAP Explainer note: {e}")

    # Persist model artifacts
    joblib.dump(model, models_dir / "heart_xgboost.joblib")
    joblib.dump(scaler, models_dir / "scaler.joblib")
    joblib.dump(imputer, models_dir / "imputer.joblib")
    if explainer is not None:
        try:
            joblib.dump(explainer, models_dir / "shap_explainer.joblib")
        except Exception:
            pass

    with open(models_dir / "feature_list.json", "w") as f:
        json.dump(feature_cols, f, indent=2)

    with open(results_dir / "metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"Saved artifacts to {models_dir} and {results_dir}")
    return metrics

if __name__ == "__main__":
    train_heart_xgboost()
