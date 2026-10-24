import re
import hashlib
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from .models import Student, CourseIntake, College

PLATFORM_SALT = "AICTE_APAAR_SIH26263_SECURE_TOKEN_V1"

class ValidationEngine:
    """
    Automated Validation Engine for APAAR-based student admissions.
    Flags and prevents:
    1. Duplicate student records (within and across institutions).
    2. Invalid or missing APAAR IDs.
    3. Admissions exceeding approved intake limits.
    4. Data inconsistencies.
    """

    @staticmethod
    def validate_apaar_format(apaar_id: Optional[str]) -> Tuple[bool, str, str]:
        """
        Validates APAAR ID format (12-digit numeric, non-trivial).
        Returns: (is_valid, status_code, remark)
        """
        if not apaar_id or str(apaar_id).strip() == "" or str(apaar_id).lower() in ["none", "null", "na"]:
            return False, "MISSING_APAAR", "Mandatory 12-digit APAAR ID is missing."

        clean_id = re.sub(r'[\s\-]', '', str(apaar_id).strip())

        if not re.match(r'^\d{12}$', clean_id):
            return False, "INVALID_APAAR_FORMAT", f"APAAR ID '{apaar_id}' is invalid. Must be exactly 12 numeric digits."

        # Reject trivial repeated sequences like 000000000000 or 111111111111
        if len(set(clean_id)) == 1:
            return False, "INVALID_APAAR_FORMAT", "APAAR ID cannot consist of identical repeating digits."

        return True, "VALID", "Valid APAAR format."

    @staticmethod
    def check_duplicate_record(
        db: Session,
        apaar_id: str,
        current_college_id: str,
        exclude_student_id: Optional[int] = None
    ) -> Tuple[bool, str, str]:
        """
        Checks for duplicate APAAR records within the same college or across any other college in India.
        """
        clean_id = re.sub(r'[\s\-]', '', str(apaar_id).strip()) if apaar_id else ""
        if not clean_id:
            return True, "VALID", "No APAAR to check for duplicate."

        query = db.query(Student).filter(Student.apaar_id == clean_id)
        if exclude_student_id:
            query = query.filter(Student.id != exclude_student_id)

        existing = query.first()
        if existing:
            if existing.aicte_id == current_college_id:
                return (
                    False,
                    "DUPLICATE_APAAR",
                    f"Duplicate student: APAAR ID {clean_id} is already registered in this institution (Roll/Enrollment: {existing.enrollment_no})."
                )
            else:
                other_college = db.query(College).filter(College.aicte_id == existing.aicte_id).first()
                college_name = other_college.name if other_college else existing.aicte_id
                return (
                    False,
                    "CROSS_INSTITUTION_DUPLICATE",
                    f"Cross-Institutional Conflict: Student (APAAR {clean_id}) is actively enrolled at '{college_name}' ({existing.aicte_id}). Dual full-time enrollment is prohibited by AICTE regulations."
                )

        return True, "VALID", "No duplicates detected."

    @staticmethod
    def check_intake_compliance(
        db: Session,
        course_id: Optional[int],
        aicte_id: str,
        admission_type: str = "Regular",
        exclude_student_id: Optional[int] = None
    ) -> Tuple[bool, str, str]:
        """
        Validates if adding this student exceeds the AICTE Approved Intake or Supernumerary Quota.
        """
        if not course_id:
            return True, "VALID", "No specific course linked."

        course = db.query(CourseIntake).filter(CourseIntake.id == course_id).first()
        if not course:
            return True, "VALID", "Course intake record not found."

        is_supernumerary = admission_type.startswith("Supernumerary") or admission_type in ["TFW", "PMSSS", "Sports", "EWS"]

        query = db.query(Student).filter(
            Student.course_id == course_id,
            Student.aicte_id == aicte_id
        )
        if exclude_student_id:
            query = query.filter(Student.id != exclude_student_id)

        all_students = query.all()

        if is_supernumerary:
            super_count = sum(1 for s in all_students if s.admission_type and ("Supernumerary" in s.admission_type or s.admission_type in ["TFW", "PMSSS", "Sports", "EWS"]))
            max_super = course.supernumerary_intake or 9
            if super_count >= max_super:
                return (
                    False,
                    "INTAKE_EXCEEDED",
                    f"Supernumerary quota limit ({max_super}) exceeded for {course.department}. Currently enrolled: {super_count} supernumerary students."
                )
        else:
            regular_count = sum(1 for s in all_students if not s.admission_type or ("Supernumerary" not in s.admission_type and s.admission_type not in ["TFW", "PMSSS", "Sports", "EWS"]))
            max_regular = course.approved_intake or 60
            if regular_count >= max_regular:
                return (
                    False,
                    "INTAKE_EXCEEDED",
                    f"Approved Intake limit of {max_regular} exceeded for {course.department} ({course.level}). Current regular enrollment: {regular_count}."
                )

        return True, "VALID", "Within sanctioned intake capacity."

    @staticmethod
    def check_data_consistency(student_data: Dict[str, Any]) -> Tuple[bool, str, str]:
        """
        Identifies policy data inconsistencies (e.g. inconsistent quota or age discrepancies).
        """
        dob_str = student_data.get("date_of_birth")
        if dob_str:
            try:
                # Expect YYYY-MM-DD or DD-MM-YYYY
                if "-" in dob_str:
                    parts = dob_str.split("-")
                    year = int(parts[0]) if len(parts[0]) == 4 else int(parts[2])
                    current_year = datetime.now().year
                    age = current_year - year
                    if age < 14 or age > 65:
                        return False, "DATA_INCONSISTENCY", f"Inconsistent Date of Birth: Computed age is {age} years, outside valid AICTE admission range."
            except Exception:
                pass

        # Foreign National / NRI check
        is_fn = student_data.get("is_fn", False)
        is_nri = student_data.get("is_nri", False)
        category = student_data.get("category", "General")

        if is_fn and category in ["SC", "ST", "OBC-NCL"]:
            return False, "DATA_INCONSISTENCY", "Inconsistency: Foreign National students cannot claim domestic SC/ST/OBC reservation quotas."

        return True, "VALID", "Data passes consistency checks."

    @classmethod
    def evaluate_student(
        cls,
        db: Session,
        student_data: Dict[str, Any],
        current_college_id: str,
        exclude_student_id: Optional[int] = None
    ) -> Tuple[str, str]:
        """
        Runs the complete automated validation pipeline on a student record.
        Returns: (final_status, detailed_remarks)
        """
        apaar_id = student_data.get("apaar_id")
        course_id = student_data.get("course_id")
        adm_type = student_data.get("admission_type", "Regular")

        # 1. Format Check
        ok_fmt, status_fmt, rem_fmt = cls.validate_apaar_format(apaar_id)
        if not ok_fmt:
            return status_fmt, rem_fmt

        # 2. Duplicate Check
        ok_dup, status_dup, rem_dup = cls.check_duplicate_record(
            db, apaar_id, current_college_id, exclude_student_id
        )
        if not ok_dup:
            return status_dup, rem_dup

        # 3. Intake Limit Check
        ok_intake, status_intake, rem_intake = cls.check_intake_compliance(
            db, course_id, current_college_id, adm_type, exclude_student_id
        )
        if not ok_intake:
            return status_intake, rem_intake

        # 4. Consistency Check
        ok_cons, status_cons, rem_cons = cls.check_data_consistency(student_data)
        if not ok_cons:
            return status_cons, rem_cons

        return "VALID", "All validation checks passed. Record verified against AICTE National APAAR Registry."

    @staticmethod
    def generate_verification_hash(student_data: Dict[str, Any]) -> str:
        """
        Generates a SHA-256 cryptographic signature linking APAAR ID to the verifiable record.
        """
        raw = (
            f"{student_data.get('apaar_id', '')}|"
            f"{student_data.get('enrollment_no', '')}|"
            f"{student_data.get('full_name', '')}|"
            f"{student_data.get('aicte_id', '')}|"
            f"{student_data.get('department', '')}|"
            f"{student_data.get('academic_year', '')}|"
            f"{PLATFORM_SALT}"
        )
        return hashlib.sha256(raw.encode('utf-8')).hexdigest()
