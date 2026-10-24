"""
Module: src/schema.py
Component: Schemas & Data Contracts
Purpose: Pydantic models and data contracts for student enrollment, AICTE regulatory thresholds,
violation telemetry, and batch verification reports.
"""

from datetime import date, datetime
from enum import Enum
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict


class QuotaCategory(str, Enum):
    OPEN = "OPEN"
    OBC = "OBC"
    SC = "SC"
    ST = "ST"
    EWS = "EWS"
    TFW = "TFW"
    PMSSS = "PMSSS"
    NRI = "NRI"
    DEFENSE = "DEFENSE"
    SPORTS = "SPORTS"


class EnrollmentType(str, Enum):
    REGULAR = "REGULAR"
    LATERAL_ENTRY = "LATERAL_ENTRY"
    SUPERNUMERARY_TFW = "SUPERNUMERARY_TFW"
    SUPERNUMERARY_EWS = "SUPERNUMERARY_EWS"
    SUPERNUMERARY_PMSSS = "SUPERNUMERARY_PMSSS"
    SUPERNUMERARY_NRI = "SUPERNUMERARY_NRI"
    SUPERNUMERARY_SPORTS = "SUPERNUMERARY_SPORTS"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ViolationSeverity(str, Enum):
    INFO = "INFO"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    WARNING = "WARNING"
    HIGH = "HIGH"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class ViolationDetail(BaseModel):
    layer: str = Field(..., description="Validation layer (e.g. L1_FORMAT, L2_IDENTITY, L3_INTAKE, L4_CONCURRENCY, L5_STATISTICAL)")
    rule_code: str = Field(..., description="Machine-readable rule violation code")
    severity: ViolationSeverity = Field(..., description="Severity classification")
    message: str = Field(..., description="Human-readable explanation of breach")
    remediation: str = Field(..., description="Suggested regulatory or administrative fix")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional context or diagnostics")


