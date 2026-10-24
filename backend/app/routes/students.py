import io
import re
import pandas as pd
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from ..models import Student, College, CourseIntake, AuditLog
from ..schemas import StudentCreateSchema, StudentUpdateSchema, StudentOutSchema, BulkUploadResultSchema
from ..validation_engine import ValidationEngine
from ..auth import get_current_user_context

router = APIRouter(prefix="/students", tags=["Students"])

def mask_apaar(apaar_id: Optional[str]) -> str:
    """Masks APAAR ID for privacy: 'XXXXXXXX1234'"""
    if not apaar_id:
        return "N/A"
    clean = re.sub(r'[\s\-]', '', str(apaar_id).strip())
    if len(clean) >= 4:
        return f"XXXX-XXXX-{clean[-4:]}"
    return "XXXX-XXXX-XXXX"

@router.get("", response_model=dict)
def get_students(
    aicte_id: Optional[str] = None,
    department: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    mask_pii: bool = False,
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Retrieves students with optional filtering by institution, department, and validation status.
    Supports privacy masking for sensitive APAAR numbers.
    """
    query = db.query(Student)

    if aicte_id:
        query = query.filter(Student.aicte_id == aicte_id)
    if department and department != "--All--":
        query = query.filter(Student.department == department)
    if status and status != "--All--":
        query = query.filter(Student.validation_status == status)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Student.full_name.ilike(search_pattern),
                Student.apaar_id.ilike(search_pattern),
                Student.enrollment_no.ilike(search_pattern),
                Student.department.ilike(search_pattern)
            )
        )

    total_count = query.count()
    offset = (page - 1) * page_size
    students = query.order_by(Student.id.desc()).offset(offset).limit(page_size).all()

    # Pre-fetch college names
    college_map = {c.aicte_id: c.name for c in db.query(College).all()}

    results = []
    for s in students:
        s_dict = {
            "id": s.id,
            "apaar_id": mask_apaar(s.apaar_id) if mask_pii else s.apaar_id,
            "masked_apaar_id": mask_apaar(s.apaar_id),
            "enrollment_no": s.enrollment_no,
            "full_name": s.full_name,
            "gender": s.gender,
            "category": s.category,
            "date_of_birth": s.date_of_birth,
            "date_of_admission": s.date_of_admission,
            "academic_year": s.academic_year,
            "aicte_id": s.aicte_id,
            "college_name": college_map.get(s.aicte_id, s.aicte_id),
            "course_id": s.course_id,
            "program": s.program,
            "department": s.department,
            "level": s.level,
            "admission_type": s.admission_type,
            "is_nri": s.is_nri,
            "is_oci": s.is_oci,
            "is_fn": s.is_fn,
            "validation_status": s.validation_status,
            "validation_remarks": s.validation_remarks,
            "verification_hash": s.verification_hash,
            "is_verified": s.is_verified,
            "created_at": s.created_at
        }
        results.append(s_dict)

    return {
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size,
        "records": results
    }

@router.post("", response_model=StudentOutSchema)
def create_student(
    payload: StudentCreateSchema,
    user_context: dict = Depends(get_current_user_context),
    db: Session = Depends(get_db)
):
    """
    Enrolls a single student. Executes the Automated Validation Engine
    to check APAAR format, duplicates (within & across institutions),
    intake caps, and data consistency.
    """
    aicte_id = user_context.get("aicte_id", "1-44525213207")

    # If course_id not specified, find matching course by department
    course_id = payload.course_id
    if not course_id:
        course = db.query(CourseIntake).filter(
            CourseIntake.aicte_id == aicte_id,
            CourseIntake.department == payload.department
        ).first()
        if course:
            course_id = course.id

    student_data = payload.dict()
    student_data["course_id"] = course_id
    student_data["aicte_id"] = aicte_id

    # Run Automated Validation Engine
    status_code, remarks = ValidationEngine.evaluate_student(
        db=db,
        student_data=student_data,
        current_college_id=aicte_id
    )

    # Compute Digital Verifiable Signature Hash
    v_hash = ValidationEngine.generate_verification_hash(student_data)

    new_student = Student(
        apaar_id=payload.apaar_id.strip() if payload.apaar_id else None,
        enrollment_no=payload.enrollment_no.strip(),
        full_name=payload.full_name.strip(),
        gender=payload.gender,
        category=payload.category,
        date_of_birth=payload.date_of_birth,
        date_of_admission=payload.date_of_admission or datetime.now().strftime("%Y-%m-%d"),
        academic_year=payload.academic_year,
        aicte_id=aicte_id,
        course_id=course_id,
        program=payload.program or "Engineering and Technology",
        department=payload.department,
        level=payload.level or "UG",
        admission_type=payload.admission_type,
        is_nri=payload.is_nri,
        is_oci=payload.is_oci,
        is_fn=payload.is_fn,
        validation_status=status_code,
        validation_remarks=remarks,
        verification_hash=v_hash,
        is_verified=(status_code == "VALID")
    )

    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    # Write Audit Log
    audit = AuditLog(
        action="STUDENT_ENROLLED",
        entity_type="Student",
        entity_id=str(new_student.id),
        actor_id=aicte_id,
        actor_name=user_context.get("college_name", "Institute Admin"),
        actor_role=user_context.get("role", "INSTITUTE_ADMIN"),
        details=f"Student {new_student.full_name} enrolled with status {status_code}. APAAR: {new_student.apaar_id}."
    )
    db.add(audit)
    db.commit()

    college = db.query(College).filter(College.aicte_id == aicte_id).first()
    college_name = college.name if college else aicte_id

    return StudentOutSchema(
        id=new_student.id,
        apaar_id=new_student.apaar_id,
        masked_apaar_id=mask_apaar(new_student.apaar_id),
        enrollment_no=new_student.enrollment_no,
        full_name=new_student.full_name,
        gender=new_student.gender,
        category=new_student.category,
        date_of_birth=new_student.date_of_birth,
        date_of_admission=new_student.date_of_admission,
        academic_year=new_student.academic_year,
        aicte_id=new_student.aicte_id,
        college_name=college_name,
        course_id=new_student.course_id,
        program=new_student.program,
        department=new_student.department,
        level=new_student.level,
        admission_type=new_student.admission_type,
        is_nri=new_student.is_nri,
        is_oci=new_student.is_oci,
        is_fn=new_student.is_fn,
        validation_status=new_student.validation_status,
        validation_remarks=new_student.validation_remarks,
        verification_hash=new_student.verification_hash,
        is_verified=new_student.is_verified,
        created_at=new_student.created_at
    )

@router.post("/bulk-upload", response_model=BulkUploadResultSchema)
async def bulk_upload_students(
    file: UploadFile = File(...),
    user_context: dict = Depends(get_current_user_context),
    db: Session = Depends(get_db)
):
    """
    Bulk student data ingestion via CSV or Excel file.
    Validates APAAR ID, Approved Intake, Supernumerary Seats, NRI, OCI, and FN status.
    Automatically flags discrepancies.
    """
    aicte_id = user_context.get("aicte_id", "1-44525213207")
    filename = file.filename.lower()

    contents = await file.read()
    df = None
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload a .csv or .xlsx file.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    if df is None or df.empty:
        raise HTTPException(status_code=400, detail="The uploaded file contains no data rows.")

    # Normalize column names
    col_mapping = {c.strip().lower().replace(" ", "_"): c for c in df.columns}
    
    # Pre-fetch existing courses
    courses = {c.department.lower(): c for c in db.query(CourseIntake).filter(CourseIntake.aicte_id == aicte_id).all()}

    created_students = []
    errors = []
    success_count = 0
    flagged_count = 0

    for idx, row in df.iterrows():
        try:
            # Extract fields with forgiving key matching
            apaar_val = str(row.get(col_mapping.get("apaar_id", "apaar_id"), "")).strip()
            if apaar_val in ["nan", "none", "", "null"]:
                apaar_val = None

            enroll_val = str(row.get(col_mapping.get("enrollment_no", "enrollment_no"), f"EN26AUTO{idx+1}")).strip()
            name_val = str(row.get(col_mapping.get("full_name", "full_name"), f"Student {idx+1}")).strip()
            dept_val = str(row.get(col_mapping.get("department", "department"), "Computer Science and Engineering")).strip()
            gender_val = str(row.get(col_mapping.get("gender", "gender"), "Male")).strip()
            cat_val = str(row.get(col_mapping.get("category", "category"), "General")).strip()
            adm_type_val = str(row.get(col_mapping.get("admission_type", "admission_type"), "Regular")).strip()
            
            # Policy flags
            is_nri_val = str(row.get(col_mapping.get("is_nri", "is_nri"), "false")).lower() in ["true", "1", "yes", "y"]
            is_oci_val = str(row.get(col_mapping.get("is_oci", "is_oci"), "false")).lower() in ["true", "1", "yes", "y"]
            is_fn_val = str(row.get(col_mapping.get("is_fn", "is_fn"), "false")).lower() in ["true", "1", "yes", "y"]

            course_match = courses.get(dept_val.lower())
            course_id = course_match.id if course_match else None

            student_payload = {
                "apaar_id": apaar_val,
                "enrollment_no": enroll_val,
                "full_name": name_val,
                "aicte_id": aicte_id,
                "course_id": course_id,
                "department": dept_val,
                "admission_type": adm_type_val,
                "is_nri": is_nri_val,
                "is_oci": is_oci_val,
                "is_fn": is_fn_val,
                "academic_year": "2026-2027"
            }

            # Evaluate through Automated Validation Engine
            status_code, remarks = ValidationEngine.evaluate_student(
                db=db,
                student_data=student_payload,
                current_college_id=aicte_id
            )

            v_hash = ValidationEngine.generate_verification_hash(student_payload)

            student = Student(
                apaar_id=apaar_val,
                enrollment_no=enroll_val,
                full_name=name_val,
                gender=gender_val,
                category=cat_val,
                date_of_birth="2005-01-01",
                date_of_admission=datetime.now().strftime("%Y-%m-%d"),
                academic_year="2026-2027",
                aicte_id=aicte_id,
                course_id=course_id,
                program="Engineering and Technology",
                department=dept_val,
                level="UG",
                admission_type=adm_type_val,
                is_nri=is_nri_val,
                is_oci=is_oci_val,
                is_fn=is_fn_val,
                validation_status=status_code,
                validation_remarks=remarks,
                verification_hash=v_hash,
                is_verified=(status_code == "VALID")
            )

            db.add(student)
            db.commit()
            db.refresh(student)

            if status_code == "VALID":
                success_count += 1
            else:
                flagged_count += 1

            created_students.append(StudentOutSchema(
                id=student.id,
                apaar_id=student.apaar_id,
                masked_apaar_id=mask_apaar(student.apaar_id),
                enrollment_no=student.enrollment_no,
                full_name=student.full_name,
                gender=student.gender,
                category=student.category,
                date_of_birth=student.date_of_birth,
                date_of_admission=student.date_of_admission,
                academic_year=student.academic_year,
                aicte_id=student.aicte_id,
                course_id=student.course_id,
                program=student.program,
                department=student.department,
                level=student.level,
                admission_type=student.admission_type,
                is_nri=student.is_nri,
                is_oci=student.is_oci,
                is_fn=student.is_fn,
                validation_status=student.validation_status,
                validation_remarks=student.validation_remarks,
                verification_hash=student.verification_hash,
                is_verified=student.is_verified,
                created_at=student.created_at
            ))

        except Exception as row_err:
            errors.append({"row_index": idx + 2, "error": str(row_err)})

    # Log Bulk Action
    audit = AuditLog(
        action="BULK_UPLOAD",
        entity_type="Student",
        actor_id=aicte_id,
        actor_name=user_context.get("college_name", "Institute Admin"),
        actor_role=user_context.get("role", "INSTITUTE_ADMIN"),
        details=f"Bulk upload processed: {len(df)} rows. {success_count} valid, {flagged_count} flagged with policy issues."
    )
    db.add(audit)
    db.commit()

    return BulkUploadResultSchema(
        total_processed=len(df),
        successfully_enrolled=success_count,
        flagged_records=flagged_count,
        errors=errors,
        created_students=created_students[:50]  # Return preview
    )

@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    user_context: dict = Depends(get_current_user_context),
    db: Session = Depends(get_db)
):
    """Deletes a student record and logs audit trail."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    student_name = student.full_name
    apaar = student.apaar_id

    db.delete(student)
    db.commit()

    audit = AuditLog(
        action="STUDENT_DELETED",
        entity_type="Student",
        entity_id=str(student_id),
        actor_id=user_context.get("aicte_id", "ADMIN"),
        actor_name=user_context.get("college_name", "Institute Admin"),
        actor_role=user_context.get("role", "INSTITUTE_ADMIN"),
        details=f"Student {student_name} (APAAR: {apaar}) removed from registry."
    )
    db.add(audit)
    db.commit()

    return {"status": "success", "message": f"Student {student_name} removed successfully."}
