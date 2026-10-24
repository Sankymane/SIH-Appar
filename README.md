# AICTE-APAAR: Student Data Management & Verification Platform
### Solution for SIH Problem Statement 26263

A full-stack, enterprise-grade web application developed to solve **SIH Problem Statement 26263**: *"Development of an APAAR ID-Based Student Data Management and Verification Platform for AICTE-Approved Institutions"*.

The platform integrates the **Automated Permanent Academic Account Registry (APAAR)** 12-digit identifier into the official AICTE institutional data pipeline, enforcing automated policy validation, preventing duplicate admissions across India, safeguarding approved intake capacities, and generating verifiable digital academic records and certificates.

---

## 1. Official AICTE Visual Design System

The application strictly mirrors the design language of the official AICTE portal ([AICTE India](https://www.aicte-india.org/) & [Approved Institutes Dashboard](https://facilities.aicte-india.org/dashboard/pages/angulardashboard.php#!/approved)):

- **Primary Corporate Palette**:
  - **Deep Corporate Blue (`#0B2265` / `#071744`)**: Masthead headers, primary navigation bar, certificate borders, and table headers.
  - **Flame Orange (`#FF5722` / `#f75700`)**: Primary CTA buttons, sub-navigation tabs, alert badges, and active accent elements.
  - **Gold / Amber (`#f7941d`)**: News ticker badges, portal login highlights, and seals.
  - **Teal / Sea Green (`#009688`)**: Table action buttons (`Click Here`), progress gauges, and verified badges.
- **Header Structure**:
  - Top black utility bar: Live localized date/time clock, Screen Reader Access, Text Size (`A- A A+`), `हिंदी` button, `Web Portal Login`, and social icons.
  - White branding masthead: High-resolution official AICTE emblem, Ministry of Education Sanskrit typography (*अखिल भारतीय तकनीकी शिक्षा परिषद्*), and APAAR ID Registry badge.
  - News marquee ticker with animated policy alerts.
  - Orange sub-navigation bar (Home, Dashboard, Universities/Institutes, Other Approvals, NBA, Autonomous, Faculties, Closed Courses, Unapproved).

---

## 2. Public Portal: Approved Institutions Explorer

Mirrors the layout of the AICTE Angular Dashboard:

- **Left Filter Sidebar (Width 290px)**:
  - Academic Year dropdown (`2026-2027`, `2025-2026`, `2024-2025`, etc.)
  - Select State (`Maharashtra`, `Karnataka`, `Delhi`, `Goa`, `Tamil Nadu`, `Gujarat`, etc.)
  - Select Program (`Engineering and Technology`, `Management`, `MCA`, `Pharmacy`, etc.)
  - Select Level (`UG`, `PG`, `Diploma`)
  - Course auto-suggest search input
  - Institution Type (`Government`, `Private-Self Financing`, `Govt aided`, `Central University`)
  - Minority (`Y`/`N`) and Women (`Y`/`N`) filters
  - Flame Orange `Submit` button
- **Master Data Table**:
  - Headers: `Aicte ID`, `Name`, `Address`, `District`, `Institution Type`, `Women`, `Minority`, `Course Details`, `Faculty Details`, and `APAAR Intake & Verification`.
  - DataTables controls: `Show [10/25/50/100] entries`, real-time text search.
  - Paginated navigation and official note: *"Note : Faculty Data will display only for Current Academic Year"*.
  - Hit counter at bottom right.
- **Side Panel Drawer (Approved Intake vs. Actual Students Admitted)**:
  - Clicking any college opens a smooth slide-in side drawer.
  - Displays institutional contact info (Website, Contact Email, Phone, Nodal Officer).
  - **Visual Chart**: Overall capacity utilization gauge and course-by-course capacity comparison bars comparing **Sanctioned Approved Intake vs. Actual Admitted Students**.
  - Direct CTA button: *"Log In as this Institute to Manage APAAR Data"*.

---

## 3. Institute Secure Login (3-Step Workflow)

Implements a secure multi-step authentication process matching regulatory standards:

1. **Step 1 - Search & Select Institute**:
   - Live autocomplete dropdown querying the master AICTE registry by institution name or AICTE ID.
2. **Step 2 - Security Password**:
   - Institutional portal password entry.
   - *Demo password*: `aicte@123`.
3. **Step 3 - Two-Factor (OTP) Verification**:
   - Simulated SMS & Email gateway dispatch to the registered Nodal Officer.
   - Displays simulated OTP badge (e.g. `482910`) with a convenient **1-Click Auto-Fill** button for instant evaluation.
   - Master bypass OTP: `123456`.
   - Issues a secure JWT Bearer session token.
4. **Regulator Mode Quick-Switch**:
   - One-click toggle in header to log in as **AICTE Central Regulatory & Vigilance Bureau** (`AICTE_VERIFIER` role) to audit all colleges system-wide.

---

## 4. The 10 Core Platform Requirements (Problem Statement 26263)

| # | Requirement | Implementation Details |
|---|---|---|
| **1** | **Student Data Upload** | Secure single student enrollment modal + high-speed bulk CSV/Excel ingestion pipeline with drag & drop and template download. |
| **2** | **Mandatory Policy Fields** | Input captures: Approved Intake, Actual Enrolment, Supernumerary Seats (TFW, PMSSS, Sports, EWS), NRI Category, OCI Status, Foreign National (FN) Status, and Course Details (Program, Dept, Level, Shift). |
| **3** | **Automated Validation Engine** | Real-time backend validation guard flagging: (1) Duplicate APAAR IDs within the same college, (2) **Cross-Institutional Dual Enrollment Conflicts** (student enrolled in two colleges simultaneously), (3) Missing or malformed APAAR IDs (regex `^\d{12}$`) and IDs that are not **present and ACTIVE in the Central APAAR Registry**, (4) Admissions exceeding approved intake or supernumerary limits, (5) Data inconsistencies (e.g. Foreign National claiming domestic reservation). |
| **4** | **Real-Time Dashboards** | KPI tiles, course-by-course capacity comparison bars, quota allocation chart (Regular, TFW, PMSSS, NRI, OCI, FN), social category breakdown (General, OBC, SC, ST, EWS), and gender ratio metrics. |
| **5** | **Verification Mechanism** | Instant verification portal (`/verify`) allowing stakeholders/employers to lookup any 12-digit APAAR ID and view verified student identity cards with biometric & DigiLocker trust status. |
| **6** | **Verifiable Records** | Each student record is cryptographically signed with a **SHA-256 digital signature hash** and assigned a live scannable QR code linking to the official verification endpoint. |
| **7** | **REST API Ready** | Fully structured RESTful API under `/api/v1/` with interactive OpenAPI Swagger documentation accessible at `http://127.0.0.1:8000/docs`. |
| **8** | **Security & Roles (RBAC)** | Role-Based Access Control (`INSTITUTE_ADMIN`, `AICTE_VERIFIER`, `PUBLIC`), immutable audit trail logging all actions, and **Privacy Masking toggle** (`XXXX-XXXX-1234`) for sensitive APAAR numbers. |
| **9** | **Policy & Regulatory Reporting** | One-click modal to export: (1) Student Master APAAR Roster (.xlsx / .csv), (2) Regulatory Intake Capacity & Compliance Audit (.xlsx / .csv). |
| **10** | **Degree Certificate Generation** | High-resolution UI preview of an official AICTE/University Degree Certificate prominently displaying the student's **12-digit APAAR ID**, Student Roll No, AICTE seals, DigiLocker verification badge, holographic border, and QR code. |

---

## 5. Seeded Database & Edge-Case Demonstration

The platform includes a database seeded from the real scraped `AICTE_Approved_Colleges_Master.xlsx` dataset, with synthetic student records designed specifically to demonstrate the validation engine:

- **Valid Students**: Proper 12-digit APAAR IDs, regular admission within sanctioned capacity.
- **Cross-Institution Duplicate**: APAAR ID `778899001122` is enrolled simultaneously at *St. Xavier's College* (Goa) and *Goa Institute of Management* -> Flagged with high-priority cross-institutional alert!
- **Same-College Duplicate**: Two students sharing APAAR ID `889911223344` in the same college -> Flagged as internal duplicate.
- **Missing APAAR ID**: Student enrolled without an APAAR ID -> Flagged as `MISSING_APAAR`.
- **Invalid APAAR Format**: APAAR `98234-INVALID` (non-numeric / short) -> Flagged as `INVALID_APAAR_FORMAT`.
- **Approved Intake Exceeded**: Information Technology department (Sanctioned: 10 seats, Admitted: 14 students) -> Flagged as `INTAKE_EXCEEDED`.
- **Data Inconsistency**: Foreign National (FN) student claiming domestic SC/ST reservation quota -> Flagged as `DATA_INCONSISTENCY`.

---

## 6. Project Architecture

```
sih-appar/
├── backend/
│   ├── app/
│   │   ├── main.py                   # FastAPI app with CORS & static mounting
│   │   ├── database.py               # SQLite / SQLAlchemy connection
│   │   ├── models.py                 # College, CourseIntake, Student, AuditLog
│   │   ├── schemas.py                # Pydantic v2 schemas
│   │   ├── validation_engine.py      # Automated policy validation engine (format + registry + duplicates + intake)
│   │   ├── integrity/                # L1-L5 enrollment integrity & anomaly pipeline (merged from sih2)
│   │   │   ├── pipeline.py           # Batch orchestrator, risk index, regulatory verdict
│   │   │   ├── registry.py           # Mock Central APAAR Registry (present + ACTIVE + name/DOB)
│   │   │   ├── intake_validator.py   # Approved intake + TFW/EWS/PMSSS/lateral/NRI ceilings
│   │   │   ├── multi_enrollment.py   # Cross-college & intra-batch duplicates
│   │   │   ├── anomaly_detector.py   # Contact reuse, PIN concentration, merit outliers
│   │   │   └── data/                 # registry JSON, approved-intake JSON, planted demo CSV
│   │   ├── auth.py                   # 3-step auth, simulated OTP, JWT
│   │   ├── seed_data.py              # Seeds 150 colleges & edge-case students
│   │   └── routes/
│   │       ├── institutions.py       # Institution explorer & intake stats
│   │       ├── students.py           # Student enrollment & bulk upload
│   │       ├── verification.py       # Public APAAR lookup & digital records
│   │       ├── analytics.py          # Dashboard analytics & charts
│   │       ├── reports.py            # Excel/CSV compliance exports
│   │       ├── audit.py              # Regulatory audit trail
│   │       └── integrity.py          # /integrity/audit, /integrity/audit/demo, /integrity/demo-batch
│   ├── tests/test_integrity.py       # pytest suite for the integrity pipeline
│   └── requirements.txt
├── frontend/
│   ├── index.html                    # AICTE branded title & favicon
│   ├── src/
│   │   ├── App.tsx                   # Main orchestrator & router
│   │   ├── index.css                 # Master AICTE portal CSS system
│   │   ├── api.ts                    # Backend API client
│   │   ├── types.ts                  # TypeScript interfaces
│   │   └── components/
│   │       ├── Header.tsx            # AICTE utility bar, masthead, ticker, nav
│   │       ├── InstitutionsExplorer.tsx # Left sidebar filters + data table
│   │       ├── CollegeDetailDrawer.tsx  # Intake vs Admitted chart side drawer
│   │       ├── LoginModal.tsx        # 3-Step Login (Search -> Password -> OTP)
│   │       ├── InstituteDashboard.tsx   # Core dashboard with 10 requirements
│   │       ├── StudentUploadModal.tsx   # Single + Bulk CSV/Excel upload
│   │       ├── AutomatedValidationBanner.tsx # Discrepancy KPI pills & filters
│   │       ├── VerificationPortal.tsx   # Real-time APAAR lookup & digital identity
│   │       ├── CertificatePreviewModal.tsx # Sample Degree Certificate preview
│   │       ├── AuditTrailView.tsx       # RBAC & activity audit log
│   │       ├── IntegrityAuditView.tsx   # L1-L5 integrity & anomaly audit tab
│   │       ├── ReportsModal.tsx         # Regulatory reporting export
│   │       └── AnalyticsCharts.tsx      # Visual capacity & diversity charts
│   └── package.json
├── aicte_scraper.py                  # Scraper that extracted the 13,085 master colleges
├── AICTE_Approved_Colleges_Master.xlsx # Master national dataset
├── start.sh                          # 1-click startup script
└── README.md
```

---

## 7. How to Run the Platform

### Option A: 1-Click Startup Script (Recommended)
```bash
./start.sh
```
This script automatically activates the Python virtual environment, verifies database seeding, launches the FastAPI backend on `http://127.0.0.1:8000`, and launches the Vite frontend on `http://127.0.0.1:5173`.

### Option B: Manual Startup

#### 1. Backend (FastAPI on Port 8000)
```bash
# In project root
source .venv/bin/activate
pip install -r requirements.txt
python3 -m backend.app.seed_data
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```
- API & Production App: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- Interactive OpenAPI Swagger Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

#### 2. Frontend (Vite Dev Server on Port 5173)
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev -- --port 5173
```
- Development Portal: [http://127.0.0.1:5173](http://127.0.0.1:5173)

---

## 8. Credentials & Testing Guide

| Role | Username / Selection | Password | OTP |
|---|---|---|---|
| **Institute Admin** | Search for *"St. Xavier's"* or *"Government College"* | `aicte@123` | Click **"1-Click Auto-Fill Code"** or enter `123456` |
| **AICTE Regulator** | Click *"AICTE Regulator Mode"* in top blue header bar | *Direct access* | Pre-authenticated |
| **Public Verifier** | Navigate to *"APAAR Verification Portal"* | None required | Test APAAR `778899001122` or `889911223344` |

---

## 9. Enrollment Integrity & Anomaly Detection (merged module)

Built by Team Code Geass and merged into this platform. It adds a batch audit on top of the per-student validation engine.

**APAAR ID rule (everywhere):** the ID must be exactly 12 digits **and** exist as an `ACTIVE` record in the Central APAAR Registry (`backend/app/integrity/data/apaar_central_registry.json`, a mock of the national depository). Statuses: `INVALID_APAAR_FORMAT`, `APAAR_NOT_IN_REGISTRY`, `APAAR_INACTIVE`.

| Layer | Checks |
|---|---|
| L1 | 12-digit format |
| L2 | Present in registry, ACTIVE (not deactivated / fraud-listed), name and DOB match |
| L3 | Approved intake, TFW 5%, EWS 10% and income limit, PMSSS, lateral, NRI |
| L4 | Concurrent full-time enrollment in another college, duplicates inside the batch |
| L5 | Shared phone/email syndicates, PIN-code concentration, merit-percentile outliers |

Each student gets a 0-100 risk score; the batch gets an Institutional Risk Index (IRI) and a determination: `APPROVED`, `PROVISIONAL_AUDIT` or `REJECTED_HEARING`.

**Try it:** open the **Integrity & Anomaly Audit** tab and click *Run planted demo batch*, or upload your own CSV (columns as in the downloadable demo file). To enrol a valid single student in the dashboard, use an ID from the registry JSON, e.g. `910010001012`.

**Tests:** `pytest backend/tests` from the repo root.
