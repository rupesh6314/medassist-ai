from fastapi import APIRouter, HTTPException, Response, status
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from services.pdf_summary_generator import generate_clinical_summary_pdf

router = APIRouter(prefix="/api/reports", tags=["Report Export"])


class PDFSummaryPayload(BaseModel):
    metadata: Dict[str, Any]
    vitals: List[Dict[str, Any]] = []
    risk_findings: List[Dict[str, Any]] = []
    ai_explanations: List[Dict[str, Any]] = []


@router.post("/export-summary-pdf")
def export_summary_pdf(payload: PDFSummaryPayload):
    """
    Generate an authoritative, printable PDF clinical summary of the report.
    """
    try:
        pdf_bytes = generate_clinical_summary_pdf(
            report_metadata=payload.metadata,
            vitals=payload.vitals,
            risk_findings=payload.risk_findings,
            ai_explanations=payload.ai_explanations
        )
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=clinical_summary.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate summary PDF: {str(e)}"
        )