class StudentEnrollmentRecord(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    record_id: str = Field(..., description="Unique record identifier in the upload batch")
    apaar_id: str = Field(..., description="12-digit APAAR/EduLocker ID")
    student_name: str = Field(..., min_length=2, description="Legal full name of the student")
    dob: date = Field(..., description="Date of birth (YYYY-MM-DD)")
    gender: str = Field(..., pattern=r"^[MFO]$", description="Gender (M/F/O)")
    institution_id: str = Field(..., description="AICTE Permanent Institute ID, e.g. AICTE-1-1002341")
    institution_name: str = Field(..., description="Name of the educational institution")
    program_code: str = Field(..., description="AICTE Approved Program Code, e.g. BTECH-CSE")
    program_name: Optional[str] = Field(default=None, description="Full title of degree program")
    academic_year: str = Field(..., pattern=r"^\d{4}-\d{4}$", description="Academic Year, e.g. 2026-2027")
    enrollment_type: EnrollmentType = Field(default=EnrollmentType.REGULAR, description="Admission seat category")
    quota_category: QuotaCategory = Field(default=QuotaCategory.OPEN, description="Reservation / Supernumerary category")
    admission_date: date = Field(..., description="Official date of admission entry")
    student_email: Optional[str] = Field(default=None, description="Student contact email")
    student_phone: Optional[str] = Field(default=None, description="Student contact phone number")
    pin_code: Optional[str] = Field(default=None, description="Permanent address postal PIN code")
    domicile_state: Optional[str] = Field(default=None, description="Domicile state of student")
    annual_family_income: Optional[float] = Field(default=None, description="Annual family income in INR")
    qualification_exam: Optional[str] = Field(default=None, description="Qualifying entrance exam name (JEE, CET, etc.)")
    percentile_score: Optional[float] = Field(default=None, ge=0.0, le=100.0, description="Entrance merit percentile score")

    @field_validator("apaar_id", mode="before")
    @classmethod
    def clean_apaar_id(cls, v: Any) -> str:
        if v is None:
            return ""
        s = str(v)
        return s.replace("-", "").replace(" ", "").strip()

    @field_validator("student_phone", "pin_code", mode="before")
    @classmethod
    def stringify_codes(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        return str(v).strip()


class InstitutionIntakeConfig(BaseModel):
    institution_id: str = Field(..., description="AICTE Permanent Institute ID")
    institution_name: str = Field(..., description="College Name")
    program_code: str = Field(..., description="Program Code (e.g. BTECH-CSE)")
    academic_year: str = Field(..., description="Academic Session (e.g. 2026-2027)")
    approved_intake: int = Field(..., gt=0, description="AICTE Sanctioned Regular Intake")
    max_tfw_pct: float = Field(default=0.05, ge=0.0, le=0.10, description="Max TFW supernumerary quota (typically 5%)")
    max_ews_pct: float = Field(default=0.10, ge=0.0, le=0.20, description="Max EWS supernumerary quota (typically 10%)")
    max_lateral_pct: float = Field(default=0.10, ge=0.0, le=0.20, description="Max Lateral Entry percentage of approved intake")
    max_pmsss_seats: int = Field(default=2, ge=0, description="Max PMSSS supernumerary seats")
    max_nri_pct: float = Field(default=0.15, ge=0.0, le=0.25, description="Max NRI supernumerary quota (where approved)")
    vacant_prior_year_seats: int = Field(default=0, ge=0, description="Unfilled seats from 1st year for lateral calculation")

    @property
    def max_tfw_seats(self) -> int:
        import math
        return math.ceil(self.approved_intake * self.max_tfw_pct)

    @property
    def max_ews_seats(self) -> int:
        import math
        return math.ceil(self.approved_intake * self.max_ews_pct)

    @property
    def max_lateral_seats(self) -> int:
        import math
        return math.ceil(self.approved_intake * self.max_lateral_pct) + self.vacant_prior_year_seats

    @property
    def total_max_capacity(self) -> int:
        return self.approved_intake + self.max_tfw_seats + self.max_ews_seats + self.max_pmsss_seats


class RecordVerificationResult(BaseModel):
    record_id: str
    apaar_id: str
    student_name: str
    institution_id: str
    program_code: str
    is_valid: bool
    risk_level: RiskLevel
    composite_risk_score: float = Field(..., ge=0.0, le=100.0)
    layer_scores: Dict[str, float] = Field(default_factory=dict)
    violations: List[ViolationDetail] = Field(default_factory=list)


class ProgramUtilizationSummary(BaseModel):
    program_code: str
    approved_intake: int
    regular_enrolled: int
    tfw_enrolled: int
    tfw_cap: int
    ews_enrolled: int
    ews_cap: int
    lateral_enrolled: int
    lateral_cap: int
    pmsss_enrolled: int
    pmsss_cap: int
    total_enrolled: int
    is_overflow: bool
    overflow_count: int


class BatchReport(BaseModel):
    batch_id: str
    institution_id: str
    institution_name: str
    academic_year: str
    timestamp: datetime = Field(default_factory=datetime.now)
    total_records: int
    clean_records_count: int
    flagged_records_count: int
    critical_records_count: int
    high_records_count: int
    medium_records_count: int
    low_records_count: int
    institution_risk_index: float = Field(..., ge=0.0, le=100.0)
    regulatory_verdict: str = Field(..., description="APPROVED, PROVISIONAL_AUDIT, or REJECTED_HEARING")
    program_capacity_utilization: Dict[str, ProgramUtilizationSummary] = Field(default_factory=dict)
    anomaly_clusters: List[Dict[str, Any]] = Field(default_factory=list)
    record_results: List[RecordVerificationResult] = Field(default_factory=list)

    def model_dump(self, *args, **kwargs):
        if "mode" not in kwargs:
            kwargs["mode"] = "json"
        return super().model_dump(*args, **kwargs)


class ProgrammeSpec(BaseModel):
    programme_code: str
    programme_name: str
    sanctioned_intake: int
    max_tfw_pct: float = Field(default=0.05, ge=0.0, le=0.10)
    max_ews_pct: float = Field(default=0.10, ge=0.0, le=0.20)
    max_lateral_pct: float = Field(default=0.10, ge=0.0, le=0.20)
    max_pmsss_seats: int = Field(default=2, ge=0)
    max_nri_pct: float = Field(default=0.15, ge=0.0, le=0.25)
    vacant_prior_year_seats: int = Field(default=0, ge=0)

    def to_intake_config(
        self,
        institution_id: str = "DEFAULT_INSTITUTION",
        institution_name: str = "Default Institution",
        academic_year: str = "2026-2027",
    ) -> InstitutionIntakeConfig:
        return InstitutionIntakeConfig(
            institution_id=institution_id,
            institution_name=institution_name,
            program_code=self.programme_code,
            academic_year=academic_year,
            approved_intake=self.sanctioned_intake,
            max_tfw_pct=self.max_tfw_pct,
            max_ews_pct=self.max_ews_pct,
            max_lateral_pct=self.max_lateral_pct,
            max_pmsss_seats=self.max_pmsss_seats,
            max_nri_pct=self.max_nri_pct,
            vacant_prior_year_seats=self.vacant_prior_year_seats,
        )

