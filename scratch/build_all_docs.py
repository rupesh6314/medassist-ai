import os
import re
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def get_full_text():
    return """================================================================================
                    MEDASSIST AI — COMPREHENSIVE PROJECT SPECIFICATION
                     SYSTEM ARCHITECTURE, ML PIPELINES & GUIDE REVIEW
================================================================================
Document Title   : MedAssist AI — Complete Technical Overview & Viva/Guide Review Guide
File Name        : PROJECT_OVERVIEW_GUIDE_REVIEW.txt (Plain Text) / PROJECT_OVERVIEW_GUIDE_REVIEW.md (Rich Text) / PROJECT_OVERVIEW_GUIDE_REVIEW.docx (Word Document)
Project Name     : MedAssist AI (Clinical Intelligence & Multi-Organ Health Risk Platform)
Target Audience  : Capstone Project Guides, External Evaluators, Viva Voce Panel, Students
Version          : 3.5 (Restructured Core Functional Pillars: Patient Portal -> Doctor Portal -> OCR Extraction -> Disease Risk -> Diet Planner)
================================================================================


TABLE OF CONTENTS
--------------------------------------------------------------------------------
1. PATIENT PORTAL SUBSYSTEM (COMPREHENSIVE CLINICAL FEATURES & WORKFLOWS)
   1.1 Patient Health Dashboard & Composite Health Scoring Engine
   1.2 Manual Health Readings & Daily Vital Logging (ManualEntryPage.tsx)
   1.3 Medical Reports Ingestion & Spatial PDF Archive (MedicalReportsPage.tsx & UploadZone.tsx)
   1.4 Longitudinal Health Biomarker Analytics (HealthTrendsPage.tsx)
   1.5 Multi-Organ Disease Risk Center (DiseaseRiskPage.tsx & RiskGauge.tsx)
   1.6 Clinical Diet & Personalized Meal Planning (DietPlannerPage.tsx)
   1.7 Appointment Scheduling & Virtual Tele-Consultation (AppointmentsPage.tsx & ConsultationPage.tsx)
       - Doctor Discovery & Dynamic Slot Availability Query
       - Dual Consultation Modes: Online Telehealth Video & Offline Clinic Visits
       - Razorpay Payment Workflow (RazorpayPaymentModal.tsx)
       - Appointment Cancellation & Status Management (CancelAppointmentModal.tsx)
   1.8 Direct Doctor Communication & Secure Messaging (MessagesPage.tsx)
   1.9 Digital Prescription History, Modal Previews & Downloads (PrescriptionsPage.tsx)
   1.10 Patient Account Profile, Medical History & Settings (ProfilePage.tsx & SettingsPage.tsx)

2. DOCTOR CLINICAL WORKSTATION & PORTAL SUBSYSTEM
   2.1 Practice Overview & Clinical KPI Dashboard (DoctorOverviewTab.tsx)
   2.2 Patient Care Roster & Association Workflow (DoctorPatientsTab.tsx & AddPatientModal.tsx)
   2.3 360-Degree Comprehensive Patient Dossier (DoctorPatientProfileView.tsx)
   2.4 Critical Abnormal Biomarker Triage & Patient Alerts Pipeline (patient_alerts)
   2.5 Appointments Schedule Management & Consultation Lifecycle (DoctorAppointmentsTab.tsx)
   2.6 In-Consultation Clinical Notes & Real-Time Telehealth Controls (ConsultationNotesModal.tsx)
   2.7 Digital Prescription Formulation & Issuance (UploadPrescriptionModal.tsx)
   2.8 Multi-Patient Diagnostic Reports Explorer (DoctorReportsTab.tsx)
   2.9 Doctor Practice Profile, Credentials & Weekly Availability (DoctorSettingsTab.tsx)

3. SPATIAL MEDICAL PDF EXTRACTION & MULTI-ENGINE OCR PIPELINE
   3.1 Strict PDF Ingestion & Binary Integrity Validation (pdf_ingestion.py)
   3.2 Per-Page Document Classification (pdf_classifier.py)
   3.3 Document Image Preprocessing for Scanned PDFs (OpenCV Deskewing, Denoising, Binarization)
   3.4 Multi-Engine OCR & Spatial Bounding Box Extraction (PyMuPDF, PaddleOCR, Tesseract)
   3.5 Spatial Zoning & Reading Order Sorting (Header, Body, Footer)
   3.6 Taxonomic Candidate Classification & Table Reconstruction
   3.7 3-Tier Semantic Ontology Normalization (Synonym Map -> RapidFuzz -> Dense Embeddings)
   3.8 Multi-Factor Confidence Scoring Formula

4. MACHINE LEARNING ARCHITECTURE & MULTI-ORGAN DISEASE RISK SUBSYSTEM
   4.1 Algorithm Selection: Random Forest vs. Alternatives & Bagging Variance Reduction
   4.2 Class Imbalance Handling: Synthetic Minority Over-sampling Technique (SMOTE)
   4.3 End-to-End ML Training & Online Real-Time Inference Pipelines
   4.4 Zero Data Leakage Enforcement & Tabular Preprocessing Suite
       - Infinite Value & Tab Trimming
       - Median & Mode Missing Value Imputation
       - z-Score Continuous Feature Standardization
       - One-Hot Categorical Encoding with Out-of-Distribution Handling
       - Live Inference Feature Mapping (report_mapper.py)
   4.5 Detailed Multi-Organ Model Specifications, Feature Importances & Evaluation Results
       - Diabetes Risk Analysis Model (95.64% Acc, 96.39% ROC-AUC)
       - CBC / Anemia Abnormality Model (99.60% Acc, 100.00% ROC-AUC)
       - Heart Disease (Framingham 10-Year CHD) Model (79.25% Acc, 64.27% ROC-AUC)
       - Chronic Kidney Disease (CKD) Model (100.00% Acc, 100.00% ROC-AUC)
       - Liver Disease (ILPD) Model (73.68% Acc, 77.20% ROC-AUC)
   4.6 Comprehensive Performance Comparison Matrix & Risk Stratification Tiers

5. CLINICAL DIET & NUTRITION OPTIMIZATION SUBSYSTEM (IFCT 2017 & MILP)
   5.1 End-to-End Clinical Nutrition Generation Workflow
   5.2 Biometric Energy Calculations (Harris-Benedict BMR & Activity TDEE)
   5.3 Multi-Disease Clinical Precedence & Conflict Resolution Hierarchy (Renal -> CVD -> Diabetes -> Anemia)
   5.4 Organ-Specific Dietary Rule Modules & Physiological Guardrails
   5.5 Indian Food Composition Tables (IFCT 2017) & 16 Authentic Food Groups
   5.6 Mixed Integer Linear Programming (MILP) Mathematical Formulation
       - Mathematical Decision Variables (y_fm, x_fm, z_f, Slacks)
       - Comprehensive Linear Constraints Matrix (Semi-Continuous Linking, Indian Plate Structure, Macros, Micros, Anti-Repetition)
       - Multi-Objective Cost Function (Penalties, Rewards, Preferences)
       - Branch-and-Cut Solver Execution (PuLP CBC / SciPy HiGHS)
   5.7 Multi-Day Variety Cycling, Regional Cuisines & 10-Class Allergen Filtration
   5.8 Post-Optimization Clinical Safety Validator & Verification Pipeline

6. HIGH-LEVEL SYSTEM ARCHITECTURE, CORE BACKEND & DATABASE DESIGN
   6.1 Decoupled 3-Tier System Architecture Diagram
   6.2 Frontend Architecture & Design System (React 19, TypeScript 6.0, Vite 8, Tailwind CSS v4)
   6.3 Core Express Backend Architecture & Security Middleware (Node.js, Express 5, JWT, bcryptjs)
   6.4 Complete Relational Database Schema (PostgreSQL 14 tables)
   6.5 Backend REST API Endpoints Matrix
   6.6 FastAPI AI/ML Microservice Routers

7. COMPLETE LIST OF DATASETS USED
8. FREQUENTLY ASKED GUIDE / EXAMINER VIVA VOCE QUESTIONS & ANSWERS (Q1 to Q14)
================================================================================


================================================================================
1. PATIENT PORTAL SUBSYSTEM (COMPREHENSIVE CLINICAL FEATURES & WORKFLOWS)
================================================================================

The Patient Portal in MedAssist AI serves as an intelligent, patient-centric personal health 
command center designed to empower individuals with clear diagnostic understanding, real-time 
risk awareness, personalized lifestyle guidance, and frictionless telehealth connectivity.

--------------------------------------------------------------------------------
1.1 PATIENT HEALTH DASHBOARD & COMPOSITE HEALTH SCORING ENGINE (DashboardPage.tsx)
--------------------------------------------------------------------------------
The Patient Dashboard aggregates multi-source health metrics into an actionable, unified clinical summary:

1. Composite Health Score Calculation (computeHealthMetrics):
   - Baseline: Starts at an optimal baseline score of 100.
   - Disease Risk Penalties: Deducts 12 points for each High Risk tier prediction (>=60% probability) 
     and 6 points for each Moderate Risk tier prediction (35% to 59%).
   - Out-of-Range Biomarker Penalties: Deducts 5 points for every vital parameter that breaches its healthy reference interval.
   - Lifestyle Deductions: Deducts 8 points for daily smoking (4 points for occasional smoking), 
     4 points for sedentary physical activity, 5 points for abnormal BMI (<18.5 or >30), and up to 10 points 
     for chronic preexisting comorbidities.
   - Bound Enforcement: Clamped strictly between 20 and 100 with clear clinical risk tier labels ('Optimal', 'Moderate Risk', 'Attention Needed').
   - Visual Presentation: Rendered using a prominent score badge, status indicator, and dynamic color accents (teal, amber, rose).

2. Quick Vitals Summary Cards (StatCard.tsx):
   - Displays key vital parameters: Fasting Blood Glucose (mg/dL), Blood Pressure (Systolic/Diastolic mmHg), 
     Glycated Hemoglobin HbA1c (%), and Body Mass Index (BMI kg/m²).
   - Dynamic Status Chips: Color-coded status tags (NORMAL in Emerald, BORDERLINE in Amber, HIGH/LOW in Rose) 
     with baseline reference range comparisons.

3. Quick Action Command Center:
   - One-click triggers for: Upload Report (PDF Ingestion), Book Appointment (Doctor Discovery), 
     Manual Vitals Entry (Self-Logging), View Diet Plan (IFCT 2017), and My Prescriptions (Downloads).

4. Upcoming Consultations & Physician Notes Feed:
   - Displays upcoming confirmed appointments with doctor avatar, specialization, scheduled date/time, 
     and direct link to join virtual tele-consultation rooms.
   - Highlights recent physician consultation notes and follow-up recommendations.

--------------------------------------------------------------------------------
1.2 MANUAL HEALTH READINGS & DAILY VITAL LOGGING (ManualEntryPage.tsx)
--------------------------------------------------------------------------------
Enables patients to record ad-hoc biometric measurements without an official PDF lab document:
- Supported Vitals: Fasting Blood Glucose, Post-Prandial Glucose, Systolic/Diastolic Blood Pressure, 
  Total Cholesterol, Serum Creatinine, Hemoglobin, Height, Weight, and Pulse.
- Automated Reference Validation: Automatically checks input values against clinical reference intervals 
  and assigns status flags ('normal', 'borderline', 'high', 'low').
- Database Synchronization: Persists entries into medical_reports with source = 'Manual Entry' and creates 
  corresponding rows in vital_readings, immediately triggering dynamic risk re-evaluation and trend updates.

--------------------------------------------------------------------------------
1.3 MEDICAL REPORTS INGESTION & SPATIAL PDF ARCHIVE (MedicalReportsPage.tsx & UploadZone.tsx)
--------------------------------------------------------------------------------
1. UploadZone.tsx & Ingestion Modal (ReportUploadPage.tsx):
   - Drag-and-drop PDF upload zone with client-side mime-type verification (strictly rejects non-PDF formats).
   - Multi-stage upload progress animation (Validation -> Spatial Layout Parsing -> Semantic OCR -> Verification).
2. MedicalReportsPage.tsx:
   - Chronological diagnostic archive showing all uploaded reports with metadata (Patient Name, Report Date, 
     Diagnostic Center / Hospital Name, Ordering Doctor, Report Type).
   - Interactive Report Detail Card (ReportDetailCard.tsx):
     * Embedded PDF Document Viewer: Side-by-side preview of the original laboratory report PDF.
     * Structured Analyte Table: Extracted clinical parameters organized by category (Glycemic, Hematology, 
       Renal, Hepatic, Lipid), displaying Parameter Name, Canonical Key, Observed Value, Standard Unit, 
       Clinical Reference Interval, and Status Flag (NORMAL, HIGH, LOW, ABNORMAL).
     * Term Explanation Card (TermExplanationCard.tsx): Plain-language medical definitions and clinical 
       implications for complex diagnostic terms (e.g., explaining why elevated Serum Creatinine relates to kidney filtration).

--------------------------------------------------------------------------------
1.4 LONGITUDINAL HEALTH BIOMARKER ANALYTICS (HealthTrendsPage.tsx)
--------------------------------------------------------------------------------
1. Multi-Biomarker Historical Tracking:
   - Supports longitudinal tracking across Fasting Blood Glucose, HbA1c, Hemoglobin, Serum Creatinine, 
     Total Cholesterol, and Systolic Blood Pressure.
2. Interactive Recharts Visualizations (TrendChart.tsx & TrendMetricSelector.tsx):
   - Multi-point time series area and line charts plotting historical values across multiple report dates.
   - Reference Threshold Overlays: Shaded horizontal reference bands representing healthy clinical intervals 
     (e.g., green shaded zone for Fasting Glucose 70-99 mg/dL).
   - Trajectory Indicators: Visual trend slope indicators showing whether a parameter is improving, stable, or deteriorating.

--------------------------------------------------------------------------------
1.5 MULTI-ORGAN DISEASE RISK CENTER (DiseaseRiskPage.tsx & RiskGauge.tsx)
--------------------------------------------------------------------------------
1. Multi-Organ Risk Dashboard:
   - Dedicated risk evaluation cards for Diabetes, CBC/Anemia, Cardiovascular Disease (10-Year CHD), 
     Chronic Kidney Disease (CKD), and Liver Disease (ILPD).
2. Circular Risk Gauges (RiskGauge.tsx):
   - SVG animated circular gauges displaying calibrated risk probability percentages (0% to 100%).
   - Tiers: Low Risk (<30%, Emerald), Moderate Risk (30-59%, Amber), High Risk (>=60%, Crimson).
3. Organ Risk Detail Modal (OrganRiskDetailModal.tsx):
   - In-depth physiological explanation of the risk assessment.
   - Feature Contribution Breakdown: Identifies the specific patient lab parameters (e.g. HbA1c 8.2%, BP 145/95) 
     that drove the Random Forest model's prediction.
   - Clinical Action Items: Evidence-based lifestyle and dietary recommendations to reduce risk.

--------------------------------------------------------------------------------
1.6 CLINICAL DIET & PERSONALIZED MEAL PLANNING (DietPlannerPage.tsx)
--------------------------------------------------------------------------------
1. 7-Day Structured Meal Schedule:
   - Weekly calendar interface presenting 5 daily meal slots: Breakfast, Mid-Morning Snack, Lunch, Evening Snack, Dinner.
   - Itemized Indian Food Dishes: Sourced from the ICMR-NIN IFCT 2017 dataset with authentic household portion sizes.
2. Macro & Micronutrient Summary Cards:
   - Total daily calories, protein (g), carbohydrates (g), fats (g), dietary fiber (g), sodium (mg), potassium (mg), 
     phosphorus (mg), iron (mg), and vitamin C (mg) with target comparison progress bars.
3. Diet Customization Modal (DietPreferenceModal.tsx):
   - Diet Types: Vegetarian, Eggetarian, Non-Vegetarian.
   - Regional Indian Cuisines: North Indian, South Indian, East Indian, West Indian, Pan-Indian (All).
   - Clinical Health Goals: Weight Loss, Muscle Gain, Glycemic Control, Renal Protection, Maintenance.
   - Allergen Filtration: Excludes 10 major allergen classes (Peanuts, Tree Nuts, Dairy, Gluten, Eggs, Fish, Shellfish, Soy, Sesame, Mustard).
4. IFCT 2017 Food Explorer Modal (FoodExplorerModal.tsx):
   - Search and browse 500+ Indian food items with nutrient details per 100g.
5. Daily Meal Breakdown Modal (DietDayDetailsModal.tsx):
   - Detailed nutritional breakdown for each specific day and meal slot.

--------------------------------------------------------------------------------
1.7 APPOINTMENT SCHEDULING & VIRTUAL TELE-CONSULTATION (AppointmentsPage.tsx & ConsultationPage.tsx)
--------------------------------------------------------------------------------
1. Doctor Discovery & Profile Inspection (AppointmentsPage.tsx):
   - Directory of verified clinical doctors with specialization badges (Cardiology, Nephrology, Diabetology, General Practice), 
     hospital affiliation, clinic address, years of experience, consultation fee (INR), and professional bio.
2. Dynamic Real-Time Slot Availability:
   - Calendar date picker that queries real-time booked appointments (GET /api/appointments/doctors/:doctorId?date=YYYY-MM-DD), 
     dynamically disabling already-reserved time slots to prevent double booking.
3. Dual Consultation Formats:
   - Online Video Consultation: Generates a secure telehealth video room URL (/consultation/:apptNumber).
   - Offline In-Clinic Visit: Displays the doctor's physical clinic address and arrival instructions.
4. Integrated Razorpay Payment Flow (RazorpayPaymentModal.tsx):
   - Seamless payment simulation supporting Credit/Debit Cards, UPI, and Netbanking.
   - Generates authentic payment reference (pay_xxxx), creates a record in the PostgreSQL payments table, 
     confirms the appointment status, and dispatches mutual notifications.
5. Appointment Management & Cancellation (CancelAppointmentModal.tsx):
   - Filter appointments by status ('ALL', 'confirmed', 'completed', 'cancelled').
   - Patient-initiated cancellation with reason tracking, updating database status to 'cancelled' and freeing the slot.
6. Virtual Tele-Consultation Room (ConsultationPage.tsx):
   - Browser-based video/audio tele-consultation interface with camera, microphone, and screen share controls.
   - Call duration timer and session lifecycle management.

--------------------------------------------------------------------------------
1.8 DIRECT DOCTOR COMMUNICATION & SECURE MESSAGING (MessagesPage.tsx)
--------------------------------------------------------------------------------
1. Role-Restricted Messaging Channel:
   - Patients can communicate exclusively with their assigned primary care doctor or consulting physicians with active appointments.
2. Conversation Sidebar & Unread Tracking:
   - Lists authorized doctors with online presence badges, specialization, unread message count badges, and last message snippet.
3. Active Message Thread:
   - Real-time chat stream with sender differentiation, automatic read receipts (PUT /api/messages/read/:otherUserId), 
     optional appointment linkage, and instant in-app notification dispatch.

--------------------------------------------------------------------------------
1.9 DIGITAL PRESCRIPTION HISTORY, MODAL PREVIEWS & DOWNLOADS (PrescriptionsPage.tsx)
--------------------------------------------------------------------------------
1. Prescription Archive:
   - Searchable repository of all official prescriptions issued by consulting doctors.
2. Interactive Prescription Viewer (PrescriptionViewModal.tsx):
   - Displays prescription number (e.g. RX1025), prescribing doctor, date, clinical diagnosis, general instructions, 
     and structured medication schedule table (Medicine Name, Dosage, Frequency, Duration, Instructions).
3. Authenticated Streaming PDF Downloads:
   - Direct download button streaming the original signed prescription PDF from GET /api/prescriptions/download/:id 
     with strict JWT ownership verification.

--------------------------------------------------------------------------------
1.10 PATIENT ACCOUNT PROFILE, MEDICAL HISTORY & SETTINGS (ProfilePage.tsx & SettingsPage.tsx)
--------------------------------------------------------------------------------
- Personal Demographics: Age, gender, blood group, height, weight, BMI, contact phone, emergency contact.
- Medical Background: Chronic conditions, allergies, smoking habit, physical activity level, primary assigned doctor code.
- User Settings: Dark / Light theme toggle, notification preferences, email alerts, and data privacy options.


================================================================================
2. DOCTOR CLINICAL WORKSTATION & PORTAL SUBSYSTEM
================================================================================

The Doctor Portal (DoctorDashboardPage.tsx) is a clinical workstation designed for licensed medical 
practitioners to monitor patient cohorts, triage abnormal lab values, conduct tele-consultations, 
and issue verified digital prescriptions.

--------------------------------------------------------------------------------
2.1 PRACTICE OVERVIEW & CLINICAL KPI DASHBOARD (DoctorOverviewTab.tsx)
--------------------------------------------------------------------------------
1. Real-Time Clinical KPIs:
   - Total Active Patients under practitioner care.
   - High-Risk Patients requiring immediate attention.
   - New Unreviewed Lab Alerts flagged by the automated triage engine.
   - Upcoming Consultations scheduled for today and the current week.
2. Critical Patient Alerts Triage Card:
   - Displays urgent abnormal biomarker alerts with risk probability percentages and one-click triage buttons (Mark as Reviewed).
3. Recent Activity Stream:
   - Real-time audit log of incoming lab reports, appointment bookings, and issued prescriptions.

--------------------------------------------------------------------------------
2.2 PATIENT CARE ROSTER & ASSOCIATION WORKFLOW (DoctorPatientsTab.tsx & AddPatientModal.tsx)
--------------------------------------------------------------------------------
1. Searchable Patient Care Roster:
   - Instant filtering across patient name, unique Patient Code (e.g. P000001), email, phone, and relationship status ('active' / 'inactive').
   - Displays last appointment date and most recent uploaded lab report date.
2. Add Patient Association Modal (AddPatientModal.tsx):
   - Allows doctors to associate new patients with their practice by entering the Patient ID or email.
   - Validates user existence, verifies role = 'patient', creates an active doctor_patients relationship record, 
     and automatically dispatches an in-app notification to the patient.
3. Patient Action Bar:
   - Direct links to open the 360-degree patient dossier, initiate a direct message thread, or upload a prescription.

--------------------------------------------------------------------------------
2.3 360-DEGREE COMPREHENSIVE PATIENT DOSSIER (DoctorPatientProfileView.tsx)
--------------------------------------------------------------------------------
When a clinician clicks on any patient, the workstation renders a complete, 360-degree clinical dossier:
1. Patient Demographics & Health Profile: Age, gender, blood group, BMI, smoking history, activity level, allergies, existing conditions.
2. Vital Signs Status Matrix: Latest recorded values for Glucose, HbA1c, Blood Pressure, Total Cholesterol, Hemoglobin, 
   and Creatinine with automated color-coded physiological status badges.
3. Multi-Organ ML Disease Risk Evaluations: Interactive risk cards for Diabetes, CBC/Anemia, Heart Disease, Kidney Disease, 
   and Liver Disease showing calibrated probabilities, risk tiers, and model-identified risk factors.
4. Longitudinal Trend Analytics: Interactive multi-point biomarker trajectory charts.
5. Diagnostic Lab Reports Archive: Complete history of uploaded PDF reports with structured extracted analyte tables and embedded PDF preview.
6. Active IFCT 2017 Diet Plan Inspection: Full view of the patient's active 7-day meal plan, daily nutrient totals, and clinical safety compliance.
7. Appointments & Consultation History: Chronological log of all past and upcoming visits with consultation notes.
8. Digital Prescriptions Log: All prescriptions issued to this patient with download and review capabilities.

--------------------------------------------------------------------------------
2.4 CRITICAL ABNORMAL BIOMARKER TRIAGE & PATIENT ALERTS PIPELINE (patient_alerts)
--------------------------------------------------------------------------------
1. Automated Alert Generation:
   - When a patient uploads a lab report or enters vitals that exceed critical clinical thresholds (e.g. Fasting Glucose > 200 mg/dL, 
     Creatinine > 1.5 mg/dL, Systolic BP > 140 mmHg), the backend automatically inserts a row into patient_alerts.
2. Alert Status Lifecycle:
   - Alerts start with status = 'NEW'.
   - The doctor reviews the patient's record and clicks "Mark Reviewed", which updates status = 'REVIEWED', 
     attaches reviewed_by = doctor_id, and logs reviewed_at timestamp (PUT /api/doctor/alerts/:alertId/review).

--------------------------------------------------------------------------------
2.5 APPOINTMENTS SCHEDULE MANAGEMENT & CONSULTATION LIFECYCLE (DoctorAppointmentsTab.tsx)
--------------------------------------------------------------------------------
1. Doctor Schedule & Agenda View:
   - Comprehensive schedule filtered by status ('ALL', 'confirmed', 'completed', 'cancelled', 'no_show') and type ('online', 'offline').
   - Calendar day picker to inspect consultations for specific dates.
2. Telehealth Session Launch:
   - One-click launch button to enter the virtual video consultation room (/consultation/:apptNumber).
3. Appointment Status Updates:
   - Doctors can update consultation status to 'completed', record doctor notes, or mark as 'no_show'.

--------------------------------------------------------------------------------
2.6 IN-CONSULTATION CLINICAL NOTES & REAL-TIME CONTROLS (ConsultationNotesModal.tsx)
--------------------------------------------------------------------------------
- Live in-consultation modal allowing physicians to record structured clinical notes:
  * Chief Patient Symptoms
  * Clinical Observations & Differential Diagnosis
  * Diagnostic & Lifestyle Recommendations
- Persisted directly into appointments.consultation_notes (JSONB) in PostgreSQL.

--------------------------------------------------------------------------------
2.7 DIGITAL PRESCRIPTION FORMULATION & ISSUANCE (UploadPrescriptionModal.tsx)
--------------------------------------------------------------------------------
1. Prescription Upload Workflow:
   - Doctor selects the target patient and associated appointment.
   - Doctor uploads the official signed prescription PDF file (stored securely in /uploads/prescriptions/).
   - Doctor enters Clinical Diagnosis and General Instructions.
   - Doctor adds an itemized Medication Schedule (Medicine Name, Dosage, Frequency, Duration, Special Instructions) 
     stored as structured JSONB in prescriptions.medications.
2. Automated System Sync:
   - Automatically generates a unique prescription tracking code (e.g. RX1025).
   - Marks the linked appointment status as 'completed'.
   - Sends an instant in-app notification to the patient.

--------------------------------------------------------------------------------
2.8 MULTI-PATIENT DIAGNOSTIC REPORTS EXPLORER (DoctorReportsTab.tsx)
--------------------------------------------------------------------------------
- Cross-patient repository allowing doctors to browse, search, and verify all incoming laboratory reports across their assigned patient cohort.
- Review raw extracted parameter values, verify OCR accuracy, and attach doctor validation notes.

--------------------------------------------------------------------------------
2.9 DOCTOR PRACTICE PROFILE, CREDENTIALS & WEEKLY AVAILABILITY (DoctorSettingsTab.tsx)
--------------------------------------------------------------------------------
- Profile Configuration: Medical Specialization, Medical License Registration Number, Hospital Affiliation, 
  Clinic Physical Address, Consultation Fee (INR), Years of Professional Experience, and Bio.
- Availability Slot Management: Configure daily consultation time slots (e.g. ["09:00 AM", "10:30 AM", "11:45 AM", "02:00 PM", "03:30 PM", "05:00 PM"]) 
  that dynamically drive the patient booking engine.


================================================================================
3. SPATIAL MEDICAL PDF EXTRACTION & MULTI-ENGINE OCR PIPELINE
================================================================================

The report extraction engine (fastapi-service/services/extraction/) is an advanced 
7-stage pipeline engineered to process both vector digital PDFs and raster scanned PDFs:

STAGE 1: STRICT PDF INGESTION & INTEGRITY VALIDATION (pdf_ingestion.py):
- Verifies %PDF- magic header bytes in the first 1024 bytes.
- Enforces 25MB file size limit and page count limits (1 to 50 pages).
- Explicitly catches and rejects standalone image formats (JPG, PNG, GIF, WEBP) with friendly errors.

STAGE 2: PER-PAGE CLASSIFICATION (pdf_classifier.py):
- Inspects each page independently to determine processing strategy:
  * DIGITAL_TEXT: Embedded vector text >= 35 characters & >= 8 words (processed via PyMuPDF).
  * SCANNED_IMAGE: Zero/low vector text with raster image streams (processed via Computer Vision + OCR).
  * MIXED: Vector text overlaid on raster graphics.
  * EMPTY: Blank page (skipped).

STAGE 3: DOCUMENT IMAGE PREPROCESSING FOR SCANNED PAGES (image_preprocessor.py & page_renderer.py):
- NOTE: Executed ONLY for scanned/raster pages (SCANNED_IMAGE or MIXED). Digital vector PDFs bypass this stage.
- Renders high-DPI raster images (300 DPI) using PyMuPDF.
- Applies OpenCV (cv2) image operations:
  1. Grayscale Conversion: cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).
  2. Automated Deskewing: Detects orientation angle via cv2.minAreaRect() on non-zero pixels 
     and deskews with cv2.warpAffine().
  3. Denoising: Median filter cv2.medianBlur(gray, 3) removing speckle scan noise.
  4. Adaptive Gaussian Binarization: cv2.adaptiveThreshold() handling uneven illumination/shadows.

STAGE 4: MULTI-ENGINE OCR & SPATIAL BOUNDING BOXES (ocr_engine.py & digital_extractor.py):
- Digital Pages (DIGITAL_TEXT): PyMuPDF page.get_text("words") directly extracts vector glyphs with exact 2D bounding boxes (x0, y0, x1, y1) in <50ms without OCR.
- Scanned Pages (SCANNED_IMAGE): PaddleOCR deep learning OCR extracts text bounding polygons and character probabilities.
  PyTesseract serves as an automatic fallback if PaddleOCR is uninitialized.

STAGE 5: SPATIAL ZONING & READING ORDER SORTING (layout_analyzer.py & spatial_document.py):
- Groups words into horizontal lines by comparing y-midpoints (|y1 - y2| <= 3px).
- Divides the document vertically into functional zones:
  * Header Zone (Top 25%): Scanned for patient demographics, hospital name, ordering doctor, date.
  * Body Zone (Middle 60%): Scanned for test analyte tables and single/multi-line result blocks.
  * Footer Zone (Bottom 15%): Scanned for lab technician signatures, accreditation, report date.

STAGE 6: TAXONOMIC CANDIDATE CLASSIFICATION & TABLE RECONSTRUCTION (candidate_classifier.py & table_reconstructor.py):
- Distinguishes clinical test names from patient IDs, dates, medical guidelines, and section headers using 25+ pre-compiled RegExes.
- Reconstructs tabular columns: [Test Name] | [Observed Value] | [Unit] | [Reference Range] | [Flag].
- Determines status flags automatically (e.g., observed 140 mg/dL with reference 70-99 mg/dL -> "HIGH").

STAGE 7: 3-TIER SEMANTIC ONTOLOGY NORMALIZATION (clinical_ontology.py):
Standardizes noisy, non-uniform lab parameter strings (e.g., "Hb", "Hgb", "Hemoglobin Total", 
"Blood Glucose Fasting", "FBS", "S. Creatinine") into canonical clinical keys:
- Tier 1 (Exact Synonym Hash Map): O(1) lookup in comprehensive clinical dictionary (synonyms.json) across 300+ synonyms.
- Tier 2 (RapidFuzz Token Sort Match): Handles typos and OCR recognition errors (fuzz.token_sort_ratio >= 75%).
- Tier 3 (SentenceTransformers Deep Semantic Vector Embeddings): Generates 384-dimensional dense vectors 
  using all-MiniLM-L6-v2 and computes Cosine Similarity against canonical term vectors (>= 0.65):
  Cosine Similarity = (u . v) / (||u|| * ||v||)

MULTI-FACTOR CONFIDENCE SCORING (validation_engine.py):
Computes extraction confidence for each parameter:
Score = (0.25 * OCR Conf) + (0.35 * Semantic Conf) + (0.25 * Spatial Conf) + (0.15 * Format Conf)


================================================================================
4. MACHINE LEARNING ARCHITECTURE & MULTI-ORGAN DISEASE RISK SUBSYSTEM
================================================================================

--------------------------------------------------------------------------------
4.1 ALGORITHM SELECTION: RANDOM FOREST VS. ALTERNATIVES
--------------------------------------------------------------------------------
MedAssist AI employs sklearn.ensemble.RandomForestClassifier as the primary classification 
engine across all 5 organ disease assessment pipelines.

RATIONALE FOR SELECTING RANDOM FOREST OVER ALTERNATIVES:
1. Random Forest vs. Deep Neural Networks (MLP / ANN):
   - Tabular Clinical Data Structure: Medical tabular data consists of sharp, non-linear 
     physiological boundary thresholds (e.g., Fasting Glucose >= 126 mg/dL indicates diabetes; 
     Serum Creatinine > 1.4 mg/dL indicates renal impairment). Tree-based orthogonal splits 
     natively represent step-function decision boundaries, whereas Neural Networks require extensive 
     hyperparameter tuning and smooth activation approximations that often overfit small-to-medium clinical datasets.
   - Sample Efficiency: Small-to-medium datasets (e.g., UCI Kidney with N=400, Indian Liver with N=583) 
     are highly prone to overfitting in deep neural networks. Random Forest exhibits minimal variance.
2. Random Forest vs. Logistic Regression / Linear Classifiers:
   - Non-Linear Interactions: Clinical disease onset involves multi-feature synergies (e.g., elevated BMI 
     compounded with age and hypertension). Logistic Regression requires manual polynomial feature 
     engineering, whereas decision trees automatically capture feature interactions.
3. Random Forest vs. Single Decision Trees:
   - High Variance Reduction (Bagging): A single decision tree suffers from high variance and sensitivity 
     to training data perturbations. Random Forest constructs an ensemble of B = 200 de-correlated trees, 
     averaging their predictions to drive the variance down:
     Var(X_mean) = rho * sigma^2 + ((1 - rho) / B) * sigma^2
     where rho is the inter-tree correlation (minimized via random feature subspace sampling sqrt(p)) 
     and B is the number of trees.
4. Clinician Transparency & Interpretability (Gini Impurity):
   - Clinicians cannot trust "black-box" models. Random Forest calculates Mean Decrease in Impurity (MDI), 
     providing exact mathematical percentages of feature importance for every biomarker.

HYPERPARAMETER CONFIGURATION ACROSS ALL 5 MODELS:
- n_estimators = 200 (Ensemble of 200 randomized decision trees)
- criterion = 'gini' (Gini Impurity splitting criterion: I_G(p) = 1 - sum(p_i^2))
- max_depth = None (Nodes expanded until all leaves are pure or contain <2 samples)
- min_samples_split = 2
- min_samples_leaf = 1
- max_features = 'sqrt' (sqrt(p) features evaluated per split to de-correlate trees)
- random_state = 42 (Guarantees exact mathematical reproducibility)
- n_jobs = -1 (Parallel execution across all CPU cores)

--------------------------------------------------------------------------------
4.2 CLASS IMBALANCE HANDLING: SYNTHETIC MINORITY OVER-SAMPLING TECHNIQUE (SMOTE)
--------------------------------------------------------------------------------
THE CLINICAL IMBALANCE PROBLEM:
In real-world screening datasets, disease prevalence is heavily skewed:
- In Diabetes screening: 91.5% of records are negative (y=0) and only 8.5% are positive (y=1).
- A naive classifier achieves 91.5% accuracy simply by predicting "Healthy" for every patient.
- In medical diagnostics, a False Negative (FN) (failing to detect disease) is clinically catastrophic, 
  whereas a False Positive (FP) merely prompts confirmatory testing.

MATHEMATICAL MECHANISM OF SMOTE (imblearn.over_sampling.SMOTE):
SMOTE avoids simple random duplication (which causes severe overfitting) by synthesizing realistic samples:
1. For every minority class instance x_i in Minority Class, SMOTE computes its Euclidean 
   distance to all minority samples and identifies its k-nearest neighbors (k=5):
   N_k(x_i) = {x_z1, x_z2, ..., x_zk}
2. It randomly selects a neighbor x_zi in N_k(x_i).
3. It generates a synthetic sample x_new along the vector line segment joining the two points:
   x_new = x_i + lambda * (x_zi - x_i)    where lambda ~ Uniform(0, 1)
4. This synthesizes a continuous convex decision region around positive disease cases, drastically increasing 
   Model Recall and ROC-AUC.

--------------------------------------------------------------------------------
4.3 END-TO-END ML TRAINING & ONLINE INFERENCE PIPELINE ARCHITECTURE
--------------------------------------------------------------------------------

A. OFFLINE TRAINING PHASE (Master Script: python ml/train_all.py):
[Raw CSV Dataset] -> [1. Data Sanitization] -> [2. Stratified 80/20 Split] ->
[3. Isolate Preprocessor Fit on X_train] -> [4. Transform X_train & X_test] ->
[5. SMOTE Oversampling on X_train only] -> [6. Random Forest Training] ->
[7. Serialization to .pkl artifacts]

B. ONLINE REAL-TIME INFERENCE PHASE (FastAPI Microservice):
[User Form / OCR Extracted Report JSON] -> [1. Key Normalization (report_mapper.py)] ->
[2. Median Default Imputation for Omitted Features] -> [3. Single-Row DataFrame Assembly] ->
[4. Preprocessor Transform via preprocessing.pkl] -> [5. Model Predict Proba via random_forest.pkl] ->
[6. Structured JSON Output: prediction, probability %, risk tier]

--------------------------------------------------------------------------------
4.4 ZERO DATA LEAKAGE ENFORCEMENT & TABULAR PREPROCESSING SUITE
--------------------------------------------------------------------------------
Implemented via custom Scikit-Learn BaseEstimator and TransformerMixin classes 
(e.g., DiabetesDataPreprocessor, KidneyDataPreprocessor):

1. Replacement of Infinite Values:
   - Floating-point infinity values (np.inf, -np.inf) are mapped to np.nan for clean downstream imputation:
     df.replace([np.inf, -np.inf], np.nan)

2. String & Tab Trimming:
   - In clinical datasets (notably the UCI Kidney dataset), numeric measurements stored as dirty strings with tabs 
     (e.g. '\t43') are stripped and cast:
     df[col] = pd.to_numeric(df[col].astype(str).str.replace('\t', '').str.strip(), errors='coerce')

3. Identifier & Metadata Column Removal:
   - Non-diagnostic tracking attributes (id, mrn, patient_name) are explicitly dropped.

4. Row Deduplication:
   - Duplicate patient rows are identified and dropped (df.drop_duplicates()) prior to splitting.

5. Missing Value Imputation (Median for Numerics, Mode for Categoricals):
   - Continuous Numerical Imputation (SimpleImputer(strategy='median')): Robust against non-Gaussian outliers.
   - Categorical Imputation (SimpleImputer(strategy='most_frequent')): Statistical mode of the training split.

6. Continuous Feature Standardization (z-Score Scaling via StandardScaler):
   - Shifts numerical features to mean = 0, std_dev = 1, preventing large-scale features from dominating variance splits.

7. Categorical Feature Encoding (OneHotEncoder(handle_unknown='ignore')):
   - Converts categories into binary indicator vectors with out-of-distribution resilience.

8. Zero Data Leakage Enforcement Rules:
   - 80/20 train/test split computed BEFORE fitting any transformers.
   - preprocessor.fit() executed EXCLUSIVELY on X_train.
   - SMOTE applied EXCLUSIVELY to X_train_transformed. X_test remains untouched.

9. Real-Time Live Inference Data Preprocessing (report_mapper.py):
   - Maps variable OCR parameter labels to canonical feature keys and populates unobserved optional biomarkers with training medians.

--------------------------------------------------------------------------------
4.5 DETAILED MULTI-ORGAN MODEL SPECIFICATIONS, FEATURE IMPORTANCES & RESULTS
--------------------------------------------------------------------------------

A. DIABETES RISK ANALYSIS MODEL:
- Dataset: ml/diabetes/dataset/diabetes_prediction_dataset.csv (100k records -> 96,146 clean)
- Raw Features (8): gender, age, hypertension, heart_disease, smoking_history, bmi, HbA1c_level, blood_glucose_level
- Transformed Features (15): 6 numerical scaled + 9 one-hot categorical indicator columns
- Post-SMOTE Training Distribution: 70,130 Negative / 70,130 Positive (Total Train: 140,260)
- Untouched Test Set: 19,230 patient records
- Performance: Accuracy = 95.64%, Precision = 75.19%, Recall = 75.41%, F1 = 75.30%, ROC-AUC = 96.39%
- Confusion Matrix: TN = 17,112, FP = 422, FN = 417, TP = 1,279
- Feature Importances: HbA1c_level (36.95%), blood_glucose_level (27.82%), age (18.13%), bmi (10.74%), smoking (2.38%), hypertension (2.25%), heart_disease (1.26%), gender (0.52%)

B. COMPLETE BLOOD COUNT (CBC ANEMIA) MODEL:
- Dataset: ml/cbc/dataset/diagnosed_cbc_data_v4.csv (1,454 SMOTE balanced samples, 247 test samples)
- Raw Features (14): WBC, LYMp, NEUTp, LYMn, NEUTn, RBC, HGB, HCT, MCV, MCH, MCHC, PLT, PDW, PCT
- Performance: Accuracy = 99.60%, Precision = 99.47%, Recall = 100.00%, F1 = 99.73%, ROC-AUC = 100.00%
- Confusion Matrix: TN = 58, FP = 1, FN = 0, TP = 188
- Feature Importances: HGB (29.41%), HCT (22.18%), RBC (16.74%), MCV (11.05%), MCH/MCHC (9.82%), PLT (5.60%), WBC (5.20%)

C. HEART DISEASE (FRAMINGHAM 10-YEAR CHD) MODEL:
- Dataset: ml/heart/dataset/framingham.csv (4,238 records -> 5,754 post-SMOTE train, 848 test)
- Raw Features (14): male, age, currentSmoker, cigsPerDay, BPMeds, prevalentStroke, prevalentHyp, diabetes, totChol, sysBP, diaBP, BMI, heartRate, glucose
- Performance: Accuracy = 79.25%, Precision = 35.19%, Recall = 21.49%, F1 = 26.67%, ROC-AUC = 64.27%
- Confusion Matrix: TN = 646, FP = 70, FN = 106, TP = 26
- Feature Importances: sysBP & diaBP (32.14%), totChol (24.80%), age (18.52%), BMI (11.20%), glucose (7.15%), smoking (4.19%), heartRate (2.00%)

D. CHRONIC KIDNEY DISEASE (CKD) MODEL:
- Dataset: ml/kidney/dataset/kidney_disease.csv (400 records post-SMOTE train, 80 test)
- Raw Features (24): age, bp, sg, al, su, rbc, pc, pcc, ba, bgr, bu, sc, sod, pot, hemo, pcv, wc, rc, htn, dm, cad, appet, pe, ane
- Performance: Accuracy = 100.00%, Precision = 100.00%, Recall = 100.00%, F1 = 100.00%, ROC-AUC = 100.00%
- Confusion Matrix: TN = 28, FP = 0, FN = 0, TP = 52
- Feature Importances: hemo (24.50%), sc (21.30%), sg (15.80%), al (14.10%), pcv (10.20%), bu (6.90%), dm/htn (4.80%), sod/pot (2.40%)

E. LIVER DISEASE RISK MODEL:
- Dataset: ml/liver/dataset/indian_liver_patient.csv (583 records -> 650 post-SMOTE train, 114 test)
- Raw Features (10): Age, Gender, Total_Bilirubin, Direct_Bilirubin, Alkaline_Phosphotase, ALT, AST, Total_Protiens, Albumin, A/G Ratio
- Performance: Accuracy = 73.68%, Precision = 80.00%, Recall = 83.33%, F1 = 81.63%, ROC-AUC = 77.20%
- Confusion Matrix: TN = 16, FP = 16, FN = 14, TP = 68
- Feature Importances: Total & Direct Bilirubin (26.85%), ALP (22.40%), ALT & AST (21.15%), Albumin & A/G Ratio (15.30%), Total Proteins (8.10%), Age & Gender (6.20%)

--------------------------------------------------------------------------------
4.6 COMPREHENSIVE PERFORMANCE COMPARISON MATRIX
--------------------------------------------------------------------------------

+------------------------+-----------+-----------+---------+----------+---------+
| Organ Disease Model    | Accuracy  | Precision | Recall  | F1-Score | ROC-AUC |
+------------------------+-----------+-----------+---------+----------+---------+
| Diabetes (100k)        | 95.64%    | 75.19%    | 75.41%  | 75.30%   | 96.39%  |
| CBC / Anemia           | 99.60%    | 99.47%    | 100.00% | 99.73%   | 100.00% |
| Heart Disease (CHD)    | 79.25%    | 35.19%    | 21.49%  | 26.67%   | 64.27%  |
| Kidney Disease (CKD)   | 100.00%   | 100.00%   | 100.00% | 100.00%  | 100.00% |
| Liver Disease (ILPD)   | 73.68%    | 80.00%    | 83.33%  | 81.63%   | 77.20%  |
+------------------------+-----------+-----------+---------+----------+---------+


================================================================================
5. CLINICAL DIET & NUTRITION OPTIMIZATION SUBSYSTEM (IFCT 2017 & MILP)
================================================================================

--------------------------------------------------------------------------------
5.1 END-TO-END CLINICAL NUTRITION GENERATION WORKFLOW
--------------------------------------------------------------------------------
1. Patient Profile Ingestion: Extracts patient biometric variables (Age, Gender, Height, Weight, Activity Level).
2. Energy Expenditure Calculation: Computes Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE).
3. Multi-Organ Risk Synthesis: Gathers evaluated probabilities across Diabetes, CBC, Heart, Kidney, and Liver.
4. Conflict Resolution Matrix (conflictResolver.js): Identifies overlapping and conflicting clinical nutrition 
   guidelines and resolves them through strict organ precedence rules.
5. Mixed Integer Linear Programming (MILP) Solver (FastAPI diet_router.py):
   Solves daily optimal food combinations from the IFCT 2017 database across 5 distinct meal slots 
   (Breakfast, Mid-Morning Snack, Lunch, Evening Snack, Dinner).
6. Post-Optimization Safety Audit (safetyValidator.js): Verifies that daily sodium, potassium, phosphorus, saturated fat, 
   and portion sizes strictly obey clinical constraints before saving to PostgreSQL.

--------------------------------------------------------------------------------
5.2 BIOMETRIC ENERGY CALCULATIONS (HARRIS-BENEDICT BMR & TDEE)
--------------------------------------------------------------------------------
Basal Metabolic Rate (BMR) uses the Revised Harris-Benedict Formula:
- Male:   BMR = 88.362 + (13.397 * Weight_kg) + (4.799 * Height_cm) - (5.677 * Age_years)
- Female: BMR = 447.593 + (9.247 * Weight_kg) + (3.098 * Height_cm) - (4.330 * Age_years)

Physical Activity Multipliers for TDEE (Total Daily Energy Expenditure):
- Sedentary (Desk job, minimal movement)          : TDEE = BMR * 1.200
- Lightly Active (Light exercise 1-3 days/week)   : TDEE = BMR * 1.375
- Moderately Active (Moderate exercise 3-5 days) : TDEE = BMR * 1.550
- Very Active (Heavy sports 6-7 days/week)        : TDEE = BMR * 1.725

--------------------------------------------------------------------------------
5.3 MULTI-DISEASE CLINICAL PRECEDENCE & CONFLICT RESOLUTION HIERARCHY
--------------------------------------------------------------------------------
When patients exhibit multiple comorbid conditions, dietary recommendations often clash. 
MedAssist AI implements a strict Clinical Priority Ordering:

LEVEL 1: RENAL / KIDNEY FAILURE SAFETY (TOP PRIORITY):
- Severe renal impairment poses immediate life-threatening risks (e.g., hyperkalemic cardiac arrest, 
  severe metabolic acidosis, vascular calcification).
- Hard Guardrails: Potassium <= 2,000 mg/day, Phosphorus <= 800 mg/day, Sodium <= 2,000 mg/day.
- Protein Restriction: Protein intake capped at 0.6--0.8 g/kg body weight to prevent uremic toxin accumulation.
- Conflict Resolution: Kidney potassium and phosphorus limits OVERRIDE anemia iron promotion 
  (e.g., forbidding high-potassium spinach/beetroot overload and choosing iron-dense low-potassium alternatives).

LEVEL 2: CARDIOVASCULAR & HYPERTENSION GUARDRAILS:
- Sodium ceiling reduced to <= 1,500 mg/day.
- Saturated fat strictly capped at < 7% of total daily energy intake.
- Elimination of high-cholesterol foods and trans fats.

LEVEL 3: DIABETIC GLYCEMIC REGULATION:
- Zero Added/Refined Sugar (Free sugars = 0g).
- High Dietary Fiber Goal (>= 30--35 g/day) with low Glycemic Index (GI) pulses and whole grains.

LEVEL 4: HEMATOLOGY & ANEMIA ENHANCEMENT:
- Dietary Iron target boosted (>= 18--25 mg/day) and Vitamin C boosted (>= 75 mg/day) to enhance iron absorption.

--------------------------------------------------------------------------------
5.4 ORGAN-SPECIFIC CLINICAL DIETARY RULE MODULES & GUARDRAILS
--------------------------------------------------------------------------------
1. Diabetes Module (rules/diabetes.js):
   - Eliminated: Refined sugars, sweets, jaggery, sweetened fruit juices, polished white rice.
   - Promoted: High-fiber legumes (Bengal gram, Moong, Rajma), whole grains (Barley, Oats, Ragi), non-starchy vegetables.
2. Heart Disease Module (rules/heart.js):
   - Eliminated: Hydrogenated vegetable oils (Vanaspati), butter, organ meats, deep-fried snacks.
   - Promoted: Monounsaturated & Polyunsaturated fats (Mustard oil, Sunflower oil), walnuts, flaxseeds, garlic.
3. Kidney Disease Module (rules/kidney.js):
   - Eliminated: High-potassium fruits (Bananas, Oranges, Tender coconut water), high-phosphorus dairy overages.
   - Promoted: Low-potassium vegetables (Bottle gourd / Lauki, Ridge gourd / Turai, Cabbage, White radish).
4. Liver Disease Module (rules/liver.js):
   - Eliminated: Alcohol, saturated fats, spicy oily preparations.
   - Promoted: High biological value easily digestible plant proteins, turmeric, green leafy vegetables.
5. Anemia Module (rules/anemia.js):
   - Promoted: Iron-rich legumes, drumstick leaves (Moringa), amaranth, paired with Vitamin C (Amla, Lemon).

--------------------------------------------------------------------------------
5.5 INDIAN FOOD COMPOSITION TABLES (IFCT 2017) & 16 FOOD GROUPS
--------------------------------------------------------------------------------
The diet engine interfaces with the ICMR-NIN IFCT 2017 database comprising over 500 validated Indian food items 
categorized across 16 authentic food groups:
1. Cereals and Millets (A)          9. Fish and Other Seafood (I)
2. Grain Legumes / Pulses (B)       10. Meat and Poultry (J)
3. Green Leafy Vegetables (C)       11. Milk and Milk Products (K)
4. Other Vegetables (D)             12. Fats and Edible Oils (L)
5. Roots and Tubers (E)             13. Spices and Condiments (M)
6. Condiments and Spices (F)        14. Sugars and Confectionery (N)
7. Nuts and Oilseeds (G)            15. Beverages (Alcoholic / Non-Alc) (O)
8. Fruit Crops (H)                  16. Miscellaneous Foods (P)

--------------------------------------------------------------------------------
5.6 MIXED INTEGER LINEAR PROGRAMMING (MILP) MATHEMATICAL FORMULATION
--------------------------------------------------------------------------------

A. WHY MILP FOR CLINICAL DIET OPTIMIZATION (VS. HEURISTICS / LLMS):
- Mathematical Safety Guarantee: Heuristics and LLMs cannot mathematically guarantee that cumulative daily 
  potassium will remain strictly <= 2000 mg. A single violation in CKD can cause lethal arrhythmia. 
  MILP guarantees that if a feasible solution exists, zero clinical boundaries are violated.
- Exact Cumulative Algebra: Linear constraints accurately sum microgram and milligram contributions across all meals.
- Determinism & Explainability: The optimization problem is completely transparent and reproducible.

B. MATHEMATICAL DECISION VARIABLES:
For candidate foods f in {1, ..., F} and meal slots m in {Breakfast, Mid-Morning, Lunch, Evening Snack, Dinner}:

1. y_{f, m} in {0, 1} [Binary Item Selection Variable]:
   y_{f, m} = 1 if candidate food f is selected in meal slot m, and 0 otherwise.

2. x_{f, m} in [0.0, 3.0] [Continuous Serving Quantity Multiplier]:
   Represents the portion scale factor (relative to 1 standard household serving base_g).
   Actual consumed grams = base_g(f, m) * x_{f, m}.

3. z_f in {0, 1} [Binary Daily Global Selection Variable]:
   z_f = 1 if candidate food f is selected in ANY meal slot during the day, and 0 otherwise.

4. Slack Variables for Multi-Objective Soft Goal Penalties (s >= 0):
   - s_cal_pos, s_cal_neg : Daily caloric overshoot and undershoot deviations.
   - s_prot_neg           : Daily protein deficiency slack.
   - s_fib_neg            : Daily dietary fiber deficiency slack.
   - s_fe_neg             : Daily iron deficiency slack.
   - s_vitc_neg           : Daily Vitamin C deficiency slack.

C. COMPREHENSIVE LINEAR CONSTRAINTS MATRIX:

1. Semi-Continuous / Big-M Linking Bounds:
   0.50 * y_{f, m} <= x_{f, m} <= 2.00 * y_{f, m},   for all f, m
   z_f >= y_{f, m},                                  for all f, m
   sum_m (y_{f, m}) >= z_f,                           for all f

2. Authentic Indian Meal Structure Constraints:
   - Breakfast (m = Breakfast):
     1 <= sum_f (y_{f, breakfast}) <= 3
     sum_{f in Cereals} (y_{f, breakfast}) >= 1
   - Lunch (m = Lunch):
     2 <= sum_f (y_{f, lunch}) <= 4
     sum_{f in Cereals} (y_{f, lunch}) >= 1
     sum_{f in Protein/Dals} (y_{f, lunch}) >= 1
     sum_{f in Vegetables} (y_{f, lunch}) >= 1
   - Dinner (m = Dinner):
     2 <= sum_f (y_{f, dinner}) <= 4
     sum_{f in Cereals} (y_{f, dinner}) >= 1
     sum_{f in Protein/Dals} (y_{f, dinner}) >= 1
   - Snacks (m = MidMorning, EveningSnack):
     1 <= sum_f (y_{f, snack}) <= 2
     sum_{f in Fruits/Nuts} (y_{f, snack}) >= 1

3. Total Daily Caloric Energy Balance & Feasibility Limits:
   sum_{f, m} (Calories_f * x_{f, m}) + s_cal_neg - s_cal_pos = TargetCalories
   0.70 * TargetCalories <= sum_{f, m} (Calories_f * x_{f, m}) <= 1.30 * TargetCalories

4. Macronutrient Adequacy & Safety Constraints:
   - Protein Balance:
     sum_{f, m} (Protein_f * x_{f, m}) + s_prot_neg >= minDailyProteinGrams
     sum_{f, m} (Protein_f * x_{f, m}) <= maxDailyProteinGrams
   - Dietary Fiber Goal:
     sum_{f, m} (Fiber_f * x_{f, m}) + s_fib_neg >= minDailyFiberGrams
   - Saturated Fat Ceiling (< 7-8% of total calories):
     sum_{f, m} (SatFat_f * x_{f, m}) <= (TargetCalories * (maxSatFat% / 100)) / 9.0
   - Free / Added Sugars Limit:
     sum_{f, m} (Sugar_f * x_{f, m}) <= maxDailyFreeSugarsGrams

5. Strict Clinical Micronutrient Safety Ceilings (Hard Guardrails):
   - Sodium Limit (Hypertension, CVD, CKD):
     sum_{f, m} (Sodium_f * x_{f, m}) <= maxSodiumDailyMg
   - Potassium Ceiling (Renal Hyperkalemia Prevention):
     sum_{f, m} (Potassium_f * x_{f, m}) <= maxPotassiumDailyMg
   - Phosphorus Ceiling (Renal Vascular Calcification Prevention):
     sum_{f, m} (Phosphorus_f * x_{f, m}) <= maxPhosphorusDailyMg
   - Iron Target (Anemia & Hematology):
     sum_{f, m} (Iron_f * x_{f, m}) + s_fe_neg >= minIronDailyMg
   - Vitamin C Target:
     sum_{f, m} (VitC_f * x_{f, m}) + s_vitc_neg >= minVitaminCDailyMg

6. Intra-Day Anti-Repetition Constraints:
   sum_m (y_{f, m}) <= 1,   for all f not in {Beverages, Cooking Oils}

D. MULTI-OBJECTIVE OPTIMIZATION FUNCTION (Z):
Minimize Z = 
    w_cal_dev * (s_cal_pos + s_cal_neg) 
  + w_prot_def * s_prot_neg 
  + w_fib_def * s_fib_neg 
  + w_fe_def * s_fe_neg 
  + w_vitc_def * s_vitc_neg
  + sum_{f, m} [ w_na * Sodium_f * x_{f, m} + w_satfat * SatFat_f * x_{f, m} + w_sugar * Sugar_f * x_{f, m} ]
  - sum_{f, m} [ w_fib_boost * Fiber_f * x_{f, m} + w_prot_boost * Protein_f * x_{f, m} + w_fe_boost * Iron_f * x_{f, m} + w_vitc_boost * VitC_f * x_{f, m} ]
  - sum_{f, m} [ w_pref * PreferenceScore_f * y_{f, m} ]
  + sum_f [ w_repeat * PastWeeklyUses(f) * z_f ]

Configured Objective Weights:
- Caloric precision weight (w_cal_dev)         : 2.0
- Protein deficit penalty (w_prot_def)          : 15.0
- Dietary fiber deficit penalty (w_fib_def)     : 10.0
- Iron deficit penalty (w_fe_def)               : 8.0
- Vitamin C deficit penalty (w_vitc_def)        : 5.0
- Sodium penalty per mg (w_na)                  : 0.005
- Saturated fat penalty per gram (w_satfat)     : 0.8
- Free sugar penalty per gram (w_sugar)         : 0.6
- Fiber reward per gram (w_fib_boost)           : 1.5
- Protein reward per gram (w_prot_boost)        : 0.8
- Iron reward per mg (w_fe_boost)               : 0.5
- Vitamin C reward per mg (w_vitc_boost)        : 0.2
- Regional & clinical preference bonus (w_pref) : 12.0
- Weekly repetition penalty (w_repeat)          : 8.0

E. BRANCH-AND-CUT SOLVER EXECUTION & PERFORMANCE:
- Solver Engine: PuLP Coin-OR CBC (Branch and Cut) with automatic fallback to SciPy HiGHS.
- Search Strategy: Solves continuous LP relaxation via primal/dual simplex, generates Gomory cutting planes 
  to tighten fractional bounds, and executes binary branch-and-bound search.
- Relative Gap Tolerance: 8% optimality gap limit ensures rapid clinical convergence.
- Execution Speed: Average solve time per day is 80--220 ms. Complete 7-day multi-meal optimization executes 
  in 1.2--2.0 seconds.

--------------------------------------------------------------------------------
5.7 MULTI-DAY VARIETY ENFORCEMENT, REGIONAL CUISINES & ALLERGEN FILTRATION
--------------------------------------------------------------------------------
1. 7-Day Variety & Anti-Fatigue Mechanism:
   - Dynamic Penalty Scaling: Every time food item f is selected on day d, PastWeeklyUses(f) increments by 1. 
     In subsequent days d+1 .. 7, the objective penalty w_repeat * PastWeeklyUses(f) * z_f increases linearly, 
     forcing the solver to choose alternative nutrient-equivalent grains, pulses, and vegetables.
   - Pulse Cycling: Alternates across Moong, Chana, Toor, Rajma, Chickpeas, and Urad.
   - Vegetable Cycling: Alternates across gourd family (Lauki, Ridge gourd), leafy greens (Methi, Spinach), 
     and cruciferous vegetables (Cauliflower, Cabbage).

2. Supported Diet Types:
   - Vegetarian: Strictly plant-based foods, dairy (milk, curd, paneer), grains, pulses, vegetables, and fruits.
   - Eggetarian: Vegetarian food items + whole eggs and egg-white dishes.
   - Non-Vegetarian: Vegetarian + Eggs + Poultry (chicken), Fish/Seafood, and Meats.

3. Regional Indian Cuisine Profiles:
   - North Indian: Roti, Paratha (oil-controlled), Dal Makhani (low-fat), Rajma, Paneer Bhurji, Khichdi.
   - South Indian: Idli with Sambar, Dosa (multigrain), Upma, Lemon Rice, Ragi Mudde, Rasam, Buttermilk.
   - East Indian: Machher Jhol (steamed fish curry for non-veg), Dalma, Khichuri, Steamed vegetables.
   - West Indian: Thepla, Dhokla (steamed), Poha, Dal Baati (portion-controlled), Kadhi, Moong Khichdi.
   - Pan-Indian (All): Balanced combination of all Indian regional staples.

4. Allergen Protection:
   - Zero-tolerance filtering across 10 major allergen classes (Peanuts, Tree nuts, Dairy, Gluten, Eggs, Fish, 
     Shellfish, Soy, Sesame, Mustard) matching both English and regional vernacular names (e.g., groundnut/mungphali/singdana, 
     atta/maida/suji/godhumai, dahi/paneer/chhena/paalu).

--------------------------------------------------------------------------------
5.8 POST-OPTIMIZATION CLINICAL SAFETY VALIDATOR & VERIFICATION PIPELINE
--------------------------------------------------------------------------------
Before any plan is committed to the database or rendered on the patient interface, it passes through 
a secondary deterministic audit (safetyValidator.js):
1. Allergen Leak Check: Verifies that no item in the final 7-day plan contains substrings or group tags of flagged allergies.
2. Clinical Boundary Audit: Verifies that total daily sodium, potassium, and phosphorus strictly obey organ ceilings.
3. Portion Sanity Verification: Asserts all portion multipliers fall strictly within the [0.5, 2.0] standard range.
4. Nutrition Completeness Audit: Asserts all 5 meal slots have valid items and caloric balance conforms to target bounds.


================================================================================
6. HIGH-LEVEL SYSTEM ARCHITECTURE, CORE BACKEND & DATABASE DESIGN
================================================================================

--------------------------------------------------------------------------------
6.1 DECOUPLED 3-TIER SYSTEM ARCHITECTURE DIAGRAM
--------------------------------------------------------------------------------

+-----------------------------------------------------------------------------+
|                               TIER 1: FRONTEND                              |
|   React 19 + TypeScript + Vite + Tailwind CSS v4 + Recharts + Radix UI      |
|   • Patient Portal: Vitals, Reports, Multi-Organ Risks, IFCT Diet Planner   |
|   • Doctor Portal: Practice KPIs, Patient Roster, 360 Dossier, Triage Flags |
|   • Telehealth & Scheduling: Doctor Search, Slot Booking, Razorpay Gateway  |
|   • Consultation Suite: Video Telehealth, Consultation Notes, Prescriptions |
|   • Secure Messaging: Role-Restricted Doctor <-> Patient Real-Time Chat     |
+--------------------------------------┬--------------------------------------+
                                       | HTTP / REST (JWT Auth)
                                       v
+-----------------------------------------------------------------------------+
|                         TIER 2: CORE EXPRESS BACKEND                        |
|             Node.js + Express.js 5 + PostgreSQL (Port 5000)                 |
|   • Authentication & RBAC: (JWT, bcryptjs, Patient & Doctor Roles)          |
|   • User Profiles & Medical Records Management (Vitals, Trends, Reports)    |
|   • Doctor Workstation Controller: (Stats, Patient Roster, Alerts Triage)   |
|   • Appointment Scheduling Engine: (Slots Query, Razorpay Mock, Telehealth) |
|   • Role-Authorized Messaging Controller: (Strict Relational Verification)  |
|   • Prescription Controller: (Upload, Structured Meds JSONB, PDF Download)  |
|   • Master Diet Engine & Multi-Disease Conflict Resolver                    |
|   • In-App Notification Dispatcher (Appointments, Alerts, Messages, Rx)     |
|   • Relational Database: (PostgreSQL with Pool Connection & Indexing)       |
+--------------------------------------┬--------------------------------------+
                                       | Internal HTTP REST Calls
                                       v
+-----------------------------------------------------------------------------+
|                     TIER 3: FASTAPI ML & OCR MICROSERVICE                   |
|                   Python 3.10+ + Uvicorn (Port 8000)                        |
|   • Strict PDF Ingestion & Page Classifier: (Digital vs. Scanned)           |
|   • OpenCV Preprocessing & Multi-Engine OCR: (PyMuPDF, PaddleOCR, Tesseract)|
|   • 3-Tier Semantic Normalization: (Synonym Map -> RapidFuzz -> Vectors)    |
|   • 5x Random Forest ML Predictors: (Diabetes, CBC, Heart, Kidney, Liver)   |
|   • IFCT 2017 Clinical Nutrition Optimization Engine: (MILP Bridge)         |
+-----------------------------------------------------------------------------+

--------------------------------------------------------------------------------
6.2 FRONTEND ARCHITECTURE & DESIGN SYSTEM (React 19 + TypeScript + Vite)
--------------------------------------------------------------------------------
- Framework: React 19 with Concurrent Mode and React Server-compatible components.
- Language: TypeScript 6.0 with strict type definitions across API contracts, laboratory models, and appointments.
- Bundler: Vite 8 providing lightning-fast HMR and optimized ES-module production builds.
- Design Tokens: Tailwind CSS v4 with custom tokens (mist, ink, teal, clinical badges, glassmorphism).
- UI Primitives: Radix UI primitives (Dialog, Tabs, Progress, Select, Tooltip, Avatar, Accordion).
- Data Visualizations: Recharts library rendering high-performance area, line, and gauge charts.

--------------------------------------------------------------------------------
6.3 CORE EXPRESS BACKEND ARCHITECTURE & SECURITY MIDDLEWARE (Node.js + Express 5)
--------------------------------------------------------------------------------
- Authentication: JWT tokens with configurable expiration, validated on every secured route.
- Password Security: Salted bcryptjs password hashing with salt rounds = 10.
- Role-Based Access Control (RBAC): auth.middleware.js enforcing strict Patient and Doctor boundaries.
- Upload Pipeline: Multer upload middleware enforcing PDF magic header and mimetype checks.
- Scalable Data Layer: Connection pooling via pg against PostgreSQL with parameterized queries preventing SQL injection.

--------------------------------------------------------------------------------
6.4 COMPLETE RELATIONAL DATABASE SCHEMA (PostgreSQL)
--------------------------------------------------------------------------------
1. users: id (UUID PK), name, email (UNIQUE), password_hash, role ('patient'/'doctor'), 
   patient_id (VARCHAR UNIQUE), doctor_id (VARCHAR UNIQUE), assigned_doctor_id, phone, age, gender, 
   blood_group, height_cm, weight_kg, photo_url, smoking_habit, activity_level, dietary_preference, 
   allergies (JSONB), existing_conditions (JSONB), specialization, clinic_address, consultation_fee, 
   experience_years, bio, availability (JSONB), created_at, updated_at.
2. user_settings: id (UUID PK), user_id (FK -> users), theme, notifications_enabled, email_alerts, language, data_sharing, updated_at.
3. medical_reports: id (UUID PK), user_id (FK -> users), patient_name, age, gender, report_date, hospital, doctor, 
   type, summary, key_findings (JSONB), file_type ('PDF'/'MANUAL'), file_url, source, extracted_text, original_filename, created_at.
4. vital_readings: id (UUID PK), user_id (FK -> users), report_id (FK -> medical_reports), label, value, unit, status, reference_range, source, raw_value, recorded_at.
5. disease_risks: id (UUID PK), user_id (FK -> users), name, percentage, status ('Low'/'Moderate'/'High'), explanation, suggestions (JSONB), assessed_at.
6. trend_metrics & trend_points: Metric definitions and longitudinal historical point values.
7. diet_preferences & diet_plans: Clinical preferences, target overrides, and generated 7-day IFCT plans.
8. patient_alerts: id (UUID PK), alert_id, patient_id, user_id, doctor_id, report_id, disease, risk_level ('HIGH'), risk_probability, status ('NEW'/'REVIEWED'/'RESOLVED'), created_at, reviewed_at, reviewed_by.
9. doctor_patients: id (UUID PK), doctor_id (FK -> users), patient_id (FK -> users), status ('active'/'inactive'), reason, added_at, updated_at.
10. appointments: id (UUID PK), appointment_number (UNIQUE), doctor_id, patient_id, appointment_date, appointment_time, appointment_type ('online'/'offline'), reason, fee, payment_status, appointment_status, meeting_status, meeting_started_at, meeting_ended_at, meeting_duration_seconds, started_by_doctor_id, consultation_notes (JSONB), meeting_link, clinic_address, doctor_notes, created_at, updated_at.
11. payments: id (UUID PK), appointment_id, patient_id, amount, payment_provider ('razorpay'), payment_reference, payment_status, payment_method, created_at.
12. messages: id (UUID PK), sender_id (FK -> users), receiver_id (FK -> users), appointment_id, message, is_read, created_at.
13. prescriptions: id (UUID PK), prescription_number (UNIQUE), doctor_id, patient_id, appointment_id, file_name, file_path, file_size, diagnosis, instructions, medications (JSONB), uploaded_at.
14. notifications: id (UUID PK), user_id (FK -> users), title, message, type, link, is_read, created_at.

--------------------------------------------------------------------------------
6.5 BACKEND REST API ENDPOINTS MATRIX
--------------------------------------------------------------------------------
- /api/auth/register, /api/auth/login, /api/auth/me
- /api/reports/upload (PDF Ingestion), /api/reports/manual (Manual Vitals Entry), /api/reports/my
- /api/doctor/stats, /api/doctor/patients, /api/doctor/patient/:patientId, /api/doctor/alerts, /api/doctor/alerts/:id/review
- /api/appointments/doctors, /api/appointments/doctors/:id, /api/appointments/book, /api/appointments/my, /api/appointments/:id/status
- /api/messages/conversations, /api/messages/:otherUserId (GET thread, POST send), /api/messages/read/:otherUserId
- /api/prescriptions/upload, /api/prescriptions/my, /api/prescriptions/patient/:id, /api/prescriptions/download/:id
- /api/diet/profile, /api/diet/plan/current, /api/diet/plan/generate

--------------------------------------------------------------------------------
6.6 FASTAPI AI/ML MICROSERVICE ROUTERS
--------------------------------------------------------------------------------
- POST /parse-report                  : Spatial OCR & candidate table extraction
- POST /api/ml/diabetes/predict       : Random Forest Diabetes evaluation
- POST /api/ml/cbc/predict            : Random Forest CBC / Anemia evaluation
- POST /api/ml/heart/predict          : Random Forest Framingham CHD evaluation
- POST /api/ml/kidney/predict         : Random Forest Chronic Kidney Disease evaluation
- POST /api/ml/liver/predict          : Random Forest Liver Disease evaluation
- POST /api/v1/diet/optimize          : MILP IFCT 2017 meal optimization engine
- GET  /health                        : Service & model health monitor


================================================================================
7. COMPLETE LIST OF DATASETS USED
================================================================================

1. Diabetes Prediction Dataset:
   - Source: Kaggle / Healthcare Database
   - Size: 100,000 patient records (96,146 after deduplication)
   - Features: 8 clinical parameters (HbA1c, Blood Glucose, BMI, Age, Smoking, Hypertension, Heart Disease, Gender)
2. Complete Blood Count (CBC) Dataset v4:
   - Source: Diagnosed Hematology Clinical Study Dataset
   - Size: 1,454 samples (SMOTE balanced)
   - Features: 14 blood parameters (WBC, RBC, HGB, HCT, MCV, MCH, MCHC, PLT, etc.)
3. Framingham 10-Year CHD Heart Disease Dataset:
   - Source: Framingham Cardiovascular Longitudinal Study
   - Size: 4,238 patient records (5,754 training samples post-SMOTE)
   - Features: 14 cardiovascular & lifestyle parameters (Blood Pressure, Cholesterol, Cigarettes/day, etc.)
4. UCI Chronic Kidney Disease (CKD) Dataset:
   - Source: UCI Machine Learning Repository
   - Size: 400 patient records (400 training samples post-SMOTE)
   - Features: 24 renal, metabolic, and urinary parameters (Serum Creatinine, Blood Urea, Specific Gravity, etc.)
5. Indian Liver Patient Dataset (ILPD):
   - Source: UCI Machine Learning Repository / Indian Clinical Records
   - Size: 583 patient records (650 training samples post-SMOTE)
   - Features: 10 hepatic enzyme and protein parameters (Bilirubin, ALT, AST, Albumin, A/G Ratio)
6. Indian Food Composition Tables (IFCT 2017):
   - Source: ICMR-National Institute of Nutrition (NIN), Hyderabad, India
   - Scope: Comprehensive nutritional breakdown of hundreds of raw and cooked Indian food items across 16 food groups.


================================================================================
8. FREQUENTLY ASKED GUIDE / EXAMINER VIVA VOCE QUESTIONS & ANSWERS
================================================================================

Q1: How does the Patient Portal empower patients and what key features are included?
A1: The Patient Portal provides an end-to-end healthcare dashboard:
    1. Composite Health Score (computeHealthMetrics) combining 5-organ ML risk predictions, out-of-range lab vitals, BMI, and lifestyle habits.
    2. Medical Reports Archive with embedded PDF viewer and structured parameter tables with status chips (NORMAL, HIGH, LOW).
    3. Longitudinal Biomarker Trends with healthy reference range overlays.
    4. 5-Organ Disease Risk Center with circular risk gauges, feature drivers, and clinical recommendations.
    5. IFCT 2017 Diet Planner with 7-day meal schedules, macro/micronutrient tracking, regional Indian cuisine selection, and allergen filters.
    6. Telehealth Appointment Scheduling with doctor discovery, dynamic time slots, Razorpay mock payment, and online video consultation room.
    7. Role-Restricted Messaging with consulting physicians and Digital Prescription archive with verified streaming PDF downloads.

Q2: How does the Doctor Portal triage abnormal patient biomarkers and manage the patient care roster?
A2: The Doctor Workstation (`DoctorDashboardPage.tsx`) implements an automated clinical alert triage pipeline:
    1. Abnormal lab values (e.g. Glucose > 200 mg/dL, Creatinine > 1.5 mg/dL) automatically create entries in `patient_alerts` linked to the doctor.
    2. The Overview tab displays high-priority triage alerts, allowing doctors to review the patient's 360-degree dossier and mark alerts as REVIEWED with an audit timestamp.
    3. Doctors can add patients to their active care roster via `AddPatientModal.tsx` by entering the patient's unique code or email, establishing an active `doctor_patients` relationship.

Q3: What specific preprocessing operations are performed on tabular clinical data before feeding it to the Random Forest models?
A3: Tabular data undergoes a 5-step preprocessing pipeline:
    1. Sanitization: Conversion of infinite values (np.inf) to np.nan, dirty tab stripping (\t) on numeric strings, 
       identifier removal (id, mrn), and deduplication (df.drop_duplicates()).
    2. Missing Value Imputation: Training median imputation for continuous numerical features (impervious to clinical outliers) 
       and training mode imputation for categorical features.
    3. Feature Standardization: z-score scaling via StandardScaler() so high-magnitude readings do not dominate smaller-magnitude features.
    4. Categorical Encoding: One-Hot Encoding (OneHotEncoder(handle_unknown='ignore')) converting non-numeric text into binary indicator columns.
    5. Class Balancing: SMOTE oversampling applied strictly to the training split.

Q4: How does your system prevent Data Leakage during ML training?
A4: We split raw sanitized data into an 80% train and 20% test split before any preprocessing. The ColumnTransformer 
    (StandardScaler, SimpleImputer, OneHotEncoder) is .fit() EXCLUSIVELY on X_train. SMOTE class balancing is 
    applied ONLY to the training set. The test set remains completely untouched and is transformed using the frozen 
    preprocessor.

Q5: Why did you choose Random Forest over Deep Learning (e.g., Neural Networks) for disease prediction?
A5: Tabular clinical data exhibits complex non-linear boundary cutoffs rather than continuous spatial hierarchies. 
    Random Forest outperforms Neural Networks on small-to-medium clinical tabular datasets, requires no extensive 
    hyperparameter tuning, provides built-in Gini feature importance for medical explainability, and does not overfit 
    when combined with bootstrap aggregation (bagging).

Q6: How does the OCR pipeline extract lab parameters from scanned and digital PDFs?
A6: It uses an advanced 7-stage pipeline:
    1. Strict PDF binary validation and per-page classification (Digital vs. Scanned vs. Mixed).
    2. OpenCV image preprocessing for scanned pages (300 DPI rendering, deskewing via minAreaRect, medianBlur denoising, adaptive thresholding).
    3. Spatial extraction via PyMuPDF (digital) or PaddleOCR / Tesseract (scanned).
    4. Vertical spatial zoning into Header, Body, and Footer zones.
    5. 25+ RegEx candidate classification and column table reconstruction.
    6. 3-tier semantic ontology normalization (Exact Synonym Map -> RapidFuzz Token Sort -> SentenceTransformers dense embeddings).

Q7: Why is Mixed Integer Linear Programming (MILP) used for diet plan generation instead of Large Language Models (LLMs) or Greedy Heuristics?
A7: Clinical dietary management requires hard mathematical safety guarantees. LLMs suffer from probabilistic hallucinations, 
    cannot guarantee that micronutrient totals will stay strictly below critical clinical boundaries (such as potassium < 2000 mg 
    in Stage 4 CKD to prevent fatal cardiac arrhythmias), and cannot reliably calculate exact cumulative multi-meal portion algebra. 
    Greedy heuristics make locally optimal choices that get trapped in infeasible solutions. MILP formulates the exact clinical bounds 
    as mathematical inequalities and solves them to global optimality using the Branch-and-Cut algorithm in under 250 milliseconds.

Q8: How does the diet recommendation engine resolve conflicting guidelines for multi-disease patients?
A8: The engine implements a strict Clinical Precedence Hierarchy:
    - Renal/Kidney Safety takes top precedence (capping potassium < 2000mg, phosphorus < 800mg, sodium < 2000mg, and protein at 0.6-0.8 g/kg).
    - Cardiovascular and Diabetes rules follow (eliminating free sugars, capping saturated fats < 7%, and requiring fiber > 30g).
    - It ensures that restrictions for vital organs (e.g. avoiding hyperkalemic cardiac arrest in CKD) override minor nutrient enhancements.

Q9: How does the MILP model handle discrete food item choices alongside continuous portion sizes?
A9: The model utilizes two coupled decision variables:
    1. A binary decision variable y_{f, m} in {0, 1} indicating whether food item f is selected in meal slot m.
    2. A continuous portion multiplier x_{f, m} in [0.0, 3.0] representing the serving fraction.
    These are coupled using Big-M semi-continuous linking constraints: 0.50 * y_{f, m} <= x_{f, m} <= 2.00 * y_{f, m}. 
    This guarantees that unselected foods have an exact 0 portion size, while selected foods are strictly allocated 
    realistic, consumable household portion sizes (0.5 to 2.0 standard servings).

Q10: How does the system balance conflicting nutrient targets (e.g. Anemia iron promotion vs. CKD potassium/phosphorus caps) in the MILP solver?
A10: The system uses a two-stage approach:
     1. In the constraint matrix, critical organ safety limits (such as potassium and phosphorus in renal disease) are enforced 
        as HARD linear inequalities (e.g. sum(K_f * x_f) <= 2000 mg) that the solver is never permitted to violate.
     2. Nutritional promotions (such as iron for anemia or dietary fiber for diabetes) are formulated as SOFT goals with continuous 
        deficiency slack variables (s_fe_neg) penalized in the multi-objective cost function Z. 
        This allows the solver to maximize iron intake within the strictly inviolable renal potassium and phosphorus boundaries.

Q11: How is the end-to-end appointment booking and payment workflow architected between patients and doctors?
A11: The appointment scheduling architecture consists of 5 integrated stages:
     1. Doctor Discovery: Patients browse verified physicians (`GET /api/appointments/doctors`), viewing specialization, 
        consultation fee, hospital affiliation, experience, and profile bio.
     2. Real-Time Slot Query: On date selection, the client queries `GET /api/appointments/doctors/:doctorId?date=YYYY-MM-DD`. 
        The server computes booked slots from the `appointments` table and returns available time slots, preventing double booking.
     3. Mode Selection: Patients select either Online Telehealth (which generates a secure video room URL `/consultation/:apptNumber`) 
        or Offline In-Clinic Visit (which provides the doctor's physical clinic address).
     4. Razorpay Payment Gateway: The patient confirms the booking via `RazorpayPaymentModal.tsx` (supporting Card, UPI, 
        and Netbanking). On confirmation, the server writes a transaction record into `payments` (`payment_status = 'successful'`), 
        sets appointment status to 'confirmed', and creates mutual in-app notifications.
     5. Tele-Consultation & Clinical Notes: During the consultation, doctors use the virtual room controls, record structured 
        consultation notes (`ConsultationNotesModal.tsx`), and update the appointment lifecycle to 'completed'.

Q12: How does MedAssist AI guarantee privacy and authorization in patient-doctor messaging?
A12: MedAssist AI implements a strict relational authorization middleware (`verifyDoctorPatientRelationship` in `message.controller.js`):
     1. Blocked Peer Communication: Patient-to-patient messaging and doctor-to-doctor messaging are strictly rejected by the server (HTTP 403).
     2. Verified Clinical Relationship: A patient can communicate only with a registered doctor, and vice versa, if and only if an established 
        care relationship exists (verified via an active record in `doctor_patients`, an existing booked appointment in `appointments`, 
        or a primary `assigned_doctor_id` link).
     3. Security & Traceability: Messages are stored in the PostgreSQL `messages` table with sender and receiver IDs, optional appointment 
        context (`appointment_id`), timestamp, and read status boolean (`is_read`).
     4. Real-Time Experience: When a message is sent, the server dispatches an in-app notification to the recipient with a preview 
        and deep link to the conversation thread.

Q13: How are digital prescriptions generated, validated, and securely distributed in the platform?
A13: Digital prescriptions follow a secure, authenticated lifecycle:
     1. Doctor Upload & Formulation: In `UploadPrescriptionModal.tsx`, authorized clinicians upload an official prescription PDF file 
        and enter structured clinical metadata (Diagnosis, General Instructions, and an itemized JSON array of medications including 
        Medicine Name, Dosage, Frequency, Duration, and Special Instructions).
     2. Unique Tracking: The backend generates an incremental unique tracking code (e.g. `RX1025`) and stores the record in `prescriptions`.
     3. Automatic Appointment Completion: If linked to an appointment, the system automatically marks `appointments.appointment_status = 'completed'` 
        and notifies the patient.
     4. Patient Access & Streaming Download: Patients can view all issued prescriptions in `PrescriptionsPage.tsx`, preview structured 
        medications in `PrescriptionViewModal.tsx`, and initiate authenticated streaming downloads (`GET /api/prescriptions/download/:id`), 
        which enforces strict JWT user verification ensuring only the prescribing doctor and target patient can access the physical PDF.

Q14: What regional Indian cuisines, diet types, and variety mechanisms does the diet planner support?
A14: It supports:
     1. 3 Diet Types: Vegetarian, Eggetarian, and Non-Vegetarian.
     2. 5 Regional Indian Cuisines: North Indian, South Indian, East Indian, West Indian, and Pan-Indian (All).
     3. 7-Day Anti-Fatigue Variety Mechanism: Dynamic penalty scaling increments past usage penalties w_repeat * PastWeeklyUses(f) * z_f, 
        forcing pulse and vegetable cycling across Moong, Chana, Toor, Rajma, Lauki, Methi, and Cabbage.
     4. 10-Class Allergen Protection: Filters allergens across English and regional Indian vernacular names (e.g. groundnut/mungphali/singdana, 
        atta/maida/suji/godhumai, dahi/paneer/chhena/paalu).

================================================================================
                              END OF SPECIFICATION FILE
================================================================================
"""

