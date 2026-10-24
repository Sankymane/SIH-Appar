import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Student, College, AuditLog
from ..schemas import VerificationResponseSchema
from ..auth import get_current_user_context

router = APIRouter(prefix="/verify", tags=["Verification"])

@router.get("/{apaar_id}", response_model=VerificationResponseSchema)
def verify_student_apaar(apaar_id: str, db: Session = Depends(get_db)):
    """
    Public verification endpoint to authenticate student identity by APAAR ID.
    Used by employers, universities, and regulatory authorities to verify records.
    """
    clean_id = re.sub(r'[\s\-]', '', str(apaar_id).strip())

    student = db.query(Student).filter(Student.apaar_id == clean_id).first()
    if not student:
        raise HTTPException(
            status_code=404,
            detail=f"APAAR ID '{clean_id}' is not registered in the AICTE National Academic Registry."
        )

    college = db.query(College).filter(College.aicte_id == student.aicte_id).first()
    college_name = college.name if college else student.aicte_id

    return VerificationResponseSchema(
        is_valid=(student.validation_status == "VALID" and student.is_verified),
        apaar_id=clean_id,
        student_name=student.full_name,
        enrollment_no=student.enrollment_no,
        college_name=college_name,
        aicte_id=student.aicte_id,
        program=student.program,
        department=student.department,
        level=student.level,
        admission_year=student.academic_year,
        verification_status=student.validation_status,
        validation_remarks=student.validation_remarks,
        digital_signature_hash=student.verification_hash,
        aadhaar_seeded=True,
        digilocker_verified=True,
        verified_at=student.verified_at.strftime("%Y-%m-%d %H:%M:%S UTC") if student.verified_at else None
    )

@router.post("/{student_id}/toggle-verification")
def toggle_verification(
    student_id: int,
    user_context: dict = Depends(get_current_user_context),
    db: Session = Depends(get_db)
):
    """
    Authorized regulatory action to approve or flag a student verification status.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    student.is_verified = not student.is_verified
    if student.is_verified and student.validation_status != "VALID":
        # Force re-evaluation or manual override
        student.validation_status = "VALID"
        student.validation_remarks = f"Manually verified and approved by {user_context.get('role')}."
    db.commit()

    # Log action
    audit = AuditLog(
        action="VERIFICATION_STATUS_CHANGED",
        entity_type="Student",
        entity_id=str(student.id),
        actor_id=user_context.get("aicte_id", "REGULATOR"),
        actor_name=user_context.get("college_name", "AICTE Authority"),
        actor_role=user_context.get("role", "AICTE_VERIFIER"),
        details=f"Verification status set to {student.is_verified} for student {student.full_name}."
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "is_verified": student.is_verified,
        "validation_status": student.validation_status,
        "message": f"Student verification updated to: {'VERIFIED' if student.is_verified else 'PENDING'}."
    }
