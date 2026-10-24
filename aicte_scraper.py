#!/usr/bin/env python3
"""
AICTE Approved Colleges Master Scraper & Data Extractor
======================================================
This script scrapes and extracts the complete dataset of AICTE-approved colleges
from the official AICTE dashboard:
https://facilities.aicte-india.org/dashboard/pages/angulardashboard.php#!/approved

Key Capabilities:
1. REST API Bypassing:
   Instead of sluggish browser DOM scraping prone to rendering timeouts, this script
   directly queries the underlying REST API endpoint used by the Angular SPA:
   `/dashboard/pages/php/approvedinstituteserver.php?method=fetchdata`
2. Complete State-Wise Extraction:
   Iterates across all 36 States and Union Territories with concurrent requests,
   automatic retry logic, and exponential backoff to ensure zero dropped records.
3. Exact Table Layout Schema:
   Structures data into precisely the 9 institutional columns:
   - Aicte ID
   - Name
   - Address
   - District
   - Institution Type
   - Women
   - Minority
   - Course Details
   - Faculty Details
4. OpenPyXL Polished Formatting:
   - Beautiful header styling and readable column widths.
   - Interactive clickable hyperlinks for Course & Faculty details.
   - Metadata & Summary worksheet detailing state breakdown and timestamps.
5. Incremental Updates & Audit Logging:
   - Compares previous runs to identify new, modified, or unchanged colleges.
   - Maintains an audit history log in JSON format.
"""

import os
import sys
import json
import time
import logging
import argparse
import urllib.parse
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Tuple, Optional, Any

import requests
import pandas as pd
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter


# =====================================================================
# Configuration & Constants
# =====================================================================

class AICTEConfig:
    """Central configuration for AICTE endpoints and extraction settings."""
    BASE_URL = "https://facilities.aicte-india.org/dashboard/pages"
    DASHBOARD_URL = f"{BASE_URL}/angulardashboard.php#!/approved"
    INSTITUTES_PAGE_URL = f"{BASE_URL}/approvedinstitutes.php"
    
    # API endpoints
    INSTITUTE_API_URL = f"{BASE_URL}/php/approvedinstituteserver.php"
    COURSE_API_URL = f"{BASE_URL}/php/approvedcourse.php"
    FACULTY_API_URL = f"{BASE_URL}/php/faculty.php"
    
    # Default parameters
    DEFAULT_YEAR = "2024-2025"
    DEFAULT_OUTPUT = "AICTE_Approved_Colleges_Master.xlsx"
    DEFAULT_AUDIT_LOG = "aicte_scrape_audit.json"
    DEFAULT_MAX_WORKERS = 6
    DEFAULT_TIMEOUT = 25  # seconds
    MAX_RETRIES = 3
    RETRY_BACKOFF = 1.5   # multiplier
    
    # Default headers mimicking a standard modern browser
    DEFAULT_HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.9",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": f"{BASE_URL}/angulardashboard.php",
    }
    
    # Complete list of States & UTs recognised by the AICTE portal
    FALLBACK_STATES = [
        "Andaman and Nicobar Islands",
        "Andhra Pradesh",
        "Arunachal Pradesh",
        "Assam",
        "Bihar",
        "Chandigarh",
        "Chhattisgarh",
        "Dadra and Nagar Haveli",
        "Daman and Diu",
        "Delhi",
        "Goa",
        "Gujarat",
        "Haryana",
        "Himachal Pradesh",
        "Jammu and Kashmir",
        "Jharkhand",
        "Karnataka",
        "Kerala",
        "Madhya Pradesh",
        "Maharashtra",
        "Manipur",
        "Meghalaya",
        "Mizoram",
        "Nagaland",
        "Odisha",
        "Orissa",
        "Puducherry",
        "Punjab",
        "Rajasthan",
        "Sikkim",
        "Tamil Nadu",
        "Telangana",
        "Tripura",
        "Uttar Pradesh",
        "Uttarakhand",
        "West Bengal",
    ]


# =====================================================================
# Logging Setup
# =====================================================================