def generate_markdown(txt_content):
    lines = txt_content.split("\n")
    md_lines = []
    
    in_code_block = False
    
    for line in lines:
        if line.startswith("===") or line.startswith("---"):
            continue
        if line.strip() == "":
            md_lines.append("")
            continue
            
        if re.match(r'^\d+\.\s+[A-Z\s\(\)\/\-\+]+$', line.strip()):
            md_lines.append(f"## {line.strip()}")
        elif re.match(r'^\d+\.\d+\s+[A-Z\s\(\)\/\-\+]+:', line.strip()) or re.match(r'^\d+\.\d+\s+[A-Z\s\(\)\/\-\+]+$', line.strip()):
            md_lines.append(f"### {line.strip()}")
        elif re.match(r'^\d+\.\d+\.\d+\s+', line.strip()):
            md_lines.append(f"#### {line.strip()}")
        elif re.match(r'^[A-Z\s\(\)\/\-\+]{4,}:$', line.strip()):
            md_lines.append(f"### {line.strip()[:-1]}")
        elif line.startswith("Q") and re.match(r'^Q\d+:', line):
            md_lines.append(f"**{line}**")
        elif line.startswith("A") and re.match(r'^A\d+:', line):
            md_lines.append(f"> {line}")
        elif line.startswith("+---") or line.startswith("|"):
            if not in_code_block:
                md_lines.append("```text")
                in_code_block = True
            md_lines.append(line)
        else:
            if in_code_block and not (line.startswith("+---") or line.startswith("|")):
                md_lines.append("```")
                in_code_block = False
            md_lines.append(line)
            
    if in_code_block:
        md_lines.append("```")
        
    md_content = "\n".join(md_lines)
    return md_content

