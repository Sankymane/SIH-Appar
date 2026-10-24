"""
Module: src/registry.py
Component: Mock APAAR Central Registry
Purpose: Emulate the Ministry of Education (MoE) / DigiLocker National Academic Depository
Central APAAR Registry for identity authentication, biometric/KYC status, and existing active enrollments.
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import date
import json
import difflib
from pathlib import Path


class ApaarRegistryRecord:
    def __init__(
        self,
        apaar_id: str,
        full_name: str,
        dob: str,
        gender: str,
        status: str = "ACTIVE",
        aadhaar_linked: bool = True,
        existing_enrollments: Optional[List[Dict[str, Any]]] = None,
    ):
        self.apaar_id = str(apaar_id).replace("-", "").replace(" ", "").strip()
        self.full_name = full_name
        self.dob = dob  # YYYY-MM-DD
        self.gender = gender
        self.status = status  # ACTIVE, DEACTIVATED, FLAGGED_FRAUD
        self.aadhaar_linked = aadhaar_linked
        self.existing_enrollments = existing_enrollments or []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "apaar_id": self.apaar_id,
            "full_name": self.full_name,
            "dob": self.dob,
            "gender": self.gender,
            "status": self.status,
            "aadhaar_linked": self.aadhaar_linked,
            "existing_enrollments": self.existing_enrollments,
        }


class MockApaarRegistry:
    """
    Simulated National Central APAAR Registry with seed data and persistence.
    """
    def __init__(self, data_file_path: Optional[str] = None):
        self.records: Dict[str, ApaarRegistryRecord] = {}
        self.data_file_path = Path(data_file_path) if data_file_path else None
        
        if self.data_file_path and self.data_file_path.exists():
            self.load_from_json(self.data_file_path)
        else:
            self.seed_default_registry()
            if self.data_file_path:
                self.save_to_json(self.data_file_path)

    def seed_default_registry(self):
        """
        Seed registry with foundational citizens, some clean, some flagged, some with prior enrollments.
        """
        # We will populate initial foundational records
        pass

    def add_record(self, record: ApaarRegistryRecord):
        self.records[record.apaar_id] = record

    def add_student(
        self,
        apaar_id: str,
        full_name: str,
        dob: str,
        gender: str,
        status: str = "ACTIVE",
        aadhaar_linked: bool = True,
        existing_enrollments: Optional[List[Dict[str, Any]]] = None,
    ) -> ApaarRegistryRecord:
        clean_id = str(apaar_id).replace("-", "").replace(" ", "").strip()
        rec = ApaarRegistryRecord(
            apaar_id=clean_id,
            full_name=full_name,
            dob=dob,
            gender=gender,
            status=status,
            aadhaar_linked=aadhaar_linked,
            existing_enrollments=existing_enrollments or [],
        )
        self.add_record(rec)
        return rec

    def get_record(self, apaar_id: str) -> Optional[ApaarRegistryRecord]:
        clean_id = str(apaar_id).replace("-", "").replace(" ", "").strip()
        return self.records.get(clean_id)

    def check_active(self, apaar_id: str) -> Tuple[bool, str, str]:
        """
        Presence + status check against the central registry.
        Returns (ok, status_code, remark). Only ACTIVE records pass.
        """
        rec = self.get_record(apaar_id)
        if rec is None:
            return (
                False,
                "APAAR_NOT_IN_REGISTRY",
                f"APAAR ID {apaar_id} was not found in the Central APAAR Registry of active students.",
            )
        if rec.status != "ACTIVE":
            return (
                False,
                "APAAR_INACTIVE",
                f"APAAR ID {apaar_id} exists in the registry but its status is {rec.status}, not ACTIVE.",
            )
        return True, "VALID", "APAAR ID is present and ACTIVE in the Central Registry."

    def save_to_json(self, path: Path):
        data = {apaar_id: rec.to_dict() for apaar_id, rec in self.records.items()}
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def load_from_json(self, path: Path):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.records = {}
        for apaar_id, rec_data in data.items():
            self.records[apaar_id] = ApaarRegistryRecord(
                apaar_id=rec_data["apaar_id"],
                full_name=rec_data["full_name"],
                dob=rec_data["dob"],
                gender=rec_data["gender"],
                status=rec_data.get("status", "ACTIVE"),
                aadhaar_linked=rec_data.get("aadhaar_linked", True),
                existing_enrollments=rec_data.get("existing_enrollments", []),
            )

    def verify_identity(
        self,
        apaar_id: str,
        candidate_name: str,
        candidate_dob: date,
        candidate_gender: str,
    ) -> Tuple[bool, List[Dict[str, Any]], Dict[str, Any]]:
        """
        Verifies student demographic details against Central Registry.
        Returns:
            (is_verified: bool, discrepancies: List[Dict], registry_metadata: Dict)
        """
        clean_id = str(apaar_id).replace("-", "").replace(" ", "").strip()
        record = self.records.get(clean_id)
        
        if not record:
            return False, [{
                "rule_code": "RULE_GHOST_APAAR_NOT_FOUND",
                "message": f"APAAR ID '{apaar_id}' does not exist in Central APAAR Registry.",
                "severity": "CRITICAL",
                "remediation": "Student must register and generate verifiable APAAR via DigiLocker / ABC portal.",
            }], {"found": False}

        discrepancies = []
        is_verified = True

        # Check account status
        if record.status == "DEACTIVATED":
            is_verified = False
            discrepancies.append({
                "rule_code": "RULE_APAAR_DEACTIVATED",
                "message": f"APAAR ID '{apaar_id}' is marked as DEACTIVATED in Central Registry.",
                "severity": "CRITICAL",
                "remediation": "Resolve identity revocation with State Education Board or DigiLocker authority.",
            })
        elif record.status == "FLAGGED_FRAUD":
            is_verified = False
            discrepancies.append({
                "rule_code": "RULE_APAAR_FRAUD_WATCHLIST",
                "message": f"APAAR ID '{apaar_id}' is on AICTE/MoE central fraud prevention watchlist.",
                "severity": "CRITICAL",
                "remediation": "Immediate referral to AICTE Regulation Bureau Legal Vigilance Cell.",
            })

        # Name fuzzy matching
        name_sim = difflib.SequenceMatcher(
            None, candidate_name.strip().lower(), record.full_name.strip().lower()
        ).ratio()
        
        if name_sim < 0.65:
            is_verified = False
            discrepancies.append({
                "rule_code": "RULE_DEMOGRAPHIC_NAME_MISMATCH",
                "message": f"Name mismatch: candidate is '{candidate_name}', registry has '{record.full_name}' (similarity: {name_sim:.2f}).",
                "severity": "HIGH",
                "remediation": "Verify Gazette name change affidavit or correct application data.",
            })
        elif name_sim < 0.85:
            # Minor name variation (e.g. initials expanded)
            discrepancies.append({
                "rule_code": "RULE_DEMOGRAPHIC_NAME_MINOR_VARIATION",
                "message": f"Minor name spelling variation: candidate is '{candidate_name}', registry has '{record.full_name}' (similarity: {name_sim:.2f}).",
                "severity": "WARNING",
                "remediation": "Provide 10th standard matriculation certificate for name reconciliation.",
            })

        # DOB matching
        cand_dob_str = candidate_dob.isoformat() if isinstance(candidate_dob, date) else str(candidate_dob)
        if cand_dob_str != record.dob:
            is_verified = False
            discrepancies.append({
                "rule_code": "RULE_DEMOGRAPHIC_DOB_MISMATCH",
                "message": f"DOB mismatch: candidate declared '{cand_dob_str}', registry recorded '{record.dob}'.",
                "severity": "HIGH",
                "remediation": "Upload official Birth Certificate or Class 10 Passing Certificate.",
            })

        # Gender matching
        if candidate_gender.strip().upper() != record.gender.strip().upper():
            is_verified = False
            discrepancies.append({
                "rule_code": "RULE_DEMOGRAPHIC_GENDER_MISMATCH",
                "message": f"Gender mismatch: candidate declared '{candidate_gender}', registry recorded '{record.gender}'.",
                "severity": "HIGH",
                "remediation": "Check identity documents to rectify gender declaration.",
            })

        meta = {
            "found": True,
            "status": record.status,
            "aadhaar_linked": record.aadhaar_linked,
            "name_similarity": round(name_sim, 3),
            "existing_enrollments": record.existing_enrollments,
        }

        return is_verified, discrepancies, meta

    def get_active_enrollments(self, apaar_id: str) -> List[Dict[str, Any]]:
        clean_id = str(apaar_id).replace("-", "").replace(" ", "").strip()
        record = self.records.get(clean_id)
        if not record:
            return []
        return [e for e in record.existing_enrollments if e.get("status") == "ACTIVE"]

    def record_enrollment(
        self,
        apaar_id: str,
        institution_id: str,
        institution_name: str,
        program_code: str,
        academic_year: str,
        mode: str = "REGULAR_FULLTIME",
    ):
        clean_id = str(apaar_id).replace("-", "").replace(" ", "").strip()
        record = self.records.get(clean_id)
        if record:
            record.existing_enrollments.append({
                "institution_id": institution_id,
                "institution_name": institution_name,
                "program_code": program_code,
                "academic_year": academic_year,
                "status": "ACTIVE",
                "mode": mode,
            })
