"""
PDF Summary Generator Service
MedAssist AI — Generates high-fidelity clinical summary reports using ReportLab
"""

import io
from datetime import datetime
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT


def generate_clinical_summary_pdf(
    report_metadata: Dict[str, Any],
    vitals: List[Dict[str, Any]],
    risk_findings: List[Dict[str, Any]],
    ai_explanations: List[Dict[str, Any]]
) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f766e')
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#475569')
    )
    h2_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=12,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#1e293b')
    )
    meta_label_style = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#64748b')
    )
    meta_val_style = ParagraphStyle(
        'MetaVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0f172a')
    )
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#64748b'),
        alignment=TA_CENTER
    )

    story = []

    # 1. Header
    story.append(Paragraph("MedAssist AI — Clinical Report Summary", title_style))
    story.append(Paragraph(f"Generated on {datetime.now().strftime('%d %B %Y, %I:%M %p')} • Confidential Medical Summary", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0f766e'), spaceAfter=12))

    # 2. Patient & Report Metadata Grid
    patient_name = report_metadata.get('patientName') or report_metadata.get('patient_name') or 'N/A'
    report_date = report_metadata.get('reportDate') or report_metadata.get('report_date') or 'N/A'
    hospital = report_metadata.get('hospital') or 'N/A'
    doctor = report_metadata.get('doctor') or 'N/A'

    meta_data = [
        [
            Paragraph("PATIENT NAME", meta_label_style),
            Paragraph("REPORT DATE", meta_label_style),
            Paragraph("FACILITY / LAB", meta_label_style),
            Paragraph("PHYSICIAN / REVIEWER", meta_label_style)
        ],
        [
            Paragraph(f"<b>{patient_name}</b>", meta_val_style),
            Paragraph(f"<b>{str(report_date)[:10]}</b>", meta_val_style),
            Paragraph(f"<b>{hospital}</b>", meta_val_style),
            Paragraph(f"<b>{doctor}</b>", meta_val_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[135, 110, 150, 145])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))

    # 3. Clinical Summary Text
    summary_text = report_metadata.get('summary') or "Extracted clinical parameter summary."
    story.append(Paragraph("<b>Clinical Executive Summary:</b> " + summary_text, body_style))
    story.append(Spacer(1, 10))

    # 4. Authoritative Extracted Laboratory Measurements Table
    story.append(Paragraph("1. Authoritative Report Data (Extracted Values)", h2_style))
    if vitals:
        vitals_rows = [
            [
                Paragraph("<b>Parameter</b>", meta_label_style),
                Paragraph("<b>Result</b>", meta_label_style),
                Paragraph("<b>Unit</b>", meta_label_style),
                Paragraph("<b>Reference Interval</b>", meta_label_style),
                Paragraph("<b>Status</b>", meta_label_style)
            ]
        ]
        for v in vitals:
            status_text = str(v.get('status', 'NORMAL')).upper()
            status_color = '#dc2626' if 'HIGH' in status_text else ('#d97706' if 'LOW' in status_text else '#16a34a')
            vitals_rows.append([
                Paragraph(str(v.get('label', '')), body_style),
                Paragraph(f"<b>{v.get('value', '')}</b>", body_style),
                Paragraph(str(v.get('unit', '')), body_style),
                Paragraph(str(v.get('referenceRange', 'N/A')), body_style),
                Paragraph(f"<font color='{status_color}'><b>{status_text}</b></font>", body_style)
            ])
        v_table = Table(vitals_rows, colWidths=[180, 80, 70, 130, 80])
        v_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(v_table)
    else:
        story.append(Paragraph("No laboratory vitals recorded.", body_style))

    story.append(Spacer(1, 12))

    # 5. Deterministic Clinical Risk & Staging Table
    if risk_findings:
        story.append(Paragraph("2. Clinical Risk Staging & Guideline Citations", h2_style))
        rf_rows = [
            [
                Paragraph("<b>System</b>", meta_label_style),
                Paragraph("<b>Finding / Equation</b>", meta_label_style),
                Paragraph("<b>Stage / Value</b>", meta_label_style),
                Paragraph("<b>Guideline Reference</b>", meta_label_style)
            ]
        ]
        for f in risk_findings:
            rf_rows.append([
                Paragraph(str(f.get('organ_system', '')), body_style),
                Paragraph(str(f.get('finding_name', '')), body_style),
                Paragraph(f"<b>{f.get('stage', '')}</b> ({f.get('value', '')})", body_style),
                Paragraph(str(f.get('guideline', '')), body_style)
            ])
        rf_table = Table(rf_rows, colWidths=[110, 160, 120, 150])
        rf_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#eef2ff')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(rf_table)
        story.append(Spacer(1, 12))

    # 6. Explanations if available
    if ai_explanations:
        story.append(Paragraph("3. Clinical Parameter Explanations", h2_style))
        expl_rows = [
            [
                Paragraph("<b>Parameter</b>", meta_label_style),
                Paragraph("<b>Plain-Language Clinical Explanation</b>", meta_label_style)
            ]
        ]
        for e in ai_explanations[:8]:  # Top 8 explanations to keep layout compact
            expl_rows.append([
                Paragraph(f"<b>{e.get('parameter', '')}</b>", body_style),
                Paragraph(str(e.get('explanation', '')), body_style)
            ])
        expl_table = Table(expl_rows, colWidths=[140, 400])
        expl_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f0fdf4')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(expl_table)
        story.append(Spacer(1, 14))

    # 7. Disclaimer
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#cbd5e1'), spaceAfter=8))
    story.append(Paragraph(
        "Notice: This clinical summary was deterministically compiled from laboratory document records by MedAssist AI. "
        "It is designed for patient health literacy and clinical decision support, and does not substitute for a qualified physician's diagnosis or medical judgment.",
        disclaimer_style
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
