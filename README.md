# 🩺 MedAssist AI — Clinical Intelligence & Multi-Organ Health Risk Assessment Platform

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Express.js](https://img.shields.io/badge/Express.js-5.2-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/Neon_PostgreSQL-Serverless-4169E1?logo=postgresql&logoColor=white)](https://neon.tech/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-3.5_Flash_Lite-8E75B2?logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.4-F7931E?logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**MedAssist AI** is an enterprise-grade clinical intelligence and healthcare management platform. It combines **5 organ-specific ML disease risk models** (Random Forest + XGBoost with SMOTE class balancing), a **spatial lab report PDF extraction and OCR engine**, **personalized clinical diet planning (IFCT 2017)**, **Google Gemini 3.5 AI contextual conversational assistant**, and **role-tailored clinical portals for Patients and Doctors**.

---

## 📑 Table of Contents

- [User Portals: Patient & Doctor](#-user-portals-patient--doctor)
  - [Patient Portal](#-patient-portal)
  - [Doctor Portal](#-doctor-portal)
- [System Architecture](#-system-architecture)
- [Machine Learning & Disease Pipelines](#-machine-learning--disease-pipelines)
  - [Model Performance Matrix](#model-performance-matrix)
  - [Data Normalization & Preprocessing](#data-normalization--preprocessing-pipeline)
- [Medical Report PDF Extraction & OCR Engine](#-medical-report-pdf-extraction--ocr-engine)
- [Google Gemini 3.5 AI Clinical Assistant](#-google-gemini-35-ai-clinical-assistant)
- [Personalized Clinical Diet Engine](#-personalized-clinical-diet-engine)
- [Telegram Bot Notification System](#-telegram-bot-notification-system)
- [Tech Stack](#-tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Prerequisites & Environment Configuration](#-prerequisites--environment-configuration)
- [Local Installation & Development Guide](#-local-installation--development-guide)
- [Cloud Deployment Guide (Production)](#-cloud-deployment-guide-production)
  - [1. Neon Serverless PostgreSQL](#1-neon-serverless-postgresql-database)
  - [2. Render Deployment (FastAPI Docker + Express Backend)](#2-render-deployment-fastapi-docker--express-backend)
  - [3. Vercel Deployment (React 19 Frontend)](#3-vercel-deployment-react-19-frontend)
- [API Documentation](#-api-documentation)
- [Research & License](#-research--license)

---

## 👥 User Portals: Patient & Doctor

MedAssist AI provides secure, role-based interfaces with dedicated views, permissions, and tools designed for clinical collaboration.

### 🧑‍⚕️ Patient Portal
Built for intuitive self-monitoring, diagnostic comprehension, and wellness tracking:
- **Comprehensive Health Dashboard (`/dashboard`):** Real-time composite health score calculation (0–100), organ status cards (Heart, Kidneys, Liver, Blood, Glucose), upcoming appointment banners, and quick shortcuts.
- **Medical Report Management & Ingestion (`/reports`):**
  - **Spatial PDF Ingestion:** Upload digital or scanned `.pdf` lab reports with automatic page-level processing and confidence scores.
  - **FIFO Order & Parameter Review:** Reports are ordered newest-upload-first with side-by-side verification of extracted biomarkers, reference intervals, units, and status flags (`HIGH`, `LOW`, `NORMAL`).
  - **Manual Entry:** Dedicated tab to manually record vitals and test results when physical reports are unavailable.
  - **Clinical Report PDF Export:** Export comprehensive diagnostic summaries directly as formatted PDF reports.
- **Longitudinal Biomarker Trends (`/trends`):** Interactive Recharts visualising historical trajectories for key lab parameters (Blood Glucose, HbA1c, Lipid Profile, Creatinine, eGFR, Hemoglobin, Platelets) mapped against clinical reference ranges.
- **Multi-Organ Disease Risk Center (`/risk`):** Evaluates risk across 5 critical domains (Diabetes, CBC Anemia, Cardiovascular CHD, CKD, and Liver) stratified into **Low (<30%)**, **Moderate (30–59%)**, and **High (≥60%)** tiers with parameter contribution breakdowns.
- **Personalized Clinical Diet Planner (`/diet`):** Custom 7-day meal plans matching dietary preferences (**Vegetarian**, **Eggetarian**, **Non-Vegetarian**) and Indian regional cuisines (North, South, East, West, Pan-Indian) with strict organ-specific clinical guardrails from the IFCT 2017 database.
- **AI Health Assistant (`/assistant`):** Context-aware conversational AI with access to the patient's latest lab values, longitudinal vitals, upcoming doctor appointments, and personalized nutritional profile.
- **Appointments & Teleconsultation (`/appointments`, `/consultation`):** Book consultation slots with verified doctors, attend virtual appointments, review past visits, and access digital prescriptions (`/prescriptions`).
- **Telegram Bot Real-Time Notifications (`/settings`):** Securely link personal Telegram account for automated real-time alerts for medicine reminders, consultation day-of reminders, report processing status, and meal schedule alerts.

### 👨‍⚕️ Doctor Portal
Engineered for clinicians to manage patient rosters, triage critical cases, and audit diagnostic findings:
- **Clinical Overview & Triage Center (`/doctor-dashboard?tab=overview`):**
  - Real-time clinical census: total active patients, high-risk patient count, critical abnormal biomarker alerts, and today's consultation schedule.
  - Rapid triage feed prioritizing patients with out-of-range lab markers and urgent risk escalations.
- **Patient Roster & Directory (`/doctor-dashboard?tab=patients`):**
  - Instant patient search and filtering by risk level (**High**, **Moderate**, **Low**).
  - Patient onboarding via unique Doctor Codes or direct Patient IDs (`P000001`).
- **360° Longitudinal Patient Profiles:** Complete clinician dossier for each assigned patient:
  - **Overview & Vitals:** Demographics, medical history, BMI, blood pressure, and resting heart rate.
  - **Biomarker Histories:** Longitudinal multi-test progression charts with reference boundaries.
  - **Multi-Organ Risk Trajectory:** Recalculated 5-organ risk scores with feature importances.
  - **Diet & Nutrition Review:** Active 7-day meal plan, daily caloric breakdown, and macronutrient adherence.
  - **Lab Reports & Audit:** Full archive of uploaded patient PDFs with OCR parameter verification.
  - **Prescription & Clinical Notes:** Direct review of active medications and consultation history.
- **Doctor AI Clinical Assistant (`/assistant`):**
  - Clinician-specific assistant equipped to answer queries on today's schedule, query patient records by name or Patient ID (`P000001`), list high-risk patients, and provide diagnostic context.
- **Appointment & Queue Management (`/doctor-dashboard?tab=appointments`):** Complete clinical schedule manager with date filters, status controls (`Scheduled`, `Completed`, `Cancelled`), direct consultation room launch, and post-session clinical note logging.
- **Report Verification & Diagnostic Audit (`/doctor-dashboard?tab=reports`):** Review OCR-extracted parameters against original PDF reports, flag erroneous values, and record clinical verification notes.
- **Practice Settings & Availability (`/doctor-dashboard?tab=settings`):** Manage clinic credentials, specialization, unique Doctor Referral Code, consultation slot lengths, and weekly availability calendars.

---

## 🏛 System Architecture

```mermaid
flowchart TB
    subgraph Frontend["Frontend Client (Vercel)"]
        UI["React 19 + TypeScript + Vite UI"]
        PatientViews["Patient Dashboard | Trends | Risk Center | Diet | Assistant"]
        DoctorViews["Doctor Triage | Patient Roster | Dossiers | AI Clinical Assistant"]
        UI --> PatientViews
        UI --> DoctorViews
    end

    subgraph CoreBackend["Node.js / Express Core Backend (Render Web Service)"]
        Auth["JWT Auth & Role Guard (Patient / Doctor)"]
        Controllers["Report, Doctor, Appointment & Diet Controllers"]
        GeminiService["Google Gemini 3.5 AI Assistant Service (@google/genai)"]
        TelegramBot["Telegram Bot Polling / Webhook Service"]
        EmailService["Nodemailer Password Reset & Alerts"]
        
        Auth --> Controllers
        Controllers --> GeminiService
        Controllers --> TelegramBot
        Controllers --> EmailService
    end

    subgraph Database["Managed Cloud Database (Neon)"]
        PG[("Serverless PostgreSQL 16 (SSL Enforced)")]
    end

    subgraph Microservice["Python FastAPI Microservice (Render Docker Service)"]
        OCR["Spatial PDF Extractor (PyMuPDF + PaddleOCR + OpenCV)"]
        Norm["3-Tier Semantic Normalizer (SentenceTransformers + RapidFuzz)"]
        ML["5x Random Forest & XGBoost ML Models (SMOTE Balanced)"]
        DietEngine["IFCT 2017 Nutrition Optimization Engine"]
        PDFGen["ReportLab PDF Summary Generator"]
        
        OCR --> Norm --> ML
        OCR --> PDFGen
    end

    UI -->|REST API Requests| Auth
    CoreBackend -->|pg Connection Pool| PG
    CoreBackend -->|Multipart PDF Bytes & Prediction Requests| Microservice
    CoreBackend -->|Generative AI Prompts with User Context| GeminiService
```

---

## 🧠 Machine Learning & Disease Pipelines

### Model Performance Matrix

All 5 organ risk models are trained with **Random Forest & XGBoost Classifiers (`n_estimators=200`, `random_state=42`)** with **SMOTE** applied strictly to the training split.

| Organ / Condition | Dataset Source | Raw Features | Transformed Features | Test Samples | Accuracy | F1 Score | ROC-AUC |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Diabetes Risk** | Diabetes Prediction Dataset (100k) | 8 | 15 | 19,230 | **95.64%** | 75.30% | **96.39%** |
| **CBC (Anemia/Blood)** | Diagnosed CBC Dataset v4 | 14 | 14 | 247 | **99.60%** | **99.73%** | **100.00%** |
| **Heart Disease (10-Yr CHD)**| Framingham Cardiovascular Study & Cleveland | 14 | 14 | 848 | **79.25%** | 26.67% | **64.27%** |
| **Chronic Kidney Disease (CKD)** | UCI Kidney Disease Dataset | 24 | 34 | 80 | **100.00%** | **100.00%** | **100.00%** |
| **Liver Disease** | Indian Liver Patient Dataset (ILPD) | 10 | 11 | 114 | **73.68%** | **82.35%** | **76.66%** |

### Data Normalization & Preprocessing Pipeline

- **Sanitization:** Strip whitespace, convert `inf` to `nan`, remove duplicates and non-predictive IDs.
- **Stratified Split:** 80% training / 20% testing split preserving target class distributions.
- **Imputation:** Median strategy for continuous numericals; most-frequent strategy for categoricals.
- **Scaling & Encoding:** `StandardScaler` for continuous features; `OneHotEncoder(handle_unknown='ignore')` for categoricals.
- **Class Balancing:** `SMOTE(random_state=42)` applied exclusively to training sets to prevent leakage.
- **Serialization:** Preprocessing pipelines and trained models saved as `.pkl` via `joblib`.

---

## 📄 Medical Report PDF Extraction & OCR Engine

The FastAPI extraction engine (`fastapi-service/services/extraction/`) implements a modular spatial pipeline:
- **Strict PDF Ingestion:** Rejects standalone image files (JPG/PNG) to enforce PDF compliance, checking magic bytes `%PDF-` with a 25MB limit.
- **Page-Level Classification:** Distinguishes digital vector glyph pages (`DIGITAL_TEXT` via PyMuPDF) from scanned raster pages (`SCANNED_IMAGE`).
- **Computer Vision Preprocessing:** Deskews scanned pages using `cv2.minAreaRect()`, applying median blur denoising and adaptive Gaussian thresholding.
- **Spatial Multi-Engine OCR:** Extracts word bounding boxes `(x0, y0, x1, y1)` using PyMuPDF for digital text and PaddleOCR (with PyTesseract fallback) for raster text, reconstructing 2D tabular line layouts.
- **3-Tier Semantic Normalization:**
  1. *Tier 1 (Canonical Dictionary):* Fast exact synonym lookup (`synonyms.json`).
  2. *Tier 2 (Fuzzy Token Match):* RapidFuzz Levenshtein similarity for OCR typo correction ($\ge 75\%$).
  3. *Tier 3 (Dense Semantic Embeddings):* SentenceTransformers (`all-MiniLM-L6-v2`) 384-dimensional cosine similarity ($\ge 0.65$).
- **Multi-Factor Confidence Scoring:** Evaluates OCR certainty, spatial alignment, reference interval formatting, and canonical naming adherence.

---

## 🤖 Google Gemini 3.5 AI Clinical Assistant

The platform integrates the `@google/genai` official SDK featuring **Gemini 3.5 Flash Lite** for sub-second responses and clinical context grounding:

### Dual Role Architecture
1. **Patient Health Explainer:**
   - Automatically injects the patient's most recently uploaded lab report (sorted by `created_at DESC`), current multi-organ risk scores, active medications, upcoming doctor appointments, and dietary targets.
   - Translates dense clinical terminology into clear, accessible language while strictly maintaining numerical lab accuracy.
2. **Doctor Clinical Copilot:**
   - Provides instant answers regarding today's booked appointment schedules and queue order.
   - Enables on-the-fly search of patient dossiers by name or ID (e.g. `P000001`).
   - Surfaces high-risk patients and critical out-of-range lab alerts directly inside chat.

---

## 🥗 Personalized Clinical Diet Engine

- **Diet Types:** **Vegetarian**, **Eggetarian**, and **Non-Vegetarian**.
- **Regional Indian Cuisines:** North Indian, South Indian, East Indian, West Indian, and Pan-Indian.
- **Nutritional Foundation:** Calibrated using the **IFCT 2017 (Indian Food Composition Tables)** database containing verified macro- and micronutrient profiles.
- **Organ-Specific Guardrails:**
  - *Kidney Disease:* Sodium $< 2000\text{ mg}$, Potassium $< 2000\text{ mg}$, Phosphorus $< 800\text{ mg}$, Protein $0.6\text{--}0.8\text{ g/kg}$.
  - *Heart Health:* Saturated fat $< 7\%$ calories, sodium $< 1500\text{ mg}$, elevated soluble fiber.
  - *Diabetes:* Low glycemic index, complex carbohydrates, daily fiber $> 30\text{ g}$.
  - *Liver Care:* Balanced lean protein, high antioxidant density, sodium restriction.

---

## 📲 Telegram Bot Notification System

MedAssist AI utilizes the official Telegram Bot API (100% free) for automated healthcare reminders.

### Key Capabilities
- 💊 **Scheduled Medicine Reminders:** Automated morning, afternoon, and night alerts based on doctor prescriptions.
- 🩺 **Doctor Appointments:** Real-time booking confirmations and day-of reminders with clinic details.
- 📋 **Medical Report Processing:** Alerts when lab reports finish processing (without diagnostic leakage).
- 💬 **Doctor-Patient Messages:** Instant notifications for clinical inquiries.
- 🥗 **Diet & Wellness Reminders:** Scheduled mealtime reminders synced to IFCT targets.

### Account Linking Workflow
1. Navigate to **Settings** > **Telegram Notifications**.
2. Click **Connect Telegram** to generate a single-use 15-minute verification token.
3. Open the bot link in Telegram and tap **Start** (`/start <token>`).
4. Instant confirmation links your Telegram handle to your account.

---

## 💻 Tech Stack

| Domain | Technologies & Libraries |
|:---|:---|
| **Frontend** | React 19, TypeScript 6, Vite, Tailwind CSS v4, Radix UI Primitives, Lucide Icons, Recharts |
| **Node Backend** | Node.js 22, Express.js 5, PostgreSQL (`pg`), JWT, Bcrypt, Multer, Nodemailer |
| **GenAI Service** | Official `@google/genai` SDK (Google Gemini 3.5 Flash Lite) |
| **FastAPI Microservice**| Python 3.10+, FastAPI, Uvicorn, Pydantic, HTTPX, Docker |
| **Machine Learning**| Scikit-Learn, XGBoost, Imbalanced-Learn (SMOTE), Pandas, NumPy, Joblib |
| **Document AI & OCR**| PyMuPDF (`fitz`), pdfplumber, PaddleOCR, PyTesseract, OpenCV |
| **Semantic NLP** | SentenceTransformers (`all-MiniLM-L6-v2`), PyTorch, RapidFuzz |
| **Database** | Neon Serverless PostgreSQL (Cloud) / PostgreSQL 16 (Local) |
| **Deployment** | Vercel (Frontend), Render (Express Web Service + Dockerized FastAPI) |

---

## 📁 Project Directory Structure

```
medassist-ai/
├── src/                          # React 19 Frontend
│   ├── components/               # Patient & Doctor UI components, modals, charts
│   │   ├── doctor/               # Doctor overview, roster, profile dossier, appointments
│   │   ├── reports/              # PDF upload zone, report detail viewer, parameter cards
│   │   └── shared/               # Navigation sidebar, headers, UI widgets
│   ├── context/                  # AuthContext, ThemeContext, ToastContext
│   ├── layouts/                  # AppLayout, RoleRoute, ProtectedRoute
│   ├── pages/                    # Dashboard, DoctorDashboard, Reports, Risk, Diet, Assistant, etc.
│   └── services/                 # Frontend API client & appointment services
├── server/                       # Node.js Express Backend
│   ├── controllers/              # Auth, Reports, Doctor, User, Diet, Assistant, Notifications
│   ├── middleware/               # JWT auth, role validation, Multer PDF upload filter, error handling
│   ├── db/                       # PostgreSQL connection pool, schema migrations
│   └── services/                 # Gemini 3.5 GenAI, Telegram bot, Email service, Diet bridge
├── fastapi-service/              # Python FastAPI ML & OCR Microservice
│   ├── routers/ & schemas/       # ML prediction, PDF parse, and export endpoints
│   ├── services/extraction/      # Spatial OCR, layout analysis, 3-tier normalization
│   ├── Dockerfile                # Production Dockerfile with OpenCV & Tesseract dependencies
│   └── main.py                   # FastAPI service entry point
├── ml/                           # Training scripts & datasets for 5 organ ML models
├── render.yaml                   # Infrastructure-as-code configuration for Render deployment
└── vercel.json                   # Single-Page-Application routing rewrite configuration
```

---

## ⚙️ Prerequisites & Environment Configuration

### Required Software
- **Node.js**: `v20.x` or higher
- **Python**: `3.10` to `3.12`
- **PostgreSQL**: Neon Cloud PostgreSQL account OR local PostgreSQL 14+
- **Google Gemini API Key**: Obtain from [Google AI Studio](https://aistudio.google.com/)

### Environment Variables

#### Backend (`server/.env`):
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_minimum_32_chars
DATABASE_URL=postgresql://user:password@ep-sample-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require
FASTAPI_URL=http://localhost:8000
ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend.vercel.app
APP_URL=http://localhost:5173

# Google Gemini AI (3.5 Flash Lite)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite

# Telegram Bot (Free)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_BOT_USERNAME=YourBotName
TELEGRAM_USE_POLLING=true

# SMTP Email Configuration (Password Reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_google_app_password
EMAIL_FROM=no-reply@medassist-ai.com
```

#### FastAPI Microservice (`fastapi-service/.env`):
```env
PORT=8000
ALLOWED_ORIGINS=http://localhost:5000,http://localhost:5173
```

#### Frontend (`.env` in root):
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🚀 Local Installation & Development Guide

### 1. Database Setup
Ensure your Neon PostgreSQL connection string is placed in `server/.env` as `DATABASE_URL`, then run migrations:
```bash
cd server
npm install
npm run migrate
cd ..
```

### 2. FastAPI Setup
```bash
cd fastapi-service
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux / macOS:
source venv/bin/activate

pip install -r requirements.txt
cd ..
```

### 3. Frontend & Concurrent Execution
```bash
npm install
npm run dev
```
- **Frontend App:** `http://localhost:5173`
- **Express Backend:** `http://localhost:5000`
- **FastAPI Microservice:** `http://localhost:8000`

---

## ☁️ Cloud Deployment Guide (Production)

### 1. Neon Serverless PostgreSQL Database
1. Go to [Neon Console](https://console.neon.tech/) and create a free PostgreSQL project.
2. Copy your pooled connection string:
   ```text
   postgresql://[user]:[password]@[endpoint]-pooler.neon.tech/[dbname]?sslmode=require
   ```
3. Run the migrations from your local machine to populate the schema:
   ```bash
   cd server
   npm run migrate
   ```

### 2. Render Deployment (FastAPI Docker + Express Backend)
Deploying via Render blueprint or manual web services:

#### Service A: FastAPI Docker Microservice
- **Type:** Web Service
- **Environment:** Docker
- **Root Directory:** `fastapi-service`
- **Dockerfile Path:** `fastapi-service/Dockerfile`
- **Environment Variables:**
  - `PORT`: `8000`
  - `ALLOWED_ORIGINS`: `https://your-frontend.vercel.app`
- *Note Render service URL:* `https://medassist-ai-fastapi.onrender.com`

#### Service B: Express Node.js Backend
- **Type:** Web Service
- **Environment:** Node
- **Root Directory:** `server`
- **Build Command:** `npm ci`
- **Start Command:** `node index.js`
- **Environment Variables:**
  - `NODE_ENV`: `production`
  - `PORT`: `5000`
  - `DATABASE_URL`: `postgresql://...neon.tech/neondb?sslmode=require`
  - `JWT_SECRET`: *(Click Generate or paste secure string)*
  - `FASTAPI_URL`: `https://medassist-ai-fastapi.onrender.com`
  - `ALLOWED_ORIGINS`: `https://your-frontend.vercel.app`
  - `GEMINI_API_KEY`: `your_gemini_api_key`
  - `GEMINI_MODEL`: `gemini-3.5-flash-lite`
  - `APP_URL`: `https://your-frontend.vercel.app`
  - `TELEGRAM_BOT_TOKEN`: `your_telegram_bot_token`
  - `TELEGRAM_USE_POLLING`: `true`

### 3. Vercel Deployment (React 19 Frontend)
1. Import repository into [Vercel](https://vercel.com/).
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Environment Variables:
   - `VITE_API_BASE_URL`: `https://medassist-ai-backend.onrender.com/api`
6. Deploy! The included `vercel.json` ensures full SPA client-side routing support.

---

## 📡 API Documentation

### Express Backend API (`:5000`)
| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---:|
| `POST` | `/api/auth/register` & `/api/auth/login` | Register / Authenticate user (Patient or Doctor) | No |
| `POST` | `/api/auth/forgot-password` | Request password reset token via email | No |
| `POST` | `/api/auth/reset-password` | Reset password using valid reset token | No |
| `GET`/`PUT` | `/api/user/profile` | Fetch & update profile information and health metrics | Yes |
| `POST` | `/api/reports/upload` | Upload & spatially parse PDF medical lab report | Yes |
| `POST` | `/api/reports/manual` | Submit manual lab report / vital readings entry | Yes |
| `GET`  | `/api/reports` & `/api/reports/trends` | Fetch historical reports (FIFO) & longitudinal biomarker series | Yes |
| `GET`  | `/api/reports/disease-risks` | Compute overall multi-organ risk assessment | Yes |
| `POST` | `/api/reports/:id/explain` | Generate Google Gemini AI report explanation | Yes |
| `GET`  | `/api/doctor/patients` | Retrieve patient roster and triage census (Doctor) | Yes (Doctor) |
| `POST` | `/api/diet/generate` & `/api/diet/plan` | Generate and retrieve weekly personalized diet plan | Yes |
| `POST` | `/api/assistant/chat` | Contextual conversational query to Gemini 3.5 Assistant | Yes |
| `GET`  | `/api/notifications/telegram/status` | Retrieve Telegram connection status & preferences | Yes |
| `POST` | `/api/notifications/telegram/token` | Generate secure 15-minute token & deep-link | Yes |
| `POST` | `/api/notifications/telegram/test` | Send test notification to linked Telegram chat | Yes |
| `PUT`  | `/api/notifications/telegram/preferences` | Update category notification preferences | Yes |
| `POST` | `/api/notifications/telegram/disconnect` | Unlink Telegram account from patient profile | Yes |

### FastAPI Microservice API (`:8000`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/parse-report` | Spatial OCR & parameter extraction from uploaded PDF bytes |
| `POST` | `/api/ml/{diabetes\|cbc\|heart\|kidney\|liver}/predict` | Predict organ-specific disease risk score and tier |
| `POST` | `/api/v1/diet/optimize` | IFCT 2017 multi-constraint nutrition optimization |
| `POST` | `/api/pdf/export-summary` | Generate downloadable PDF summary report |
| `GET`  | `/health` | Microservice health check & model preload status |

---

## 📑 Research & License

- 📄 **Research Paper:** Algorithmic designs and clinical evaluations are documented in [IEEE Research Paper: MedAssist AI Architecture & Clinical ML](IEEE_RESEARCH_PAPER_MEDASSIST_AI.md).
- 📜 **License:** Distributed under the **MIT License**.

---

<p align="center">
  Built with ❤️ for AI-Driven Healthcare and Clinical Diagnostic Intelligence.
</p>
