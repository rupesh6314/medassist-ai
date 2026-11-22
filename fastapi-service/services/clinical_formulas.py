"""
Deterministic Clinical Formulas & Risk Staging Module
MedAssist AI — Pure Mathematical Clinical Algorithms Citing Medical Guidelines
"""

from typing import Optional, Dict, Any, Tuple


class ClinicalFormulas:
    """
    Implements pure deterministic clinical equations:
    - CKD-EPI 2021 Race-Free eGFR equation
    - KDIGO CKD Staging
    - ACC/AHA Blood Pressure Categories (2017/2019)
    - ACC/AHA Adult Lipid Classification
    - ADA Glycemic Classification (Fasting, Postprandial, HbA1c)
    - WHO BMI Categories
    """

    @staticmethod
    def calculate_egfr_ckd_epi_2021(
        creatinine_mg_dl: float,
        age_years: float,
        sex: str
    ) -> Dict[str, Any]:
        """
        2021 CKD-EPI Creatinine Equation (Race-Free):
        eGFR = 142 * min(Scr/kappa, 1)^alpha * max(Scr/kappa, 1)^(-1.200) * 0.9938^Age * (1.012 if female else 1.000)

        Citation: Inker LA, Eneanya ND, Coresh J, et al. New Creatinine- and Cystatin C-Based Equations to
        Estimate GFR without Race. N Engl J Med. 2021;385(19):1737-1749.
        """
        if creatinine_mg_dl <= 0 or age_years <= 0:
            return {
                "egfr": None,
                "stage": "Unknown",
                "stage_description": "Invalid input parameters",
                "guideline": "CKD-EPI (2021) Race-Free Equation"
            }

        is_female = sex.strip().lower() in ["f", "female", "woman"]

        kappa = 0.7 if is_female else 0.9
        alpha = -0.241 if is_female else -0.302
        gender_multiplier = 1.012 if is_female else 1.000

        scr_over_kappa = creatinine_mg_dl / kappa
        term1 = min(scr_over_kappa, 1.0) ** alpha
        term2 = max(scr_over_kappa, 1.0) ** (-1.200)
        age_factor = 0.9938 ** age_years

        egfr = 142.0 * term1 * term2 * age_factor * gender_multiplier
        egfr_rounded = round(egfr, 1)

        # KDIGO Stage
        if egfr_rounded >= 90.0:
            stage = "G1"
            stage_desc = "Normal or high kidney function (G1)"
        elif egfr_rounded >= 60.0:
            stage = "G2"
            stage_desc = "Mildly decreased kidney function (G2)"
        elif egfr_rounded >= 45.0:
            stage = "G3a"
            stage_desc = "Mildly to moderately decreased kidney function (G3a)"
        elif egfr_rounded >= 30.0:
            stage = "G3b"
            stage_desc = "Moderately to severely decreased kidney function (G3b)"
        elif egfr_rounded >= 15.0:
            stage = "G4"
            stage_desc = "Severely decreased kidney function (G4)"
        else:
            stage = "G5"
            stage_desc = "Kidney failure / End-stage renal disease (G5)"

        return {
            "egfr": egfr_rounded,
            "unit": "mL/min/1.73m²",
            "stage": stage,
            "stage_description": stage_desc,
            "guideline": "Inker et al. (NEJM 2021) / KDIGO (2024)",
            "inputs": {
                "creatinine": creatinine_mg_dl,
                "age": age_years,
                "sex": "Female" if is_female else "Male"
            }
        }

    @staticmethod
    def classify_blood_pressure(systolic: float, diastolic: float) -> Dict[str, Any]:
        """
        2017 ACC/AHA High Blood Pressure Clinical Practice Guideline
        """
        if systolic <= 0 or diastolic <= 0:
            return {"category": "Unknown", "guideline": "2017 ACC/AHA"}

        if systolic < 120 and diastolic < 80:
            cat = "Normal Blood Pressure"
            flag = "NORMAL"
        elif 120 <= systolic <= 129 and diastolic < 80:
            cat = "Elevated Blood Pressure"
            flag = "BORDERLINE"
        elif (130 <= systolic <= 139) or (80 <= diastolic <= 89):
            cat = "Stage 1 Hypertension"
            flag = "HIGH"
        elif systolic >= 180 or diastolic >= 120:
            cat = "Hypertensive Crisis (Emergency)"
            flag = "CRITICAL"
        elif systolic >= 140 or diastolic >= 90:
            cat = "Stage 2 Hypertension"
            flag = "HIGH"
        else:
            cat = "Undetermined"
            flag = "NORMAL"

        return {
            "systolic": systolic,
            "diastolic": diastolic,
            "category": cat,
            "flag": flag,
            "guideline": "2017 ACC/AHA Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure"
        }

    @staticmethod
    def classify_bmi(weight_kg: float, height_cm: float) -> Dict[str, Any]:
        """
        World Health Organization (WHO) Adult BMI Classification
        """
        if weight_kg <= 0 or height_cm <= 0:
            return {"bmi": None, "category": "Unknown", "guideline": "WHO Adult BMI"}

        height_m = height_cm / 100.0
        bmi = round(weight_kg / (height_m ** 2), 1)

        if bmi < 18.5:
            cat = "Underweight"
            flag = "LOW"
        elif 18.5 <= bmi < 25.0:
            cat = "Normal Weight"
            flag = "NORMAL"
        elif 25.0 <= bmi < 30.0:
            cat = "Overweight"
            flag = "HIGH"
        elif 30.0 <= bmi < 35.0:
            cat = "Class 1 Obesity"
            flag = "HIGH"
        elif 35.0 <= bmi < 40.0:
            cat = "Class 2 Obesity"
            flag = "HIGH"
        else:
            cat = "Class 3 Severe Obesity"
            flag = "CRITICAL"

        return {
            "bmi": bmi,
            "category": cat,
            "flag": flag,
            "guideline": "World Health Organization (WHO) BMI Classifications"
        }

    @staticmethod
    def classify_glucose(
        fasting_mg_dl: Optional[float] = None,
        postprandial_mg_dl: Optional[float] = None,
        hba1c_percent: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        American Diabetes Association (ADA) 2024 Standards of Care in Diabetes
        - Fasting: Normal < 100, Impaired Fasting (Prediabetes) 100-125, Diabetes >= 126 mg/dL
        - 2-hr PP: Normal < 140, Impaired Glucose Tolerance 140-199, Diabetes >= 200 mg/dL
        - HbA1c: Normal < 5.7%, Prediabetes 5.7 - 6.4%, Diabetes >= 6.5%
        """
        results = {}

        if fasting_mg_dl is not None:
            if fasting_mg_dl < 70:
                cat = "Hypoglycemia"
                flag = "LOW"
            elif fasting_mg_dl < 100:
                cat = "Normal Fasting Glucose"
                flag = "NORMAL"
            elif fasting_mg_dl <= 125:
                cat = "Impaired Fasting Glucose (Prediabetes)"
                flag = "BORDERLINE"
            else:
                cat = "Diabetes Threshold (Fasting >= 126 mg/dL)"
                flag = "HIGH"
            results["fasting"] = {"value": fasting_mg_dl, "category": cat, "flag": flag}

        if postprandial_mg_dl is not None:
            if postprandial_mg_dl < 140:
                cat = "Normal Glucose Tolerance (< 140 mg/dL)"
                flag = "NORMAL"
            elif postprandial_mg_dl <= 199:
                cat = "Impaired Glucose Tolerance (Prediabetes: 140-199 mg/dL)"
                flag = "BORDERLINE"
            else:
                cat = "Diabetes Threshold (2-hr PP >= 200 mg/dL)"
                flag = "HIGH"
            results["postprandial"] = {"value": postprandial_mg_dl, "category": cat, "flag": flag}

        if hba1c_percent is not None:
            if hba1c_percent < 5.7:
                cat = "Normal Glycemia (< 5.7%)"
                flag = "NORMAL"
            elif hba1c_percent <= 6.4:
                cat = "Prediabetes (5.7% - 6.4%)"
                flag = "BORDERLINE"
            else:
                cat = "Diabetes Mellitus Threshold (>= 6.5%)"
                flag = "HIGH"
            results["hba1c"] = {"value": hba1c_percent, "category": cat, "flag": flag}

        results["guideline"] = "American Diabetes Association (ADA) Standards of Care in Diabetes (2024)"
        return results
