from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional, List
from ..database import get_db
from ..models import College, CourseIntake, Student
from ..schemas import CollegeSummarySchema, CollegeDetailSchema, CourseIntakeSchema

router = APIRouter(prefix="/institutions", tags=["Institutions"])

@router.get("/meta/filters")
def get_filter_options(db: Session = Depends(get_db)):
    """Returns distinct states, institution types, and academic years for filter sidebar."""
    states = [s[0] for s in db.query(College.state).distinct().filter(College.state.isnot(None)).order_by(College.state).all()]
    inst_types = [t[0] for t in db.query(College.institution_type).distinct().filter(College.institution_type.isnot(None)).order_by(College.institution_type).all()]
    years = ["2026-2027", "2025-2026", "2024-2025", "2023-2024", "2022-2023"]
    programs = ["--All--", "Engineering and Technology", "Management", "MCA", "Pharmacy", "Architecture", "Hotel Management"]
    levels = ["--All--", "UG", "PG", "Diploma"]

    return {
        "states": states,
        "institution_types": inst_types,
        "years": years,
        "programs": programs,
        "levels": levels
    }

@router.get("", response_model=dict)
def get_institutions(
    state: Optional[str] = None,
    institution_type: Optional[str] = None,
    program: Optional[str] = None,
    level: Optional[str] = None,
    minority: Optional[str] = None,
    women: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Search and filter approved institutions for the public explorer table.
    Mirrors the AICTE Approved Institutes layout.
    """
    query = db.query(College)

    if state and state != "--All--":
        query = query.filter(College.state == state)
    if institution_type and institution_type != "--All--":
        query = query.filter(College.institution_type == institution_type)
    if minority and minority != "--All--":
        query = query.filter(College.minority == minority)
    if women and women != "--All--":
        query = query.filter(College.women == women)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                College.name.ilike(search_pattern),
                College.aicte_id.ilike(search_pattern),
                College.district.ilike(search_pattern),
                College.address.ilike(search_pattern)
            )
        )

    total_count = query.count()
    offset = (page - 1) * page_size
    colleges = query.offset(offset).limit(page_size).all()

    results = []
    for c in colleges:
        # Calculate total approved intake and enrolled
        intakes = db.query(func.sum(CourseIntake.approved_intake)).filter(CourseIntake.aicte_id == c.aicte_id).scalar() or 0
        enrolled = db.query(func.count(Student.id)).filter(Student.aicte_id == c.aicte_id).scalar() or 0
        
        status = "COMPLIANT"
        if enrolled > intakes and intakes > 0:
            status = "EXCEEDED"
        elif enrolled >= intakes * 0.9 and intakes > 0:
            status = "NEAR_CAPACITY"

        results.append({
            "aicte_id": c.aicte_id,
            "name": c.name,
            "address": c.address,
            "district": c.district,
            "state": c.state,
            "institution_type": c.institution_type,
            "women": c.women,
            "minority": c.minority,
            "total_approved_intake": int(intakes),
            "total_enrolled_students": int(enrolled),
            "compliance_status": status
        })

    return {
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size,
        "records": results
    }

@router.get("/{aicte_id}", response_model=CollegeDetailSchema)
def get_institution_detail(aicte_id: str, db: Session = Depends(get_db)):
    """
    Returns full details for a college including all courses with approved intake vs actual enrolled.
    Used for the side-panel detailed view and intake comparison charts.
    """
    college = db.query(College).filter(College.aicte_id == aicte_id).first()
    if not college:
        raise HTTPException(status_code=404, detail="Institution not found")

    courses = db.query(CourseIntake).filter(CourseIntake.aicte_id == aicte_id).all()
    
    course_schemas = []
    total_approved = 0
    total_enrolled = 0
    total_supernumerary = 0

    for crs in courses:
        enrolled_reg = db.query(func.count(Student.id)).filter(
            Student.course_id == crs.id,
            Student.admission_type == "Regular"
        ).scalar() or 0

        enrolled_super = db.query(func.count(Student.id)).filter(
            Student.course_id == crs.id,
            Student.admission_type.like("Supernumerary%")
        ).scalar() or 0

        total_approved += crs.approved_intake
        total_enrolled += (enrolled_reg + enrolled_super)
        total_supernumerary += enrolled_super

        course_schemas.append(CourseIntakeSchema(
            id=crs.id,
            program=crs.program,
            department=crs.department,
            level=crs.level,
            shift=crs.shift,
            approved_intake=crs.approved_intake,
            supernumerary_intake=crs.supernumerary_intake,
            nri_quota=crs.nri_quota,
            fn_quota=crs.fn_quota,
            academic_year=crs.academic_year,
            enrolled_count=enrolled_reg,
            supernumerary_count=enrolled_super
        ))

    flagged_count = db.query(func.count(Student.id)).filter(
        Student.aicte_id == aicte_id,
        Student.validation_status != "VALID"
    ).scalar() or 0

    return CollegeDetailSchema(
        aicte_id=college.aicte_id,
        name=college.name,
        address=college.address,
        district=college.district,
        state=college.state,
        institution_type=college.institution_type,
        women=college.women,
        minority=college.minority,
        website=college.website,
        contact_email=college.contact_email,
        contact_phone=college.contact_phone,
        nodal_officer_name=college.nodal_officer_name,
        nodal_officer_email=college.nodal_officer_email,
        nodal_officer_mobile=college.nodal_officer_mobile,
        total_approved_intake=total_approved,
        total_enrolled_students=total_enrolled,
        total_supernumerary_enrolled=total_supernumerary,
        flagged_records_count=flagged_count,
        courses=course_schemas
    )
