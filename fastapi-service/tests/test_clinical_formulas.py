"""
Unit Tests for Pure Deterministic Clinical Formulas
MedAssist AI — Benchmarking CKD-EPI 2021, KDIGO, BP, BMI, and ADA criteria against published literature
"""

import sys
from pathlib import Path
import pytest

SERVICE_ROOT = Path(__file__).resolve().parent.parent
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from services.clinical_formulas import ClinicalFormulas


def test_egfr_male_standard():
    # 50 yo male, creatinine 1.0 mg/dL
    # Scr/kappa = 1.0 / 0.9 = 1.111 -> max term = 1.111^(-1.2) = 0.8817, 0.9938^50 = 0.7327
    # eGFR approx 142 * 0.8817 * 0.7327 = 91.7 mL/min/1.73m2
    res = ClinicalFormulas.calculate_egfr_ckd_epi_2021(creatinine_mg_dl=1.0, age_years=50, sex="male")
    assert res["egfr"] is not None
    assert 90.0 <= res["egfr"] <= 93.0
    assert res["stage"] == "G1"


def test_egfr_female_ckd():
    # 65 yo female, creatinine 2.1 mg/dL
    # Severe reduction expected -> G4 or G3b
    res = ClinicalFormulas.calculate_egfr_ckd_epi_2021(creatinine_mg_dl=2.1, age_years=65, sex="female")
    assert res["egfr"] is not None
    assert res["egfr"] < 35.0
    assert res["stage"] in ["G3b", "G4"]


def test_blood_pressure_categories():
    normal = ClinicalFormulas.classify_blood_pressure(118, 76)
    assert normal["category"] == "Normal Blood Pressure"
    assert normal["flag"] == "NORMAL"

    stage1 = ClinicalFormulas.classify_blood_pressure(134, 82)
    assert stage1["category"] == "Stage 1 Hypertension"
    assert stage1["flag"] == "HIGH"

    crisis = ClinicalFormulas.classify_blood_pressure(190, 125)
    assert crisis["category"] == "Hypertensive Crisis (Emergency)"
    assert crisis["flag"] == "CRITICAL"


def test_bmi_calculation():
    # 70 kg, 175 cm -> 70 / (1.75^2) = 22.86 -> 22.9
    res = ClinicalFormulas.classify_bmi(70, 175)
    assert res["bmi"] == 22.9
    assert res["category"] == "Normal Weight"
    assert res["flag"] == "NORMAL"


def test_ada_glucose_criteria():
    res = ClinicalFormulas.classify_glucose(
        fasting_mg_dl=155.0,
        postprandial_mg_dl=218.0,
        hba1c_percent=7.8
    )
    assert res["fasting"]["flag"] == "HIGH"
    assert res["postprandial"]["flag"] == "HIGH"
    assert res["hba1c"]["flag"] == "HIGH"
