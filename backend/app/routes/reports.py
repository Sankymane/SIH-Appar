import io
import pandas as pd
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import Student, College, CourseIntake

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/export/students")
def export_students_report(
    aicte_id: Optional[str] = None,
    format: str = Query("xlsx", pattern="^(xlsx|csv)$"),
    db: Session = Depends(get_db)
):
    """
    Exports student records into a downloadable Excel or CSV report
    for regulatory monitoring and institutional records.
    """
    query = db.query(Student)
    if aicte_id:
        query = query.filter(Student.aicte_id == aicte_id)

    students = query.order_by(Student.id.asc()).all()
    college_map = {c.aicte_id: c.name for c in db.query(College).all()}

    rows = []
    for s in students:
        rows.append({
            "Student ID": s.id,
            "APAAR ID": s.apaar_id or "MISSING",
            "Enrollment No": s.enrollment_no,
            "Full Name": s.full_name,
            "Gender": s.gender,
            "Category": s.category,
            "Date of Birth": s.date_of_birth,
            "Date of Admission": s.date_of_admission,
            "Academic Year": s.academic_year,
            "Institution AICTE ID": s.aicte_id,
            "Institution Name": college_map.get(s.aicte_id, s.aicte_id),
            "Department": s.department,
            "Program": s.program,
            "Level": s.level,
            "Admission Type": s.admission_type,
            "NRI Status": "Yes" if s.is_nri else "No",
            "OCI Status": "Yes" if s.is_oci else "No",
            "Foreign National": "Yes" if s.is_fn else "No",
            "Validation Status": s.validation_status,
            "Validation Remarks": s.validation_remarks,
            "Verification Signature": s.verification_hash[:16] + "..." if s.verification_hash else "UNVERIFIED"
        })

    df = pd.DataFrame(rows)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    if format == "csv":
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=AICTE_Students_Report_{timestamp}.csv"}
        )
    else:
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Students Master Roster")
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=AICTE_Students_Report_{timestamp}.xlsx"}
        )

@router.get("/export/compliance")
def export_compliance_report(
    aicte_id: Optional[str] = None,
    format: str = Query("xlsx", pattern="^(xlsx|csv)$"),
    db: Session = Depends(get_db)
):
    """
    Generates AICTE regulatory compliance report comparing approved intake vs admitted counts.
    """
    colleges_query = db.query(College)
    if aicte_id:
        colleges_query = colleges_query.filter(College.aicte_id == aicte_id)

    colleges = colleges_query.all()
    rows = []

    for c in colleges:
        courses = db.query(CourseIntake).filter(CourseIntake.aicte_id == c.aicte_id).all()
        for crs in courses:
            regular_enrolled = db.query(func.count(Student.id)).filter(
                Student.course_id == crs.id,
                Student.admission_type == "Regular"
            ).scalar() or 0

            super_enrolled = db.query(func.count(Student.id)).filter(
                Student.course_id == crs.id,
                Student.admission_type.like("Supernumerary%")
            ).scalar() or 0

            violations = db.query(func.count(Student.id)).filter(
                Student.course_id == crs.id,
                Student.validation_status != "VALID"
            ).scalar() or 0

            status = "COMPLIANT"
            if regular_enrolled > crs.approved_intake:
                status = "INTAKE_EXCEEDED"
            elif super_enrolled > crs.supernumerary_intake:
                status = "SUPERNUMERARY_EXCEEDED"
            elif violations > 0:
                status = "POLICY_FLAGGED"

            rows.append({
                "AICTE ID": c.aicte_id,
                "Institution Name": c.name,
                "State": c.state,
                "District": c.district,
                "Department": crs.department,
                "Program": crs.program,
                "Level": crs.level,
                "Approved Intake": crs.approved_intake,
                "Regular Admitted": regular_enrolled,
                "Supernumerary Sanctioned": crs.supernumerary_intake,
                "Supernumerary Admitted": super_enrolled,
                "Total Students": regular_enrolled + super_enrolled,
                "Flagged Discrepancies": violations,
                "Compliance Status": status
            })

    df = pd.DataFrame(rows)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    if format == "csv":
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=AICTE_Compliance_Audit_{timestamp}.csv"}
        )
    else:
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Intake Compliance Audit")
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=AICTE_Compliance_Audit_{timestamp}.xlsx"}
        )
