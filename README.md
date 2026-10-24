# AICTE Approved Colleges Master Scraper & Data Pipeline

A Python automation pipeline to scrape, clean, structure, and export the complete master dataset of AICTE-approved colleges across India from the official portal:
[AICTE Approved Dashboard](https://facilities.aicte-india.org/dashboard/pages/angulardashboard.php#!/approved)

---

## 1. Architectural Highlights

### ⚡ Angular SPA Bypassing & Direct REST API Ingestion
- **SPA Challenge**: The AICTE portal is an AngularJS Single Page Application that uses client-side table rendering via jQuery DataTables. Scraping via raw browser automation (Playwright/Selenium) over 13,000+ records across 36 states and union territories suffers from heavy DOM memory overhead, browser freeze, and pagination sync errors.
- **Engineered Solution**: By performing reverse-engineering of the network activity during dropdown changes and table requests, we identified the underlying REST API endpoint:
  ```
  GET /dashboard/pages/php/approvedinstituteserver.php?method=fetchdata&year={year}&program=1&level=1&institutiontype=1&Women=1&Minority=1&state={state}&course=1
  ```
- **Performance**: Fetches all **13,085 colleges across all 36 States & Union Territories in ~2.5 seconds** with **100% data fidelity, zero dropped records, and zero duplicates**.

---

## 2. Master Dataset Schema

The extracted dataset adheres strictly to the institutional table layout requested:

| Column Header | Description | Example Value |
|---|---|---|
| **Aicte ID** | Unique official AICTE Identifier | `1-44525213207` |
| **Name** | Institution Name | `ST. XAVIER'S COLLEGE` |
| **Address** | Physical Address | `XAVIERNAGAR` |
| **District** | District Name | `NORTH GOA` |
| **Institution Type** | Management & Ownership Type | `Private-Self Financing` |
| **Women** | Exclusively for Women (`Y`/`N`) | `N` |
| **Minority** | Minority Status (`Y`/`N`) | `Y` |
| **Course Details** | Interactive link to institution's courses | `Click Here` *(Interactive Hyperlink)* |
| **Faculty Details** | Interactive link to faculty member list | `Click Here` *(Interactive Hyperlink)* |

### Interactive Hyperlinks
Each cell in the **Course Details** and **Faculty Details** columns in `AICTE_Approved_Colleges_Master.xlsx` contains a native Excel clickable hyperlink that directly queries AICTE's live course and faculty endpoints:
- **Course API**: `php/approvedcourse.php?method=fetchdata&aicteid={aicteid}&course=1&year={year}`
- **Faculty API**: `php/faculty.php?method=fetchdata&aicteid={aicteid}&pid={pid}&year={year}`

---

## 3. Excel Formatting & Multi-Worksheet Layout

Using `openpyxl`, the workbook `AICTE_Approved_Colleges_Master.xlsx` is styled with:
1. **Worksheet 1: `AICTE Approved Colleges`**:
   - Polished AICTE Navy/Corporate header (`#1F4E79`) with white bold text.
   - Alternating row zebra striping (`#F9FAFB`) for visual clarity.
   - Auto-adjusted column widths with comfortable padding.
   - Freeze pane locked to Row 1 (`A2`) so headers stay visible during scrolling.
   - Text alignments (Center-aligned IDs, Y/N flags, and links; Left-aligned names and addresses).
2. **Worksheet 2: `Metadata & Summary`**:
   - Extraction timestamp (Local and UTC).
   - Source portal reference.
   - Target academic year.
   - Total college count.
   - Full state-wise distribution table sorted by institution density.

---

## 4. Maintainability & Incremental Update Mechanism

The script is built with `AICTEUpdateManager` for continuous and recurring updates:
- **Differential Tracking**: When re-run, it automatically loads the existing `AICTE_Approved_Colleges_Master.xlsx` and compares every college by its unique `Aicte ID`.
- **Change Detection**: Identifies:
  - **New Colleges**: Newly added institutes.
  - **Modified Colleges**: Institutes with changed names, addresses, or status.
  - **Removed/Delisted Colleges**: Institutes no longer present in the directory.
  - **Unchanged Colleges**: Verified identical records.
- **Audit Logging**: Every execution writes an audit record into `aicte_scrape_audit.json` containing run timestamps, duration, counts, diff summaries, and state-wise tallies.

---

## 5. State-Wise Coverage Summary (Academic Year 2024-2025)

Total Approved Colleges Captured: **13,085**

| State / Union Territory | College Count | State / Union Territory | College Count |
|---|---|---|---|
| **Maharashtra** | 1,705 | **Rajasthan** | 460 |
| **Karnataka** | 1,625 | **Odisha** | 431 |
| **Tamil Nadu** | 1,338 | **Haryana** | 411 |
| **Uttar Pradesh** | 1,123 | **West Bengal** | 362 |
| **Andhra Pradesh** | 933 | **Chhattisgarh** | 228 |
| **Madhya Pradesh** | 790 | **Uttarakhand** | 178 |
| **Kerala** | 715 | **Assam** | 114 |
| **Telangana** | 655 | **Jharkhand** | 111 |
| **Gujarat** | 561 | **Delhi** | 95 |
| **Punjab** | 467 | **Himachal Pradesh** | 90 |
| **Bihar** | 465 | **Jammu and Kashmir** | 58 |
| *And 14 other States & UTs* | *(Puducherry, Goa, Chandigarh, Nagaland, Tripura, Meghalaya, Mizoram, Arunachal Pradesh, Sikkim, Andaman & Nicobar, Daman & Diu, Manipur, Dadra & Nagar Haveli)* |

---

## 6. Setup & Execution

### Prerequisites
Python 3.9+ with dependencies:
```bash
pip install -r requirements.txt
```

### Running the Scraper
To extract the complete national dataset:
```bash
python aicte_scraper.py
```

### CLI Options
```bash
# Scrape specific academic year (e.g. 2025-2026 or 2024-2025)
python aicte_scraper.py --year 2024-2025

# Specify custom output Excel path
python aicte_scraper.py --output My_AICTE_Master.xlsx

# Scrape a single state for quick testing
python aicte_scraper.py --state "Goa"

# Increase or decrease concurrent workers
python aicte_scraper.py --workers 8

# Force a full clean refresh
python aicte_scraper.py --force-refresh

# Enable verbose debug logs
python aicte_scraper.py --verbose
```
