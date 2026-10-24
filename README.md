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
| **3** | **Automated Validation Engine** | Real-time backend validation guard flagging: (1) Duplicate APAAR IDs within the same college, (2) **Cross-Institutional Dual Enrollment Conflicts** (student enrolled in two colleges simultaneously), (3) Missing or malformed APAAR IDs (regex `^\d{12}$`), (4) Admissions exceeding approved intake or supernumerary limits, (5) Data inconsistencies (e.g. Foreign National claiming domestic reservation). |
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
│   │   ├── validation_engine.py      # Automated policy validation engine
│   │   ├── auth.py                   # 3-step auth, simulated OTP, JWT
│   │   ├── seed_data.py              # Seeds 150 colleges & edge-case students
│   │   └── routes/
│   │       ├── institutions.py       # Institution explorer & intake stats
│   │       ├── students.py           # Student enrollment & bulk upload
│   │       ├── verification.py       # Public APAAR lookup & digital records
│   │       ├── analytics.py          # Dashboard analytics & charts
│   │       ├── reports.py            # Excel/CSV compliance exports
│   │       └── audit.py              # Regulatory audit trail
│   └── requirements.txt
├── frontend/                         # APAAR Setu frontend (React 19 + Vite 7 + Tailwind v4)
│   ├── index.html                    # Noto Sans / Noto Sans Devanagari
│   ├── vite.config.js                # Proxies /api to the backend on :8000
│   ├── src/
│   │   ├── App.jsx                   # Role-guarded routes (hash router)
│   │   ├── api/index.js              # Every backend call (JWT, error messages)
│   │   ├── state/                    # Session (per tab), consent, display prefs
│   │   ├── lib/                      # Pre-upload validation, signed QR credentials, CSV, i18n
│   │   ├── components/               # GIGW strip, masthead, top menu, certificate, charts
│   │   └── pages/
│   │       ├── Home.jsx              # Live registry figures + portals
│   │       ├── Login.jsx             # Institution 3-step / AICTE / Student sign-in
│   │       ├── InstitutionsExplorer.jsx # Approved institutions, filters, intake drawer
│   │       ├── InstitutionOverview.jsx  # Course intake register, profile, reports
│   │       ├── InstitutionStudents.jsx  # Own roster, add / remove, certificate
│   │       ├── InstitutionUpload.jsx    # Browser pre-check, bulk upload, server verdict
│   │       ├── AicteDashboard.jsx    # National analytics & validation findings
│   │       ├── AicteFlagged.jsx      # Review / approve / remove flagged records
│   │       ├── AicteAudit.jsx        # Audit trail
│   │       ├── StudentProfile.jsx    # Student record, signed QR, consent
│   │       └── Verifier.jsx          # APAAR lookup + QR credential check
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
npm install
npm run dev
```
- Development Portal: [http://127.0.0.1:5173](http://127.0.0.1:5173) (Vite forwards `/api` to port 8000)
- Single-server option: run `npm run build` once; the backend then serves the frontend at [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## 8. Credentials & Testing Guide

| Role | Username / Selection | Password | OTP |
|---|---|---|---|
| **Institute Admin** | *Sign in → Institution*, search e.g. *"MEHR CHAND"* or *"POST GRADUATE GOVT COLLEGE FOR GIRLS"* | `aicte@123` | Click **Fill code** or enter `123456` |
| **AICTE Regulator** | *Sign in → AICTE* | *One click* | Pre-authenticated |
| **Student** | *Sign in → Student*, APAAR `778899001122` | None | `123456` |
| **Public Verifier** | *Verify a student* (no sign-in) | None | Test APAAR `778899001122` or `889911223344` |

**Demo flow:** sign in as one college → *Upload* → *Load demo file* → upload (clean). In a second tab sign in as another college and upload its demo file: the shared applicants are flagged *enrolled at another institution*, without naming the other college. Then sign in as AICTE → *Flagged records* to see both sides and approve or remove. Sign-in is per tab, so all three can stay open.
