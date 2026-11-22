from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from services.risk_engine import ClinicalRiskEngine

router = APIRouter(prefix="/api/risk", tags=["Clinical Risk Assessment"])


class RiskEvaluationRequest(BaseModel):
    parameters: List[Dict[str, Any]]
    patient: Optional[Dict[str, Any]] = None


@router.post("/evaluate")
def evaluate_clinical_risks(payload: RiskEvaluationRequest):
    """
    Evaluates multi-organ clinical risks combining pure deterministic formulas
    (CKD-EPI 2021, ACC/AHA BP, ADA diabetes) with feature-gated ML (XGBoost).
    Every finding includes source trace back to original extracted report parameters.
    """
    try:
        results = ClinicalRiskEngine.evaluate_risks(
            extracted_parameters=payload.parameters,
            patient_metadata=payload.patient
        )
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Clinical risk evaluation error: {str(e)}"
        )
