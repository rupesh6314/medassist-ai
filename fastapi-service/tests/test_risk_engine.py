"""
Unit Tests for Integrated Clinical Risk Engine
MedAssist AI — Tests source tracing, deterministic guideline mapping, and feature gating
"""

import sys
from pathlib import Path
import pytest

SERVICE_ROOT = Path(__file__).resolve().parent.parent
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from services.risk_engine import ClinicalRiskEngine


def test_renal_and_glycemic_risk():
    extracted = [
        {
            "canonical_key": "creatinine",
            "display_name": "Serum Creatinine",
            "value": 1.9,
            "unit": "mg/dL",
            "reference_range": "0.7 - 1.3",
            "page": 1,
            "source_text": "Serum Creatinine 1.9 mg/dL (0.7 - 1.3)"
        },
        {
            "canonical_key": "glucose_fasting",
            "display_name": "Fasting Blood Sugar",
            "value": 160.0,
            "unit": "mg/dL",
            "reference_range": "70 - 100",
            "page": 1,
            "source_text": "Fasting Blood Sugar 160.0 mg/dL"
        }
    ]

    res = ClinicalRiskEngine.evaluate_risks(extracted, {"age": 55, "sex": "male"})
    assert len(res["findings"]) >= 2

    # Check eGFR finding
    egfr_f = next(f for f in res["findings"] if "eGFR" in f["finding_name"])
    assert egfr_f["stage"] in ["G3a", "G3b"]
    assert egfr_f["source_trace"]["extracted_value"] == 1.9
    assert "Inker et al." in egfr_f["guideline"]

    # Check Fasting finding
    fbs_f = next(f for f in res["findings"] if "Fasting Blood Sugar" in f["finding_name"])
    assert "Diabetes" in fbs_f["stage"]
    assert fbs_f["source_trace"]["extracted_value"] == 160.0

    # Check ML Gating: total cholesterol was missing so ML risk must be gated out
    assert res["ml_risk"]["status"] == "gated_out"
    assert "Total Cholesterol" in res["ml_risk"]["missing_required_markers"]


def test_ml_heart_risk_when_markers_present():
    extracted = [
        {
            "canonical_key": "cholesterol_total",
            "display_name": "Total Cholesterol",
            "value": 240.0,
            "unit": "mg/dL",
            "reference_range": "< 200",
            "page": 1,
            "source_text": "Total Cholesterol 240 mg/dL"
        },
        {
            "canonical_key": "systolic_bp",
            "display_name": "Systolic BP",
            "value": 145.0,
            "unit": "mmHg",
            "reference_range": "< 120",
            "page": 1,
            "source_text": "BP 145/90 mmHg"
        },
        {
            "canonical_key": "diastolic_bp",
            "display_name": "Diastolic BP",
            "value": 92.0,
            "unit": "mmHg",
            "reference_range": "< 80",
            "page": 1,
            "source_text": "BP 145/90 mmHg"
        }
    ]

    res = ClinicalRiskEngine.evaluate_risks(extracted, {"age": 60, "sex": "male"})
    assert res["ml_risk"]["status"] == "computed"
    assert res["ml_risk"]["model_name"] == "XGBoost Classifier"
    assert "predicted_probability" in res["ml_risk"]
    assert len(res["ml_risk"]["top_driving_features"]) > 0
