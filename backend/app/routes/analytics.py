from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, Dict
from ..database import get_db
from ..models import College, CourseIntake, Student

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard")
def get_dashboard_analytics(
    aicte_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Computes real-time admissions statistics, intake utilization,
    category breakdowns, quota distributions, and validation discrepancy metrics.
    """
    student_query = db.query(Student)
    course_query = db.query(CourseIntake)

    if aicte_id:
        student_query = student_query.filter(Student.aicte_id == aicte_id)
        course_query = course_query.filter(CourseIntake.aicte_id == aicte_id)

    total_intake = course_query.with_entities(func.sum(CourseIntake.approved_intake)).scalar() or 0
    total_super_intake = course_query.with_entities(func.sum(CourseIntake.supernumerary_intake)).scalar() or 0
    total_students = student_query.count()

    # APAAR seeding rate (valid 12-digit IDs)
    apaar_seeded = student_query.filter(Student.apaar_id.isnot(None), Student.apaar_id != "").count()
    flagged_violations = student_query.filter(Student.validation_status != "VALID").count()

    # Category distribution
    categories = db.query(Student.category, func.count(Student.id))
    if aicte_id:
        categories = categories.filter(Student.aicte_id == aicte_id)
    cat_dist = {cat or "General": cnt for cat, cnt in categories.group_by(Student.category).all()}

    # Quota distribution
    quota_dist = {
        "Regular": student_query.filter(Student.admission_type == "Regular", Student.is_nri == False, Student.is_fn == False).count(),
        "TFW (Fee Waiver)": student_query.filter(Student.admission_type.like("%TFW%")).count(),
        "PMSSS (Scholarship)": student_query.filter(Student.admission_type.like("%PMSSS%")).count(),
        "Sports Quota": student_query.filter(Student.admission_type.like("%Sports%")).count(),
        "NRI Quota": student_query.filter(Student.is_nri == True).count(),
        "Foreign National (FN)": student_query.filter(Student.is_fn == True).count(),
        "OCI Status": student_query.filter(Student.is_oci == True).count()
    }

    # Gender distribution
    genders = db.query(Student.gender, func.count(Student.id))
    if aicte_id:
        genders = genders.filter(Student.aicte_id == aicte_id)
    gender_dist = {g or "Male": cnt for g, cnt in genders.group_by(Student.gender).all()}

    # Validation Status Breakdown
    statuses = db.query(Student.validation_status, func.count(Student.id))
    if aicte_id:
        statuses = statuses.filter(Student.aicte_id == aicte_id)
    status_breakdown = {s: cnt for s, cnt in statuses.group_by(Student.validation_status).all()}

    # Department-wise Intake vs Admitted
    courses = course_query.limit(10).all()
    dept_comparison = []
    for c in courses:
        enrolled = db.query(func.count(Student.id)).filter(Student.course_id == c.id).scalar() or 0
        dept_comparison.append({
            "department": c.department,
            "approved_intake": c.approved_intake,
            "actual_admitted": enrolled,
            "supernumerary_quota": c.supernumerary_intake,
            "utilization_pct": round((enrolled / c.approved_intake * 100), 1) if c.approved_intake > 0 else 0
        })

    utilization_rate = round((total_students / total_intake * 100), 1) if total_intake > 0 else 0
    seeding_rate = round((apaar_seeded / total_students * 100), 1) if total_students > 0 else 0

    return {
        "total_approved_intake": int(total_intake),
        "total_supernumerary_intake": int(total_super_intake),
        "total_enrolled_students": total_students,
        "total_apaar_seeded": apaar_seeded,
        "apaar_seeding_rate": seeding_rate,
        "total_flagged_violations": flagged_violations,
        "intake_utilization_rate": utilization_rate,
        "category_distribution": cat_dist,
        "quota_distribution": quota_dist,
        "gender_distribution": gender_dist,
        "validation_status_breakdown": status_breakdown,
        "department_intake_comparison": dept_comparison
    }
