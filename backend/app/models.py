from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float
)
from sqlalchemy.orm import relationship
from .database import Base

class College(Base):
    __tablename__ = "colleges"

    aicte_id = Column(String(50), primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    address = Column(Text, nullable=True)
    district = Column(String(100), nullable=True, index=True)
    state = Column(String(100), nullable=True, index=True)
    institution_type = Column(String(100), nullable=True, index=True)
    women = Column(String(5), default="N")
    minority = Column(String(5), default="N")
    course_details_url = Column(Text, nullable=True)
    faculty_details_url = Column(Text, nullable=True)
    
    # Contact & Credentials
    website = Column(String(255), default="https://aicte-india.org")
    contact_email = Column(String(150), nullable=True)
    contact_phone = Column(String(50), default="+91 8767434172")
    password_hash = Column(String(255), default="aicte@123")
    nodal_officer_name = Column(String(150), default="Dr. Academic Registrar")
    nodal_officer_email = Column(String(150), default="registrar@institution.edu.in")
    nodal_officer_mobile = Column(String(20), default="+91 8767434172")
    registered_phone = Column(String(20), default="+91 8767434172")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    courses = relationship("CourseIntake", back_populates="college", cascade="all, delete-orphan")
    students = relationship("Student", back_populates="college", cascade="all, delete-orphan")
    remarks = relationship("StudentRemark", back_populates="college", cascade="all, delete-orphan")


class CourseIntake(Base):
    __tablename__ = "course_intakes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    aicte_id = Column(String(50), ForeignKey("colleges.aicte_id"), index=True, nullable=False)
    program = Column(String(100), default="Engineering and Technology")
    department = Column(String(150), nullable=False)
    level = Column(String(50), default="UG")
    shift = Column(String(50), default="1st Shift")
    approved_intake = Column(Integer, default=60)
    supernumerary_intake = Column(Integer, default=9)  # 15% supernumerary quota (TFW, PMSSS, etc.)
    nri_quota = Column(Integer, default=3)
    fn_quota = Column(Integer, default=3)
    academic_year = Column(String(20), default="2026-2027")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    college = relationship("College", back_populates="courses")
    students = relationship("Student", back_populates="course")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, autoincrement=True)
    apaar_id = Column(String(50), index=True, nullable=True)  # Nullable for missing-ID test case
    enrollment_no = Column(String(50), index=True, nullable=False)
    full_name = Column(String(150), nullable=False)
    gender = Column(String(20), default="Male")  # Male, Female, Other
    category = Column(String(50), default="General")  # General, OBC-NCL, SC, ST, EWS
    date_of_birth = Column(String(20), nullable=True)
    date_of_admission = Column(String(20), nullable=True)
    academic_year = Column(String(20), default="2026-2027")

    # Academic Bank of Credits (ABC) info
    credits_earned = Column(Integer, default=84)
    cgpa = Column(Float, default=8.85)

    # College & Course association
    aicte_id = Column(String(50), ForeignKey("colleges.aicte_id"), index=True, nullable=False)
    course_id = Column(Integer, ForeignKey("course_intakes.id"), index=True, nullable=True)
    program = Column(String(100), default="Engineering and Technology")
    department = Column(String(150), nullable=False)
    level = Column(String(50), default="UG")

    # Mandatory Policy Fields
    admission_type = Column(String(50), default="Regular")  # Regular, Supernumerary-TFW, Supernumerary-PMSSS, Supernumerary-Sports, Supernumerary-EWS
    is_nri = Column(Boolean, default=False)
    is_oci = Column(Boolean, default=False)
    is_fn = Column(Boolean, default=False)

    # Automated Validation Engine Fields
    # VALID, DUPLICATE_APAAR, CROSS_INSTITUTION_DUPLICATE, MISSING_APAAR, INVALID_APAAR_FORMAT, INTAKE_EXCEEDED, DATA_INCONSISTENCY
    validation_status = Column(String(50), default="VALID", index=True)
    validation_remarks = Column(Text, nullable=True)

    # Digital Verifiable Identity
    verification_hash = Column(String(128), nullable=True)
    is_verified = Column(Boolean, default=True)
    verified_by = Column(String(100), default="AICTE-APAAR Central Trust Authority")
    verified_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    college = relationship("College", back_populates="students")
    course = relationship("CourseIntake", back_populates="students")
    remarks = relationship("StudentRemark", back_populates="student", cascade="all, delete-orphan")


class StudentRemark(Base):
    __tablename__ = "student_remarks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    apaar_id = Column(String(50), index=True, nullable=False)
    student_name = Column(String(150), nullable=False)
    aicte_id = Column(String(50), ForeignKey("colleges.aicte_id"), index=True, nullable=False)
    remark_type = Column(String(100), nullable=False)  # Wrong College Mapping, Inaccurate Personal Details, Credit Mismatch, Quota/Category Error, Other
    description = Column(Text, nullable=False)
    status = Column(String(50), default="PENDING", index=True)  # PENDING, UNDER_REVIEW, RESOLVED
    contact_email = Column(String(150), nullable=True)
    contact_mobile = Column(String(20), default="8767434172")
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    resolved_at = Column(DateTime, nullable=True)

    college = relationship("College", back_populates="remarks")
    student = relationship("Student", back_populates="remarks")


class HistoricalEnrollment(Base):
    __tablename__ = "historical_enrollments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    academic_year = Column(String(20), index=True, nullable=False)  # e.g. 2017-2018 ... 2026-2027
    year_int = Column(Integer, index=True, nullable=False)
    month = Column(Integer, default=8)  # Admission cycle peak (July=7, August=8, September=9)
    state = Column(String(100), index=True, nullable=False)
    programme = Column(String(100), index=True, nullable=False)
    institution_type = Column(String(100), index=True, nullable=False)
    aicte_id = Column(String(50), ForeignKey("colleges.aicte_id"), index=True, nullable=True)
    college_name = Column(String(255), nullable=True)
    approved_intake = Column(Integer, default=60)
    actual_enrolment = Column(Integer, default=60)
    supernumerary_admitted = Column(Integer, default=5)
    growth_rate_pct = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    action = Column(String(100), nullable=False, index=True)  # STUDENT_ENROLLED, BULK_UPLOAD, STATUS_UPDATED, VERIFIED, INTAKE_CHECK, REMARK_RAISED, COLLEGE_ADDED, COLLEGE_REMOVED
    entity_type = Column(String(50), nullable=False)  # Student, College, Intake, Remark
    entity_id = Column(String(100), nullable=True)
    actor_id = Column(String(100), nullable=False)
    actor_name = Column(String(150), default="Institute Admin")
    actor_role = Column(String(50), default="INSTITUTE_ADMIN")  # INSTITUTE_ADMIN, AICTE_VERIFIER, STUDENT, SYSTEM
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