def generate_docx(txt_content, docx_path):
    doc = Document()
    
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        
    title_p = doc.add_paragraph()
    title_run = title_p.add_run("MedAssist AI — Comprehensive Project Specification\nPatient Portal, Doctor Portal, OCR, ML Risk & Diet Planner")
    title_run.bold = True
    title_run.font.size = Pt(18)
    title_run.font.color.rgb = RGBColor(14, 116, 144)
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    sub_p = doc.add_paragraph()
    sub_run = sub_p.add_run("Version 3.5 | Core Functional Pillars & Complete Viva Voce Guide")
    sub_run.font.size = Pt(11)
    sub_run.font.italic = True
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.add_paragraph()
    
    lines = txt_content.split("\n")
    in_ascii_table = False
    ascii_table_lines = []
    
    for line in lines:
        s = line.strip()
        if s.startswith("===") or s.startswith("---"):
            continue
            
        if s == "":
            if in_ascii_table:
                p = doc.add_paragraph()
                p_format = p.paragraph_format
                p_format.left_indent = Inches(0.2)
                run = p.add_run("\n".join(ascii_table_lines))
                run.font.name = "Consolas"
                run.font.size = Pt(8.5)
                ascii_table_lines = []
                in_ascii_table = False
            doc.add_paragraph()
            continue
            
        if s.startswith("+---") or (s.startswith("|") and not in_ascii_table and ("|" in s[1:])):
            in_ascii_table = True
            ascii_table_lines.append(line)
            continue
        elif in_ascii_table:
            if s.startswith("+---") or s.startswith("|") or ("|" in s) or s.startswith("v") or s.startswith("+"):
                ascii_table_lines.append(line)
                continue
            else:
                p = doc.add_paragraph()
                p_format = p.paragraph_format
                p_format.left_indent = Inches(0.2)
                run = p.add_run("\n".join(ascii_table_lines))
                run.font.name = "Consolas"
                run.font.size = Pt(8.5)
                ascii_table_lines = []
                in_ascii_table = False
                
        if re.match(r'^\d+\.\s+[A-Z\s\(\)\/\-\+]+$', s):
            h = doc.add_heading(level=1)
            run = h.add_run(s)
            run.font.size = Pt(14)
            run.bold = True
            run.font.color.rgb = RGBColor(15, 23, 42)
        elif re.match(r'^\d+\.\d+\s+[A-Z\s\(\)\/\-\+]+:', s) or re.match(r'^\d+\.\d+\s+[A-Z\s\(\)\/\-\+]+$', s):
            h = doc.add_heading(level=2)
            run = h.add_run(s)
            run.font.size = Pt(12)
            run.bold = True
            run.font.color.rgb = RGBColor(14, 116, 144)
        elif re.match(r'^\d+\.\d+\.\d+\s+', s):
            h = doc.add_heading(level=3)
            run = h.add_run(s)
            run.font.size = Pt(11)
            run.bold = True
            run.font.color.rgb = RGBColor(51, 65, 85)
        elif s.startswith("Q") and re.match(r'^Q\d+:', s):
            p = doc.add_paragraph()
            run = p.add_run(s)
            run.bold = True
            run.font.color.rgb = RGBColor(15, 23, 42)
            run.font.size = Pt(10.5)
        elif s.startswith("A") and re.match(r'^A\d+:', s):
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.2)
            run = p.add_run(s)
            run.font.size = Pt(10)
            run.font.color.rgb = RGBColor(51, 65, 85)
        elif s.startswith("- ") or s.startswith("* "):
            p = doc.add_paragraph(style='List Bullet')
            run = p.add_run(s[2:])
            run.font.size = Pt(10)
        elif re.match(r'^\d+\.\s+', s) and not re.match(r'^\d+\.\s+[A-Z\s]{4,}$', s):
            p = doc.add_paragraph(style='List Number')
            run = p.add_run(s[s.find(" ")+1:])
            run.font.size = Pt(10)
        else:
            p = doc.add_paragraph()
            run = p.add_run(s)
            run.font.size = Pt(10)
            
    doc.save(docx_path)
    print(f"Saved docx to: {docx_path}")

def main():
    base_dir = r"c:\Users\sudee\Desktop\Capstone\medassist-ai"
    txt_path = os.path.join(base_dir, "PROJECT_OVERVIEW_GUIDE_REVIEW.txt")
    md_path = os.path.join(base_dir, "PROJECT_OVERVIEW_GUIDE_REVIEW.md")
    docx_path = os.path.join(base_dir, "PROJECT_OVERVIEW_GUIDE_REVIEW.docx")
    
    txt_content = get_full_text()
    
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(txt_content)
    print(f"Updated txt file: {txt_path} ({len(txt_content)} chars)")
    
    md_content = generate_markdown(txt_content)
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)
    print(f"Updated md file: {md_path} ({len(md_content)} chars)")
    
    generate_docx(txt_content, docx_path)
    print("All documents generated successfully in the requested order!")

if __name__ == "__main__":
    main()
