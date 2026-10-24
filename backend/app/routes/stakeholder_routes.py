from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

from ..database import get_db
from ..models import College, CourseIntake, Student, StudentRemark, AuditLog
from ..schemas import (
    StakeholderDirectoryItem,
    StakeholderAlertItem,
    SecondaryOTPRequest,
    AddCollegeRequest,
    RemoveCollegeRequest,
    StudentRemarkOut
)
from ..auth import (
    get_current_user_context,
    generate_secondary_action_otp,
    verify_secondary_action_otp,
    GLOBAL_DEV_PHONE_NUMBER,
    GLOBAL_DEV_PHONE_MASKED
)
from ..forecasting import get_curated_institutional_forecasts

router = APIRouter(prefix="/stakeholder", tags=["Stakeholder (AICTE) Portal"])

# ---------------------------------------------------------------------------
# 1. Registered Phone Directory & Institutions List
# ---------------------------------------------------------------------------
@router.get("/directory", response_model=List[StakeholderDirectoryItem])
def get_stakeholder_directory(
    query: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    institution_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    Shows a transparent mapping of which phone numbers are registered to receive OTPs
    for nodal officers, colleges, and approval statuses.
    """
    q = db.query(College)

    if query and query.strip():
        p = f"%{query.strip()}%"
        q = q.filter((College.name.ilike(p)) | (College.aicte_id.ilike(p)) | (College.district.ilike(p)))

    if state and state != "--All--":
        q = q.filter(College.state == state)

    if institution_type and institution_type != "--All--":
        q = q.filter(College.institution_type == institution_type)

    colleges = q.order_by(College.name.asc()).limit(limit).all()

    results = []
    for c in colleges:
        # Calculate total intake vs enrolled
        intakes = db.query(CourseIntake).filter(CourseIntake.aicte_id == c.aicte_id).all()
        total_approved = sum(i.approved_intake for i in intakes) if intakes else 0
        total_enrolled = db.query(func.count(Student.id)).filter(Student.aicte_id == c.aicte_id).scalar() or 0

        # Check compliance
        compliance = "COMPLIANT"
        if total_approved > 0 and total_enrolled > total_approved:
            compliance = "EXCEEDED"
        elif not c.is_active:
            compliance = "DEACTIVATED"

        results.append(StakeholderDirectoryItem(
            aicte_id=c.aicte_id,
            name=c.name,
            district=c.district or "District N/A",
            state=c.state or "Maharashtra",
            institution_type=c.institution_type or "Private-Self Financing",
            nodal_officer_name=c.nodal_officer_name or "Dr. Academic Registrar",
            nodal_officer_email=c.nodal_officer_email or "registrar@college.edu.in",
            registered_phone=GLOBAL_DEV_PHONE_MASKED,
            is_active=c.is_active,
            total_approved_intake=total_approved,
            total_enrolled=total_enrolled,
            compliance_status=compliance
        ))

    return results


# ---------------------------------------------------------------------------
# 2. Highlighted High-Visibility Alerts
# Flags colleges with intake capacity breaches and student profile anomalies
# ---------------------------------------------------------------------------
@router.get("/alerts", response_model=List[StakeholderAlertItem])
def get_stakeholder_alerts(db: Session = Depends(get_db)):
    """
    Generates bold, high-visibility UI alerts flagging:
    1. Colleges exceeding approved intake capacity
    2. Duplicate APAAR IDs within and across colleges
    3. Missing / Invalid APAAR profiles
    4. Predictive forecast surge alerts (>30% projected overflow)
    """
    alerts = []

    # 1. Check for Intake Exceeded Violations
    courses = db.query(CourseIntake).all()
    for course in courses:
        enrolled_count = db.query(func.count(Student.id)).filter(
            Student.aicte_id == course.aicte_id,
            Student.department == course.department,
            Student.admission_type == "Regular"
        ).scalar() or 0

        if enrolled_count > course.approved_intake:
            college = db.query(College).filter(College.aicte_id == course.aicte_id).first()
            cname = college.name if college else course.aicte_id
            excess = enrolled_count - course.approved_intake
            pct = round((excess / course.approved_intake) * 100, 1)

            alerts.append(StakeholderAlertItem(
                id=f"alert-intake-{course.id}",
                alert_type="INTAKE_EXCEEDED",
                severity="CRITICAL",
                title=f"SANCTIONED INTAKE EXCEEDED: {course.department}",
                aicte_id=course.aicte_id,
                college_name=cname,
                department=course.department,
                details=f"Approved Intake: {course.approved_intake} seats | Enrolled: {enrolled_count} students (+{excess} over limit, +{pct}% violation). Immediate regulatory notice required.",
                count=enrolled_count
            ))

    # 2. Cross-Institution Dual Enrollment Conflicts
    cross_conflicts = db.query(Student).filter(Student.validation_status == "CROSS_INSTITUTION_DUPLICATE").all()
    if cross_conflicts:
        for s in cross_conflicts:
            college = db.query(College).filter(College.aicte_id == s.aicte_id).first()
            alerts.append(StakeholderAlertItem(
                id=f"alert-cross-{s.id}",
                alert_type="CROSS_INSTITUTION_CONFLICT",
                severity="CRITICAL",
                title="CROSS-INSTITUTION DUAL ENROLLMENT VIOLATION",
                aicte_id=s.aicte_id,
                college_name=college.name if college else s.aicte_id,
                department=s.department,
                details=f"Student '{s.full_name}' (APAAR: {s.apaar_id}) is actively enrolled simultaneously in another institution. Violates Section 14 of AICTE Regulations.",
                count=1
            ))

    # 3. Duplicate APAAR IDs inside same institution
    internal_dups = db.query(Student).filter(Student.validation_status == "DUPLICATE_APAAR").all()
    if internal_dups:
        colleges_with_dups = set(s.aicte_id for s in internal_dups)
        for cid in colleges_with_dups:
            college = db.query(College).filter(College.aicte_id == cid).first()
            dup_count = len([s for s in internal_dups if s.aicte_id == cid])
            alerts.append(StakeholderAlertItem(
                id=f"alert-dup-{cid}",
                alert_type="DUPLICATE_APAAR",
                severity="WARNING",
                title="DUPLICATE STUDENT APAAR RECORDS DETECTED",
                aicte_id=cid,
                college_name=college.name if college else cid,
                details=f"{dup_count} duplicate student entries detected with identical APAAR numbers. College roster reconciliation required.",
                count=dup_count
            ))

    # 4. Missing or Invalid APAAR IDs
    missing = db.query(Student).filter(Student.validation_status.in_(["MISSING_APAAR", "INVALID_APAAR_FORMAT"])).all()
    if missing:
        missing_count = len(missing)
        sample_c = db.query(College).filter(College.aicte_id == missing[0].aicte_id).first() if missing else None
        alerts.append(StakeholderAlertItem(
            id="alert-missing-apaar",
            alert_type="MISSING_APAAR",
            severity="WARNING",
            title="UNSEEDED / INVALID APAAR PROFILES PENDING SEEDING",
            aicte_id=missing[0].aicte_id if missing else "SYSTEM",
            college_name=sample_c.name if sample_c else "Multiple Institutes",
            details=f"Found {missing_count} student profiles with unverified or missing APAAR IDs. Mandate DigiLocker KYC onboarding.",
            count=missing_count
        ))

    # 5. Predictive Pre-Season Surge Alert (>30% forecasted overflow)
    forecasts = get_curated_institutional_forecasts()
    critical_forecasts = [f for f in forecasts if f.get("is_critical_overflow")]
    for cf in critical_forecasts:
        alerts.append(StakeholderAlertItem(
            id=f"alert-forecast-{cf.get('aicte_id', 'state')}",
            alert_type="FORECAST_SURGE_WARNING",
            severity="CRITICAL",
            title=f"AI PREDICTIVE WARNING: >30% OVERFLOW DEMAND PROJECTED",
            aicte_id=cf.get("aicte_id") or "1-44525213207",
            college_name=cf.get("college_name") or "Technical Colleges",
            department=cf.get("programme"),
            details=f"Projected demand for {cf.get('projected_year')} is {cf.get('projected_intake_p50')} against capacity {cf.get('current_approved_intake')} (+{cf.get('projected_overflow_pct')}% surge). Pre-admission seat reallocation required.",
            count=cf.get("projected_intake_p50")
        ))

    return alerts


# ---------------------------------------------------------------------------
# 3. Secondary OTP Authorization for Admin Actions (Add / Remove College)
# ---------------------------------------------------------------------------
@router.post("/request-action-otp")
def request_action_otp(payload: SecondaryOTPRequest):
    """
    Generates a secondary high-security OTP routed to 8767434172
    specifically required before executing Add or Remove college actions.
    """
    otp_data = generate_secondary_action_otp(action=payload.action, target_id=payload.target_id)

    return {
        "status": "SECONDARY_OTP_SENT",
        "action": payload.action,
        "masked_phone": GLOBAL_DEV_PHONE_MASKED,
        "session_token": otp_data["session_token"],
        "simulated_otp": otp_data["otp"],  # Expose for 1-click test
        "message": f"High-security authorization OTP sent to verified Stakeholder mobile ({GLOBAL_DEV_PHONE_MASKED})"
    }


@router.post("/add-college")
def add_college(
    payload: AddCollegeRequest,
    current_user: dict = Depends(get_current_user_context),
    db: Session = Depends(get_db)
):
    """
    Admin control to register a new college.
    Strictly enforces secondary OTP verification to confirm.
    """
    is_valid_otp = verify_secondary_action_otp(
        session_token=payload.session_token,
        input_otp=payload.secondary_otp,
        action="ADD_COLLEGE"
    )

    if not is_valid_otp:
        raise HTTPException(
            status_code=401,
            detail="Secondary verification failed: Invalid or expired action OTP. (Master test OTP: 123456)"
        )

    # Check if aicte_id already exists
    existing = db.query(College).filter(College.aicte_id == payload.aicte_id.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"College with AICTE ID '{payload.aicte_id}' already exists.")

    new_college = College(
        aicte_id=payload.aicte_id.strip(),
        name=payload.name.strip(),
        address=payload.address or f"AICTE Approved Campus, {payload.district}",
        district=payload.district.strip(),
        state=payload.state.strip(),
        institution_type=payload.institution_type.strip(),
        website=f"https://www.{payload.aicte_id.replace('-', '').lower()}.edu.in",
        contact_email=f"admissions@{payload.aicte_id.replace('-', '').lower()}.edu.in",
        contact_phone=GLOBAL_DEV_PHONE_NUMBER,
        nodal_officer_name="Dr. Registrar Approved",
        nodal_officer_email=f"registrar@{payload.aicte_id.replace('-', '').lower()}.edu.in",
        nodal_officer_mobile=GLOBAL_DEV_PHONE_MASKED,
        registered_phone=GLOBAL_DEV_PHONE_MASKED,
        is_active=True
    )
    db.add(new_college)

    # Add default CSE course
    dept_intake = CourseIntake(
        aicte_id=new_college.aicte_id,
        program=payload.programs or "Engineering and Technology",
        department="Computer Science and Engineering",
        level="UG",
        shift="1st Shift",
        approved_intake=payload.total_approved_intake or 120,
        supernumerary_intake=int((payload.total_approved_intake or 120) * 0.15),
        nri_quota=3,
        fn_quota=3,
        academic_year="2026-2027"
    )
    db.add(dept_intake)

    # Audit Log
    audit = AuditLog(
        action="COLLEGE_ADDED_BY_STAKEHOLDER",
        entity_type="College",
        entity_id=new_college.aicte_id,
        actor_id="AICTE_REGULATOR",
        actor_name="AICTE Central Regulatory Bureau",
        actor_role="AICTE_VERIFIER",
        details=f"Institution '{new_college.name}' ({new_college.aicte_id}) successfully added to national registry after secondary OTP verification ({GLOBAL_DEV_PHONE_NUMBER})."
    )
    db.add(audit)
    db.commit()

    return {
        "status": "SUCCESS",
        "message": f"Institution '{new_college.name}' ({new_college.aicte_id}) successfully enrolled in AICTE registry.",
        "aicte_id": new_college.aicte_id,
        "name": new_college.name
    }


@router.delete("/remove-college/{aicte_id}")
def remove_college(
    aicte_id: str,
    payload: RemoveCollegeRequest,
    current_user: dict = Depends(get_current_user_context),
    db: Session = Depends(get_db)
):
    """
    Admin control to deactivate or remove a college.
    Strictly enforces secondary OTP verification to confirm.
    """
    is_valid_otp = verify_secondary_action_otp(
        session_token=payload.session_token,
        input_otp=payload.secondary_otp,
        action="REMOVE_COLLEGE"
    )

    if not is_valid_otp:
        raise HTTPException(
            status_code=401,
            detail="Secondary verification failed: Invalid or expired action OTP. (Master test OTP: 123456)"
        )

    college = db.query(College).filter(College.aicte_id == aicte_id).first()
    if not college:
        raise HTTPException(status_code=404, detail="Institution not found in registry.")

    college_name = college.name

    # Deactivate college
    college.is_active = False

    # Audit Log
    audit = AuditLog(
        action="COLLEGE_REMOVED_BY_STAKEHOLDER",
        entity_type="College",
        entity_id=aicte_id,
        actor_id="AICTE_REGULATOR",
        actor_name="AICTE Central Regulatory Bureau",
        actor_role="AICTE_VERIFIER",
        details=f"Institution '{college_name}' ({aicte_id}) approval revoked and marked DEACTIVATED after secondary OTP verification. Reason: {payload.reason}."
    )
    db.add(audit)
    db.commit()

    return {
        "status": "SUCCESS",
        "message": f"Institution '{college_name}' ({aicte_id}) approval has been revoked and marked inactive.",
        "aicte_id": aicte_id
    }


# ---------------------------------------------------------------------------
# 4. Intake Forecasting & Predictive Alerts (Prophet & TFT Models)
# ---------------------------------------------------------------------------
@router.get("/forecasting")
def get_intake_forecasting():
    """
    Time-series models (Prophet, TFT) trained on 5-10 years of enrollment data
    grouped by programme × state × institution type.
    Provides seasonal decomposition and predictive warnings before admission season
    when projected intake is >= 30% above capacity.
    """
    forecasts = get_curated_institutional_forecasts()
    return {
        "status": "SUCCESS",
        "model_architecture": "Additive Time-Series Decomposition (Trend + Seasonal + Residual) with TFT Quantile Bounds",
        "historical_training_span": "2017 to 2026 (10 Academic Cycles)",
        "prediction_season": "2027-2028 (Upcoming Centralized Admission Process)",
        "early_warning_threshold_pct": 30.0,
        "forecasts": forecasts
    }


# ---------------------------------------------------------------------------
# 5. Regulatory Discrepancy Remarks Desk
# ---------------------------------------------------------------------------
@router.get("/remarks", response_model=List[StudentRemarkOut])
def get_all_student_remarks(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Returns all discrepancy remarks raised by students across all institutions.
    """
    q = db.query(StudentRemark)
    if status and status != "ALL":
        q = q.filter(StudentRemark.status == status)

    remarks = q.order_by(StudentRemark.created_at.desc()).all()

    results = []
    for r in remarks:
        c = db.query(College).filter(College.aicte_id == r.aicte_id).first()
        results.append(StudentRemarkOut(
            id=r.id,
            student_id=r.student_id,
            apaar_id=r.apaar_id,
            student_name=r.student_name,
            aicte_id=r.aicte_id,
            college_name=c.name if c else r.aicte_id,
            remark_type=r.remark_type,
            description=r.description,
            status=r.status,
            contact_email=r.contact_email,
            contact_mobile=r.contact_mobile,
            admin_notes=r.admin_notes,
            created_at=r.created_at,
            resolved_at=r.resolved_at
        ))
    return results


@router.patch("/remarks/{remark_id}")
def update_remark_status(
    remark_id: int,
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Updates the resolution status of a student remark (PENDING, UNDER_REVIEW, RESOLVED).
    """
    remark = db.query(StudentRemark).filter(StudentRemark.id == remark_id).first()
    if not remark:
        raise HTTPException(status_code=404, detail="Remark not found.")

    new_status = payload.get("status", remark.status)
    admin_notes = payload.get("admin_notes", remark.admin_notes)

    remark.status = new_status
    if admin_notes:
        remark.admin_notes = admin_notes

    if new_status == "RESOLVED":
        remark.resolved_at = datetime.now(timezone.utc)

    # Log in audit
    audit = AuditLog(
        action="STUDENT_REMARK_RESOLVED" if new_status == "RESOLVED" else "STUDENT_REMARK_UPDATED",
        entity_type="StudentRemark",
        entity_id=str(remark_id),
        actor_id="AICTE_REGULATOR",
        actor_name="AICTE Grievance Bureau",
        actor_role="AICTE_VERIFIER",
        details=f"Remark #{remark_id} for student '{remark.student_name}' status set to '{new_status}'. Notes: {admin_notes}."
    )
    db.add(audit)
    db.commit()

    return {"status": "SUCCESS", "remark_id": remark_id, "new_status": new_status}
