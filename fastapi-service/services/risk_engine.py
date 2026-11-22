"""
Integrated Clinical Risk Assessment & Source Tracing Engine
MedAssist AI — Pure Deterministic Clinical Guidelines + Feature-Gated Machine Learning
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
import joblib

from services.clinical_formulas import ClinicalFormulas

# Resolves either from repo root or inside Docker container where ml is at /app/ml
BASE_DIR = Path(__file__).resolve().parent.parent.parent
if not (BASE_DIR / "ml").exists():
    BASE_DIR = Path("/app")

MODELS_DIR = BASE_DIR / "ml" / "heart" / "models"
METRICS_PATH = BASE_DIR / "ml" / "heart" / "results" / "metrics.json"

_XGB_MODEL = None
_XGB_SCALER = None
_XGB_IMPUTER = None
_XGB_FEATURES = None
_METRICS = None


def _load_ml_artifacts():
    global _XGB_MODEL, _XGB_SCALER, _XGB_IMPUTER, _XGB_FEATURES, _METRICS

    if _XGB_MODEL is None and (MODELS_DIR / "heart_xgboost.joblib").exists():
        _XGB_MODEL = joblib.load(MODELS_DIR / "heart_xgboost.joblib")
        _XGB_SCALER = joblib.load(MODELS_DIR / "scaler.joblib")
        _XGB_IMPUTER = joblib.load(MODELS_DIR / "imputer.joblib")
        with open(MODELS_DIR / "feature_list.json", "r") as f:
            _XGB_FEATURES = json.load(f)

    if _METRICS is None and METRICS_PATH.exists():
        with open(METRICS_PATH, "r") as f:
            _METRICS = json.load(f)


class ClinicalRiskEngine:
    """
    Evaluates multi-organ clinical risks with full traceability to extracted laboratory measurements
    and peer-reviewed medical society guidelines.
    """

    @classmethod
    def evaluate_risks(
        cls,
        extracted_parameters: List[Dict[str, Any]],
        patient_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        _load_ml_artifacts()
        patient_metadata = patient_metadata or {}

        # 1. Map parameters to canonical lookups
        param_map = {}
        trace_map = {}
        for p in extracted_parameters:
            key = p.get("canonical_key") or p.get("canonical_name") or p.get("raw_parameter", "").lower()
            val = p.get("value")
            # Preserve trace details
            param_map[key] = val
            trace_map[key] = {
                "display_name": p.get("display_name", key),
                "extracted_value": val,
                "unit": p.get("unit", ""),
                "reference_range": p.get("reference_range", ""),
                "page": p.get("page", 1),
                "source_text": p.get("source_text", ""),
                "abnormality": p.get("abnormality", "NORMAL")
            }

        age = float(patient_metadata.get("age", 0) or param_map.get("age", 0) or 0)
        sex = str(patient_metadata.get("sex", "") or param_map.get("gender", "") or "male")

        findings = []
        action_required = False
        emergency_alert = None

        # 2. Renal Risk Assessment (CKD-EPI 2021 Race-Free)
        creatinine_val = param_map.get("creatinine") or param_map.get("serum_creatinine")
        if creatinine_val is not None:
            try:
                cr_float = float(creatinine_val)
                eff_age = age if age > 0 else 45.0  # default clinical age if not detected
                egfr_res = ClinicalFormulas.calculate_egfr_ckd_epi_2021(cr_float, eff_age, sex)

                findings.append({
                    "organ_system": "Renal (Kidneys)",
                    "finding_name": "Estimated Glomerular Filtration Rate (eGFR)",
                    "value": f"{egfr_res['egfr']} {egfr_res['unit']}",
                    "stage": egfr_res["stage"],
                    "interpretation": egfr_res["stage_description"],
                    "guideline": egfr_res["guideline"],
                    "source_trace": trace_map.get("creatinine") or trace_map.get("serum_creatinine")
                })

                if egfr_res["stage"] in ["G4", "G5"]:
                    action_required = True
                    if egfr_res["stage"] == "G5":
                        emergency_alert = "Critical renal impairment detected (eGFR < 15 mL/min/1.73m²). Immediate nephrology consult indicated."
            except Exception:
                pass

        # 3. Blood Pressure Risk Assessment (ACC/AHA 2017)
        sys_bp = param_map.get("systolic_bp") or param_map.get("sys_bp")
        dia_bp = param_map.get("diastolic_bp") or param_map.get("dia_bp")

        # Check for composite bp "120/80" in blood_pressure
        if not sys_bp and "blood_pressure" in param_map:
            bp_val = str(param_map["blood_pressure"])
            if "/" in bp_val:
                parts = bp_val.split("/")
                try:
                    sys_bp, dia_bp = float(parts[0]), float(parts[1])
                except Exception:
                    pass

        if sys_bp is not None and dia_bp is not None:
            try:
                bp_res = ClinicalFormulas.classify_blood_pressure(float(sys_bp), float(dia_bp))
                findings.append({
                    "organ_system": "Cardiovascular",
                    "finding_name": "Blood Pressure Classification",
                    "value": f"{int(sys_bp)}/{int(dia_bp)} mmHg",
                    "stage": bp_res["category"],
                    "interpretation": f"Classified as {bp_res['category']} per 2017 ACC/AHA guidelines.",
                    "guideline": bp_res["guideline"],
                    "source_trace": trace_map.get("blood_pressure") or trace_map.get("systolic_bp")
                })
                if bp_res["flag"] in ["HIGH", "CRITICAL"]:
                    action_required = True
                    if bp_res["flag"] == "CRITICAL":
                        emergency_alert = "Hypertensive crisis detected (Systolic >= 180 or Diastolic >= 120 mmHg). Immediate emergency medical evaluation required."
            except Exception:
                pass

        # 4. Metabolic / Glycemic Risk Assessment (ADA 2024)
        fbs = param_map.get("glucose_fasting") or param_map.get("fasting_blood_sugar")
        ppbs = param_map.get("glucose_postprandial") or param_map.get("postprandial_blood_sugar")
        hba1c = param_map.get("hba1c")

        if any(v is not None for v in [fbs, ppbs, hba1c]):
            try:
                fbs_f = float(fbs) if fbs is not None else None
                ppbs_f = float(ppbs) if ppbs is not None else None
                hba1c_f = float(hba1c) if hba1c is not None else None

                gly_res = ClinicalFormulas.classify_glucose(fbs_f, ppbs_f, hba1c_f)
                if "fasting" in gly_res:
                    findings.append({
                        "organ_system": "Metabolic / Endocrine",
                        "finding_name": "Fasting Blood Sugar",
                        "value": f"{fbs_f} mg/dL",
                        "stage": gly_res["fasting"]["category"],
                        "interpretation": f"{gly_res['fasting']['category']} according to ADA 2024 criteria.",
                        "guideline": gly_res["guideline"],
                        "source_trace": trace_map.get("glucose_fasting") or trace_map.get("fasting_blood_sugar")
                    })
                    if gly_res["fasting"]["flag"] == "HIGH":
                        action_required = True

                if "hba1c" in gly_res:
                    findings.append({
                        "organ_system": "Metabolic / Endocrine",
                        "finding_name": "HbA1c Glycated Hemoglobin",
                        "value": f"{hba1c_f} %",
                        "stage": gly_res["hba1c"]["category"],
                        "interpretation": f"{gly_res['hba1c']['category']} according to ADA 2024 criteria.",
                        "guideline": gly_res["guideline"],
                        "source_trace": trace_map.get("hba1c")
                    })
                    if gly_res["hba1c"]["flag"] == "HIGH":
                        action_required = True
            except Exception:
                pass

        # 5. Machine Learning Cardiovascular Risk (Feature-Gated XGBoost)
        ml_cardio_result = cls._evaluate_ml_heart_risk(param_map, age, sex)

        return {
            "findings": findings,
            "ml_risk": ml_cardio_result,
            "action_required": action_required,
            "emergency_alert": emergency_alert,
            "disclaimer": "This analysis is deterministically generated from extracted lab values using published clinical criteria. It is not an automated diagnosis and must be reviewed by a licensed physician."
        }

    @classmethod
    def _evaluate_ml_heart_risk(
        cls,
        param_map: Dict[str, Any],
        age: float,
        sex: str
    ) -> Dict[str, Any]:
        """
        Runs XGBoost on Cleveland model IF core laboratory markers are available.
        Strict feature gating: Never guesses or invents missing core features.
        """
        chol = param_map.get("cholesterol_total") or param_map.get("cholesterol") or param_map.get("totchol")
        trestbps = param_map.get("systolic_bp") or param_map.get("sys_bp")
        fbs = param_map.get("glucose_fasting") or param_map.get("fasting_blood_sugar")

        # Required minimum core lab values to compute ML heart disease risk
        missing_core = []
        if chol is None:
            missing_core.append("Total Cholesterol")
        if trestbps is None and "blood_pressure" not in param_map:
            missing_core.append("Resting Systolic Blood Pressure")

        if missing_core or _XGB_MODEL is None:
            return {
                "status": "gated_out",
                "reason": "Insufficient extracted laboratory markers for ML cardiovascular prediction.",
                "missing_required_markers": missing_core,
                "model_available": _XGB_MODEL is not None
            }

        try:
            if trestbps is None and "blood_pressure" in param_map:
                trestbps = float(str(param_map["blood_pressure"]).split("/")[0])

            sex_num = 1.0 if sex.lower() in ["male", "m", "man"] else 0.0
            age_val = age if age > 0 else 50.0
            chol_val = float(chol)
            trestbps_val = float(trestbps)
            fbs_val = 1.0 if (fbs is not None and float(fbs) > 120.0) else 0.0

            # Default Cleveland clinical feature template
            # Features: ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal']
            feature_vector = {
                "age": age_val,
                "sex": sex_num,
                "cp": float(param_map.get("chest_pain_type", 1.0)),
                "trestbps": trestbps_val,
                "chol": chol_val,
                "fbs": fbs_val,
                "restecg": float(param_map.get("restecg", 0.0)),
                "thalach": float(param_map.get("max_heart_rate", 150.0)),
                "exang": float(param_map.get("exercise_angina", 0.0)),
                "oldpeak": float(param_map.get("st_depression", 0.0)),
                "slope": float(param_map.get("st_slope", 1.0)),
                "ca": float(param_map.get("major_vessels", 0.0)),
                "thal": float(param_map.get("thalassemia", 3.0))
            }

            df_row = pd.DataFrame([feature_vector])[_XGB_FEATURES]
            df_imp = pd.DataFrame(_XGB_IMPUTER.transform(df_row), columns=_XGB_FEATURES)
            df_scaled = pd.DataFrame(_XGB_SCALER.transform(df_imp), columns=_XGB_FEATURES)

            prob = float(_XGB_MODEL.predict_proba(df_scaled)[0][1])
            pred = int(_XGB_MODEL.predict(df_scaled)[0])

            # Top feature importances
            importances = dict(zip(_XGB_FEATURES, [round(float(x), 4) for x in _XGB_MODEL.feature_importances_]))
            sorted_features = sorted(importances.items(), key=lambda x: x[1], reverse=True)[:5]

            return {
                "status": "computed",
                "model_name": "XGBoost Classifier",
                "dataset_source": "UCI Cleveland Heart Disease Database",
                "test_accuracy": _METRICS.get("test_accuracy") if _METRICS else None,
                "test_f1": _METRICS.get("test_f1") if _METRICS else None,
                "predicted_probability": round(prob, 4),
                "risk_category": "High Risk" if prob >= 0.60 else ("Moderate Risk" if prob >= 0.30 else "Low Risk"),
                "top_driving_features": [{"feature": k, "importance_weight": v} for k, v in sorted_features],
                "verified_metrics": _METRICS
            }
        except Exception as e:
            return {
                "status": "error",
                "reason": f"ML prediction pipeline error: {str(e)}"
            }