def setup_logger(verbose: bool = False) -> logging.Logger:
    """Configures console and file logging."""
    logger = logging.getLogger("aicte_scraper")
    logger.setLevel(logging.DEBUG if verbose else logging.INFO)
    
    if not logger.handlers:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.DEBUG if verbose else logging.INFO)
        formatter = logging.Formatter(
            "[%(asctime)s] [%(levelname)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
    return logger


# =====================================================================
# Module 1: Data Extraction & Fetching Logic
# =====================================================================

class AICTEDataExtractor:
    """
    Handles robust HTTP network communication with AICTE REST API endpoints.
    Fetches raw college records state-by-state concurrently with error resilience.
    """
    
    def __init__(self, logger: logging.Logger, timeout: int = AICTEConfig.DEFAULT_TIMEOUT):
        self.logger = logger
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update(AICTEConfig.DEFAULT_HEADERS)
    
    def get_states(self) -> List[str]:
        """
        Attempts to dynamically fetch the official states list from the HTML dropdown;
        falls back to the verified list if the page markup is unavailable.
        """
        try:
            resp = self.session.get(AICTEConfig.INSTITUTES_PAGE_URL, timeout=self.timeout)
            if resp.status_code == 200:
                import re
                match = re.search(r'<select[^>]*name=["\']state["\'][^>]*>(.*?)</select>', resp.text, re.DOTALL)
                if match:
                    options = re.findall(r'<option[^>]*>(.*?)</option>', match.group(1))
                    cleaned = [opt.strip() for opt in options if opt.strip()]
                    if cleaned:
                        self.logger.info(f"Dynamically discovered {len(cleaned)} states from AICTE dropdown.")
                        return cleaned
        except Exception as e:
            self.logger.warning(f"Could not dynamically discover states ({e}); using verified state list.")
        
        return AICTEConfig.FALLBACK_STATES

    def fetch_state_colleges(self, state: str, year: str) -> Tuple[str, List[List[Any]], Optional[str]]:
        """
        Fetches all colleges for a given state and academic year with retry backoff.
        
        Returns:
            Tuple: (state_name, list_of_raw_records, error_message_if_any)
        """
        params = {
            "method": "fetchdata",
            "year": year,
            "program": "1",
            "level": "1",
            "institutiontype": "1",
            "Women": "1",
            "Minority": "1",
            "state": state,
            "course": "1",
        }
        
        last_error = None
        for attempt in range(1, AICTEConfig.MAX_RETRIES + 1):
            try:
                resp = self.session.get(
                    AICTEConfig.INSTITUTE_API_URL,
                    params=params,
                    timeout=self.timeout
                )
                if resp.status_code == 200:
                    text = resp.text.strip()
                    if not text or text == "null":
                        return state, [], None
                    data = resp.json()
                    if isinstance(data, list):
                        return state, data, None
                    else:
                        return state, [], f"Unexpected response type: {type(data)}"
                else:
                    last_error = f"HTTP {resp.status_code}"
            except Exception as exc:
                last_error = str(exc)
            
            sleep_time = AICTEConfig.RETRY_BACKOFF ** attempt
            time.sleep(sleep_time)
            
        return state, [], f"Failed after {AICTEConfig.MAX_RETRIES} attempts. Error: {last_error}"

    def extract_all_colleges(
        self,
        year: str = AICTEConfig.DEFAULT_YEAR,
        states: Optional[List[str]] = None,
        max_workers: int = AICTEConfig.DEFAULT_MAX_WORKERS
    ) -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
        """
        Extracts colleges across all specified states using concurrent worker threads.
        
        Returns:
            Tuple: (list_of_parsed_college_dicts, state_counts_dict)
        """
        target_states = states or self.get_states()
        self.logger.info(
            f"Starting extraction for academic year '{year}' across {len(target_states)} states "
            f"using {max_workers} concurrent workers..."
        )
        
        state_counts: Dict[str, int] = {}
        all_colleges: List[Dict[str, Any]] = []
        start_time = time.time()
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_state = {
                executor.submit(self.fetch_state_colleges, state, year): state
                for state in target_states
            }
            
            completed = 0
            for future in as_completed(future_to_state):
                state = future_to_state[future]
                completed += 1
                try:
                    st_name, raw_records, err = future.result()
                    if err:
                        self.logger.error(f"[{completed}/{len(target_states)}] Error fetching {st_name}: {err}")
                        state_counts[st_name] = 0
                    else:
                        count = len(raw_records)
                        state_counts[st_name] = count
                        self.logger.info(
                            f"[{completed:02d}/{len(target_states):02d}] {st_name:<30}: {count:>5} colleges"
                        )
                        
                        # Parse individual records into structured dictionary
                        for item in raw_records:
                            # Typical item schema:
                            # 0: Aicte ID
                            # 1: Name
                            # 2: Address
                            # 3: District
                            # 4: Institution Type
                            # 5: Women
                            # 6: Minority
                            # 7: PID (permanent id)
                            aicte_id = str(item[0]).strip() if len(item) > 0 and item[0] is not None else ""
                            name = str(item[1]).strip() if len(item) > 1 and item[1] is not None else ""
                            address = str(item[2]).strip() if len(item) > 2 and item[2] is not None else ""
                            district = str(item[3]).strip() if len(item) > 3 and item[3] is not None else ""
                            inst_type = str(item[4]).strip() if len(item) > 4 and item[4] is not None else ""
                            women = str(item[5]).strip() if len(item) > 5 and item[5] is not None else ""
                            minority = str(item[6]).strip() if len(item) > 6 and item[6] is not None else ""
                            pid = str(item[7]).strip() if len(item) > 7 and item[7] is not None else aicte_id
                            
                            all_colleges.append({
                                "Aicte ID": aicte_id,
                                "Name": name,
                                "Address": address,
                                "District": district,
                                "Institution Type": inst_type,
                                "Women": women,
                                "Minority": minority,
                                "_state": st_name,
                                "_pid": pid,
                                "_year": year,
                            })
                except Exception as exc:
                    self.logger.error(f"Exception processing future for {state}: {exc}")
                    state_counts[state] = 0
        
        elapsed = time.time() - start_time
        self.logger.info(
            f"Extraction completed in {elapsed:.2f}s. "
            f"Total colleges fetched: {len(all_colleges)}"
        )
        return all_colleges, state_counts


# =====================================================================
# Module 2: Data Cleaning & Formatting Logic
# =====================================================================

class AICTEDataFormatter:
    """
    Cleans raw college records and constructs a Pandas DataFrame adhering
    strictly to the user's required 9-column schema.
    """
    
    EXACT_COLUMNS = [
        "Aicte ID",
        "Name",
        "Address",
        "District",
        "Institution Type",
        "Women",
        "Minority",
        "Course Details",
        "Faculty Details",
    ]
    
    @staticmethod
    def format_to_dataframe(
        colleges: List[Dict[str, Any]],
        year: str = AICTEConfig.DEFAULT_YEAR
    ) -> Tuple[pd.DataFrame, List[Dict[str, str]]]:
        """
        Transforms raw college dictionaries into a clean Pandas DataFrame matching
        the exact required schema. Also generates the URL endpoints for hyperlinks.
        
        Returns:
            Tuple: (pd.DataFrame with exact 9 columns, list of link metadata)
        """
        rows = []
        links_meta = []
        
        # Deduplicate by AICTE ID while preserving order
        seen_ids = set()
        
        for col in colleges:
            aicte_id = col["Aicte ID"]
            if not aicte_id:
                continue
            if aicte_id in seen_ids:
                continue
            seen_ids.add(aicte_id)
            
            pid = col.get("_pid", aicte_id)
            rec_year = col.get("_year", year)
            
            # Construct endpoints matching Angular dashboard actions
            # Course details: openRightMenu1(/aicteid/, /course/, /year/)
            course_url = (
                f"{AICTEConfig.COURSE_API_URL}?method=fetchdata"
                f"&aicteid={urllib.parse.quote(aicte_id)}&course=1&year={urllib.parse.quote(rec_year)}"
            )
            
            # Faculty details: openRightMenu2(aicteid, pid, year)
            # Portal notes: "Faculty Data will display only for Current Academic Year" (2024-2025)
            if rec_year == "2024-2025":
                faculty_text = "Click Here"
                faculty_url = (
                    f"{AICTEConfig.FACULTY_API_URL}?method=fetchdata"
                    f"&aicteid={urllib.parse.quote(aicte_id)}&pid={urllib.parse.quote(pid)}"
                    f"&year={urllib.parse.quote(rec_year)}"
                )
            else:
                faculty_text = "NA"
                faculty_url = ""
            
            rows.append({
                "Aicte ID": aicte_id,
                "Name": col["Name"],
                "Address": col["Address"],
                "District": col["District"],
                "Institution Type": col["Institution Type"],
                "Women": col["Women"],
                "Minority": col["Minority"],
                "Course Details": "Click Here",
                "Faculty Details": faculty_text,
            })
            
            links_meta.append({
                "course_url": course_url,
                "faculty_url": faculty_url,
            })
            
        df = pd.DataFrame(rows, columns=AICTEDataFormatter.EXACT_COLUMNS)
        return df, links_meta


# =====================================================================
# Module 3: File Saving & OpenPyXL Styling Logic
# =====================================================================

class AICTEExcelExporter:
    """
    Persists data to Excel using openpyxl with professional design,
    custom headers, auto-fit columns, freeze-panes, and interactive hyperlinks.
    """
    
    # Palette definition: AICTE Corporate Orange & Dark Navy
    HEADER_FILL = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
    HEADER_FONT = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    ZEBRA_FILL = PatternFill(start_color="F9FAFB", end_color="F9FAFB", fill_type="solid")
    LINK_FONT = Font(name="Calibri", size=10, color="0563C1", underline="single")
    NA_FONT = Font(name="Calibri", size=10, color="888888", italic=True)
    REGULAR_FONT = Font(name="Calibri", size=10, color="000000")
    
    THIN_BORDER = Border(
        left=Side(style="thin", color="E0E0E0"),
        right=Side(style="thin", color="E0E0E0"),
        top=Side(style="thin", color="E0E0E0"),
        bottom=Side(style="thin", color="E0E0E0")
    )

    @classmethod
    def export(
        cls,
        df: pd.DataFrame,
        links_meta: List[Dict[str, str]],
        output_filepath: str,
        year: str,
        state_counts: Dict[str, int],
        logger: logging.Logger
    ) -> str:
        """
        Creates a beautifully styled multi-worksheet Excel workbook.
        
        Worksheet 1: 'AICTE Approved Colleges' (Master data with exact 9 columns)
        Worksheet 2: 'Metadata & Summary' (Audit metrics, timestamps, state counts)
        """
        logger.info(f"Writing {len(df)} records into Excel file: '{output_filepath}'...")
        
        wb = openpyxl.Workbook()
        
        # -----------------------------------------------------------------
        # Sheet 1: Master Data
        # -----------------------------------------------------------------
        ws_data = wb.active
        ws_data.title = "AICTE Approved Colleges"
        ws_data.views.sheetView[0].showGridLines = True
        
        # Header Row
        headers = list(df.columns)
        ws_data.append(headers)
        
        for col_idx, _ in enumerate(headers, start=1):
            cell = ws_data.cell(row=1, column=col_idx)
            cell.fill = cls.HEADER_FILL
            cell.font = cls.HEADER_FONT
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            cell.border = cls.THIN_BORDER
        ws_data.row_dimensions[1].height = 28
        
        # Data Rows
        course_col_idx = headers.index("Course Details") + 1
        faculty_col_idx = headers.index("Faculty Details") + 1
        
        for r_idx, row_values in enumerate(df.values, start=2):
            ws_data.append(list(row_values))
            is_even = (r_idx % 2 == 0)
            row_fill = cls.ZEBRA_FILL if is_even else None
            
            # Format standard cells
            for c_idx in range(1, len(headers) + 1):
                cell = ws_data.cell(row=r_idx, column=c_idx)
                cell.font = cls.REGULAR_FONT
                cell.border = cls.THIN_BORDER
                if row_fill:
                    cell.fill = row_fill
                
                # Alignments
                if headers[c_idx - 1] in ["Aicte ID", "Women", "Minority"]:
                    cell.alignment = Alignment(horizontal="center", vertical="center")
                elif headers[c_idx - 1] in ["Course Details", "Faculty Details"]:
                    cell.alignment = Alignment(horizontal="center", vertical="center")
                else:
                    cell.alignment = Alignment(horizontal="left", vertical="center")

            # Attach interactive hyperlinks for Course Details & Faculty Details
            meta_idx = r_idx - 2
            if meta_idx < len(links_meta):
                meta = links_meta[meta_idx]
                
                # Course Details
                c_cell = ws_data.cell(row=r_idx, column=course_col_idx)
                if meta.get("course_url"):
                    c_cell.hyperlink = meta["course_url"]
                    c_cell.font = cls.LINK_FONT
                
                # Faculty Details
                f_cell = ws_data.cell(row=r_idx, column=faculty_col_idx)
                if meta.get("faculty_url"):
                    f_cell.hyperlink = meta["faculty_url"]
                    f_cell.font = cls.LINK_FONT
                else:
                    f_cell.font = cls.NA_FONT
                    
            ws_data.row_dimensions[r_idx].height = 20

        # Auto-adjust column widths with generous padding
        column_widths = {
            "Aicte ID": 16,
            "Name": 45,
            "Address": 50,
            "District": 22,
            "Institution Type": 28,
            "Women": 10,
            "Minority": 10,
            "Course Details": 16,
            "Faculty Details": 16,
        }
        for col_idx, col_name in enumerate(headers, start=1):
            width = column_widths.get(col_name, 20)
            col_letter = get_column_letter(col_idx)
            ws_data.column_dimensions[col_letter].width = width

        # Freeze the header row
        ws_data.freeze_panes = "A2"

        # -----------------------------------------------------------------
        # Sheet 2: Metadata & State-wise Summary
        # -----------------------------------------------------------------
        ws_meta = wb.create_sheet(title="Metadata & Summary")
        ws_meta.views.sheetView[0].showGridLines = True
        
        now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        now_local = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        meta_rows = [
            ["AICTE APPROVED COLLEGES DATASET METADATA", ""],
            ["Source Portal", AICTEConfig.DASHBOARD_URL],
            ["Target Academic Year", year],
            ["Extraction Timestamp (Local)", now_local],
            ["Extraction Timestamp (UTC)", now_utc],
            ["Total Approved Colleges", len(df)],
            ["Total States / UTs Covered", len(state_counts)],
            ["", ""],
            ["STATE-WISE BREAKDOWN", ""],
            ["State / Union Territory", "Colleges Count"],
        ]
        
        for row in meta_rows:
            ws_meta.append(row)
            
        for state_name, count in sorted(state_counts.items(), key=lambda x: (-x[1], x[0])):
            ws_meta.append([state_name, count])

        # Style Metadata Sheet
        # Title
        ws_meta["A1"].font = Font(name="Calibri", size=13, bold=True, color="1F4E79")
        ws_meta["A9"].font = Font(name="Calibri", size=12, bold=True, color="1F4E79")
        
        # Meta table styling
        for r in range(2, 8):
            ws_meta.cell(row=r, column=1).font = Font(name="Calibri", size=10, bold=True)
            ws_meta.cell(row=r, column=2).font = Font(name="Calibri", size=10)
            
        # State breakdown header
        ws_meta.cell(row=10, column=1).font = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
        ws_meta.cell(row=10, column=1).fill = cls.HEADER_FILL
        ws_meta.cell(row=10, column=2).font = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
        ws_meta.cell(row=10, column=2).fill = cls.HEADER_FILL
        
        ws_meta.column_dimensions["A"].width = 38
        ws_meta.column_dimensions["B"].width = 25
        
        wb.save(output_filepath)
        logger.info(f"Excel file successfully saved: '{os.path.abspath(output_filepath)}'")
        return os.path.abspath(output_filepath)


# =====================================================================
# Module 4: Update Mechanism & Audit Logging
# =====================================================================

class AICTEUpdateManager:
    """
    Manages historical audit records and detects changes (new, modified,
    or deleted colleges) when re-running against existing datasets.
    """
    
    @staticmethod
    def compare_with_existing(
        new_df: pd.DataFrame,
        existing_filepath: str,
        logger: logging.Logger
    ) -> Dict[str, Any]:
        """
        Compares freshly scraped data with a previously saved Excel file.
        Returns a differential summary.
        """
        if not os.path.exists(existing_filepath):
            logger.info("No prior master Excel file found. This is an initial fresh run.")
            return {
                "is_initial": True,
                "previous_count": 0,
                "current_count": len(new_df),
                "new_colleges": len(new_df),
                "modified_colleges": 0,
                "removed_colleges": 0,
                "unchanged_colleges": 0,
            }

        try:
            logger.info(f"Loading existing dataset from '{existing_filepath}' for differential check...")
            old_df = pd.read_excel(existing_filepath, sheet_name="AICTE Approved Colleges")
            old_records = old_df.set_index("Aicte ID").to_dict(orient="index")
            new_records = new_df.set_index("Aicte ID").to_dict(orient="index")
            
            old_ids = set(old_records.keys())
            new_ids = set(new_records.keys())
            
            added_ids = new_ids - old_ids
            removed_ids = old_ids - new_ids
            common_ids = new_ids & old_ids
            
            modified_ids = []
            unchanged_count = 0
            
            for cid in common_ids:
                old_row = old_records[cid]
                new_row = new_records[cid]
                # Compare primary attributes
                diffs = [
                    k for k in ["Name", "Address", "District", "Institution Type", "Women", "Minority"]
                    if str(old_row.get(k, "")).strip() != str(new_row.get(k, "")).strip()
                ]
                if diffs:
                    modified_ids.append(cid)
                else:
                    unchanged_count += 1
            
            diff_summary = {
                "is_initial": False,
                "previous_count": len(old_df),
                "current_count": len(new_df),
                "new_colleges": len(added_ids),
                "modified_colleges": len(modified_ids),
                "removed_colleges": len(removed_ids),
                "unchanged_colleges": unchanged_count,
                "new_ids_sample": list(added_ids)[:10],
                "modified_ids_sample": modified_ids[:10],
            }
            
            logger.info(
                f"Update Comparison: "
                f"Previous: {len(old_df)}, Current: {len(new_df)} | "
                f"New: {len(added_ids)}, Modified: {len(modified_ids)}, "
                f"Removed: {len(removed_ids)}, Unchanged: {unchanged_count}"
            )
            return diff_summary
        except Exception as e:
            logger.warning(f"Could not perform differential check against existing file: {e}")
            return {"is_initial": True, "error": str(e), "current_count": len(new_df)}

    @staticmethod
    def record_audit(
        audit_file: str,
        year: str,
        total_records: int,
        state_counts: Dict[str, int],
        diff_summary: Dict[str, Any],
        output_file: str,
        duration_seconds: float,
        logger: logging.Logger
    ):
        """Appends run metadata to the persistent JSON audit log."""
        audit_entry = {
            "run_timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "run_timestamp_local": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "academic_year": year,
            "total_colleges": total_records,
            "duration_seconds": round(duration_seconds, 2),
            "output_file": output_file,
            "diff_summary": diff_summary,
            "state_counts": state_counts,
        }
        
        history = []
        if os.path.exists(audit_file):
            try:
                with open(audit_file, "r", encoding="utf-8") as f:
                    history = json.load(f)
                if not isinstance(history, list):
                    history = []
            except Exception:
                history = []
                
        history.append(audit_entry)
        
        try:
            with open(audit_file, "w", encoding="utf-8") as f:
                json.dump(history, f, indent=2)
            logger.info(f"Audit log updated: '{audit_file}' (Total recorded runs: {len(history)})")
        except Exception as e:
            logger.error(f"Failed to write audit log: {e}")


# =====================================================================
# Main Orchestration Pipeline
# =====================================================================

def run_scraper(
    year: str = AICTEConfig.DEFAULT_YEAR,
    output_file: str = AICTEConfig.DEFAULT_OUTPUT,
    audit_file: str = AICTEConfig.DEFAULT_AUDIT_LOG,
    workers: int = AICTEConfig.DEFAULT_MAX_WORKERS,
    state_filter: Optional[str] = None,
    force_refresh: bool = False,
    verbose: bool = False
) -> Tuple[pd.DataFrame, str]:
    """
    Main programmatic entry point to run the complete scraping and export pipeline.
    """
    logger = setup_logger(verbose=verbose)
    t0 = time.time()
    
    logger.info("=" * 70)
    logger.info("AICTE APPROVED COLLEGES DATA EXTRACTION PIPELINE")
    logger.info("=" * 70)
    logger.info(f"Target Academic Year : {year}")
    logger.info(f"Output Master File   : {output_file}")
    logger.info(f"Audit History File   : {audit_file}")
    logger.info(f"Worker Threads       : {workers}")
    
    extractor = AICTEDataExtractor(logger=logger)
    
    # Determine states to query
    if state_filter:
        states = [state_filter]
        logger.info(f"Filtering extraction to single state: '{state_filter}'")
    else:
        states = extractor.get_states()
    
    # Step 1: Extract all records
    raw_colleges, state_counts = extractor.extract_all_colleges(
        year=year,
        states=states,
        max_workers=workers
    )
    
    if not raw_colleges:
        logger.error("No colleges were extracted. Exiting without updating file.")
        sys.exit(1)
        
    # Step 2: Clean and format into DataFrame with exact 9 columns
    df, links_meta = AICTEDataFormatter.format_to_dataframe(raw_colleges, year=year)
    logger.info(
        f"Data formatted: {len(df)} unique colleges across 9 institutional columns."
    )
    
    # Step 3: Check update differences if an existing file exists
    diff_summary = {}
    if not force_refresh and os.path.exists(output_file):
        diff_summary = AICTEUpdateManager.compare_with_existing(df, output_file, logger)
    else:
        diff_summary = {
            "is_initial": True,
            "current_count": len(df),
            "new_colleges": len(df),
            "modified_colleges": 0,
            "removed_colleges": 0,
            "unchanged_colleges": 0,
        }

    # Step 4: Export to Excel with openpyxl styling and hyperlinks
    saved_path = AICTEExcelExporter.export(
        df=df,
        links_meta=links_meta,
        output_filepath=output_file,
        year=year,
        state_counts=state_counts,
        logger=logger
    )
    
    # Step 5: Record audit log with timestamp
    duration = time.time() - t0
    AICTEUpdateManager.record_audit(
        audit_file=audit_file,
        year=year,
        total_records=len(df),
        state_counts=state_counts,
        diff_summary=diff_summary,
        output_file=saved_path,
        duration_seconds=duration,
        logger=logger
    )
    
    logger.info("=" * 70)
    logger.info(f"EXTRACTION & MASTER EXCEL GENERATION COMPLETED IN {duration:.2f}s!")
    logger.info(f"Master File : {saved_path}")
    logger.info(f"Audit Log   : {os.path.abspath(audit_file)}")
    logger.info("=" * 70)
    
    return df, saved_path


def parse_arguments() -> argparse.Namespace:
    """Parses command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Scrape and extract complete dataset of AICTE-approved colleges into Excel."
    )
    parser.add_argument(
        "--year",
        type=str,
        default=AICTEConfig.DEFAULT_YEAR,
        help=f"Academic year to scrape (default: {AICTEConfig.DEFAULT_YEAR})"
    )
    parser.add_argument(
        "--output",
        type=str,
        default=AICTEConfig.DEFAULT_OUTPUT,
        help=f"Master Excel file path (default: {AICTEConfig.DEFAULT_OUTPUT})"
    )
    parser.add_argument(
        "--audit-file",
        type=str,
        default=AICTEConfig.DEFAULT_AUDIT_LOG,
        help=f"JSON audit history log path (default: {AICTEConfig.DEFAULT_AUDIT_LOG})"
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=AICTEConfig.DEFAULT_MAX_WORKERS,
        help=f"Number of parallel workers (default: {AICTEConfig.DEFAULT_MAX_WORKERS})"
    )
    parser.add_argument(
        "--state",
        type=str,
        default=None,
        help="Optional single state name to scrape (e.g. 'Goa')"
    )
    parser.add_argument(
        "--force-refresh",
        action="store_true",
        help="Force full overwrite without differential check"
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable detailed debug logging"
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_arguments()
    run_scraper(
        year=args.year,
        output_file=args.output,
        audit_file=args.audit_file,
        workers=args.workers,
        state_filter=args.state,
        force_refresh=args.force_refresh,
        verbose=args.verbose
    )
