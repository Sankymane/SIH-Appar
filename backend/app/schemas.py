from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# ---------------------------------------------------------------------------
# College Schemas
# ---------------------------------------------------------------------------
class CourseIntakeSchema(BaseModel):
    id: int
    program: str
    department: str
    level: str
    shift: str
    approved_intake: int
    supernumerary_intake: int
    nri_quota: int
    fn_quota: int
    academic_year: str
    enrolled_count: Optional[int] = 0
    supernumerary_count: Optional[int] = 0

    class Config:
        from_attributes = True

class CollegeSummarySchema(BaseModel):
    aicte_id: str
    name: str
    address: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    institution_type: Optional[str] = None
    women: str = "N"
    minority: str = "N"
    total_approved_intake: int = 0
    total_enrolled_students: int = 0
    compliance_status: str = "COMPLIANT"  # COMPLIANT, EXCEEDED, WARNING

    class Config:
        from_attributes = True

class CollegeDetailSchema(BaseModel):
    aicte_id: str
    name: str
    address: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    institution_type: Optional[str] = None
    women: str = "N"
    minority: str = "N"
    website: Optional[str] = "https://aicte-india.org"
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    nodal_officer_name: Optional[str] = None
    nodal_officer_email: Optional[str] = None
    nodal_officer_mobile: Optional[str] = None
    total_approved_intake: int = 0
    total_enrolled_students: int = 0
    total_supernumerary_enrolled: int = 0
    flagged_records_count: int = 0
    courses: List[CourseIntakeSchema] = []

    class Config:
        from_attributes = True

# ---------------------------------------------------------------------------
# Student Schemas
# ---------------------------------------------------------------------------
class StudentCreateSchema(BaseModel):
    apaar_id: Optional[str] = None
    enrollment_no: str
    full_name: str
    gender: str = "Male"
    category: str = "General"
    date_of_birth: Optional[str] = None
    date_of_admission: Optional[str] = None
    academic_year: str = "2026-2027"
    course_id: Optional[int] = None
    program: Optional[str] = "Engineering and Technology"
    department: str
    level: str = "UG"
    admission_type: str = "Regular"
    is_nri: bool = False
    is_oci: bool = False
    is_fn: bool = False

class StudentUpdateSchema(BaseModel):
    apaar_id: Optional[str] = None
    enrollment_no: Optional[str] = None
    full_name: Optional[str] = None
    gender: Optional[str] = None
    category: Optional[str] = None
    date_of_birth: Optional[str] = None
    date_of_admission: Optional[str] = None
    department: Optional[str] = None
    admission_type: Optional[str] = None
    is_nri: Optional[bool] = None
    is_oci: Optional[bool] = None
    is_fn: Optional[bool] = None

class StudentOutSchema(BaseModel):
    id: int
    apaar_id: Optional[str] = None
    masked_apaar_id: Optional[str] = None
    enrollment_no: str
    full_name: str
    gender: str
    category: str
    date_of_birth: Optional[str] = None
    date_of_admission: Optional[str] = None
    academic_year: str
    aicte_id: str
    college_name: Optional[str] = None
    course_id: Optional[int] = None
    program: str
    department: str
    level: str
    admission_type: str
    is_nri: bool
    is_oci: bool
    is_fn: bool
    validation_status: str
    validation_remarks: Optional[str] = None
    verification_hash: Optional[str] = None
    is_verified: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BulkUploadResultSchema(BaseModel):
    total_processed: int
    successfully_enrolled: int
    flagged_records: int
    errors: List[Dict[str, Any]] = []
    created_students: List[StudentOutSchema] = []

# ---------------------------------------------------------------------------
# Verification & Certificate Schemas
# ---------------------------------------------------------------------------
class VerificationResponseSchema(BaseModel):
    is_valid: bool
    apaar_id: str
    student_name: Optional[str] = None
    enrollment_no: Optional[str] = None
    college_name: Optional[str] = None
    aicte_id: Optional[str] = None
    program: Optional[str] = None
    department: Optional[str] = None
    level: Optional[str] = None
    admission_year: Optional[str] = None
    verification_status: str
    validation_remarks: Optional[str] = None
    digital_signature_hash: Optional[str] = None
    aadhaar_seeded: bool = True
    digilocker_verified: bool = True
    verified_at: Optional[str] = None

# ---------------------------------------------------------------------------
# Auth & Login (3-Step Workflow)
# ---------------------------------------------------------------------------
class InstituteSearchItem(BaseModel):
    aicte_id: str
    name: str
    district: Optional[str] = None
    state: Optional[str] = None

class LoginStep1Select(BaseModel):
    aicte_id: str

class LoginStep2Password(BaseModel):
    aicte_id: str
    password: str

class LoginStep3OTP(BaseModel):
    aicte_id: str
    otp: str
    session_token: str

class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    aicte_id: str
    college_name: str
    role: str  # INSTITUTE_ADMIN or AICTE_VERIFIER

# ---------------------------------------------------------------------------
# Audit & Analytics Schemas
# ---------------------------------------------------------------------------
class AuditLogSchema(BaseModel):
    id: int
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    actor_id: str
    actor_name: str
    actor_role: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class AnalyticsSummarySchema(BaseModel):
    total_institutions: int
    total_approved_intake: int
    total_enrolled_students: int
    total_apaar_seeded: int
    total_flagged_violations: int
    intake_utilization_rate: float
    category_distribution: Dict[str, int]
    admission_quota_distribution: Dict[str, int]
    gender_distribution: Dict[str, int]
    validation_status_breakdown: Dict[str, int]
