import os
import random
import pandas as pd
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from .database import engine, SessionLocal, Base
from .models import College, CourseIntake, Student, StudentRemark, AuditLog
from .validation_engine import ValidationEngine

# Realistic Indian student data generation pools
FIRST_NAMES_MALE = [
    "Aarav", "Rohit", "Vikram", "Mohammed", "Rahul", "Aditya", "Siddharth",
    "Karthik", "Amit", "Manish", "Gaurav", "Suresh", "Rohan", "Abhishek",
    "Devansh", "Kunal", "Pranav", "Nikhil", "Tejas", "Tanmay", "Ayush"
]
FIRST_NAMES_FEMALE = [
    "Priya", "Ananya", "Sneha", "Divya", "Pooja", "Ritu", "Neha",
    "Kavita", "Deepika", "Shreya", "Tanvi", "Meera", "Swati", "Ishita",
    "Aishwarya", "Bhavna", "Roshni", "Simran", "Preeti", "Payal", "Anjali"
]
LAST_NAMES = [
    "Sharma", "Patel", "Verma", "Iyer", "Khan", "Kulkarni", "Singh",
    "Nair", "Joshi", "Reddy", "Gupta", "Deshmukh", "Mane", "Bose",
    "Chatterjee", "Mishra", "Choudhury", "Pillai", "Das", "Yadav", "Pandey"
]

DEPARTMENTS = [
    {"name": "Computer Science and Engineering", "program": "Engineering and Technology", "level": "UG", "intake": 120, "super": 18},
    {"name": "Information Technology", "program": "Engineering and Technology", "level": "UG", "intake": 60, "super": 9},
    {"name": "Electronics & Telecommunication", "program": "Engineering and Technology", "level": "UG", "intake": 60, "super": 9},
    {"name": "Mechanical Engineering", "program": "Engineering and Technology", "level": "UG", "intake": 60, "super": 9},
    {"name": "Civil Engineering", "program": "Engineering and Technology", "level": "UG", "intake": 60, "super": 9},
    {"name": "Master of Business Administration (MBA)", "program": "Management", "level": "PG", "intake": 60, "super": 9},
    {"name": "Master of Computer Applications (MCA)", "program": "MCA", "level": "PG", "intake": 60, "super": 9},
]

CATEGORIES = ["General", "OBC-NCL", "SC", "ST", "EWS"]

def generate_random_apaar() -> str:
    """Generates a random valid 12-digit APAAR ID."""
    first_digit = str(random.randint(2, 9))
    rest = ''.join([str(random.randint(0, 9)) for _ in range(11)])
    return f"{first_digit}{rest}"

def seed_database(max_colleges: int = 150):
    """
    Populates SQLite database with real AICTE colleges from master Excel
    and synthetic student data containing mandatory policy fields and specific edge cases.
    """
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        college_count = db.query(College).count()
        if college_count > 0:
            print(f"Database already seeded with {college_count} colleges and {db.query(Student).count()} students.")
            # Ensure all colleges have phone 8767434172
            db.query(College).update({
                College.nodal_officer_mobile: "+91 8767434172",
                College.registered_phone: "+91 8767434172",
                College.contact_phone: "+91 8767434172"
            })
            db.commit()

            # Ensure Sankalp Hemant Mane (from user's attached DigiLocker ABC Card) exists
            sankalp = db.query(Student).filter(Student.apaar_id == "126430259751").first()
            primary_college = db.query(College).first()
            if not sankalp and primary_college:
                cs_course = db.query(CourseIntake).filter(CourseIntake.aicte_id == primary_college.aicte_id).first()
                sankalp_student = Student(
                    apaar_id="126430259751",
                    enrollment_no="EN26CS1264",
                    full_name="SANKALP HEMANT MANE",
                    gender="Male",
                    category="General",
                    date_of_birth="2004-06-18",
                    date_of_admission="2026-08-01",
                    academic_year="2026-2027",
                    credits_earned=84,
                    cgpa=8.92,
                    aicte_id=primary_college.aicte_id,
                    course_id=cs_course.id if cs_course else None,
                    program="Engineering and Technology",
                    department="Computer Science and Engineering",
                    level="UG",
                    admission_type="Regular",
                    validation_status="VALID",
                    validation_remarks="All checks passed. Verified against National Academic Bank of Credits (ABC).",
                    verification_hash="sha256:d8b2e176430259751e041fa89c0281b37651e43c",
                    is_verified=True,
                    verified_by="Academic Bank of Credits (ABC) & AICTE Trust Network"
                )
                db.add(sankalp_student)
                db.commit()
                print("Seeded Sankalp Hemant Mane (APAAR 126430259751).")

            # Seed sample discrepancy remarks
            if db.query(StudentRemark).count() == 0:
                sample_remarks = [
                    StudentRemark(
                        apaar_id="126430259751",
                        student_name="SANKALP HEMANT MANE",
                        aicte_id=primary_college.aicte_id if primary_college else "1-44525213207",
                        remark_type="Inaccurate Personal Details",
                        description="Date of birth was entered as 2004-06-18 instead of official Class X certificate date. Requesting sync with DigiLocker.",
                        status="RESOLVED",
                        contact_email="sankalp.mane@abc.gov.in",
                        contact_mobile="8767434172",
                        admin_notes="Synced with DigiLocker Aadhaar e-KYC record on 24-Oct-2026.",
                        resolved_at=datetime.now(timezone.utc)
                    ),
                    StudentRemark(
                        apaar_id="778899001122",
                        student_name="Manish V. Pandey",
                        aicte_id="1-46208965893",
                        remark_type="Wrong College Mapping",
                        description="System shows I am also enrolled at Dr. D. Y. Patil Technical Campus, but I cancelled my admission there during CAP Round 2.",
                        status="PENDING",
                        contact_email="manish.pandey@gmail.com",
                        contact_mobile="8767434172"
                    )
                ]
                db.bulk_save_objects(sample_remarks)
                db.commit()
                print("Seeded sample student remarks.")
            return

        print("Seeding database from AICTE_Approved_Colleges_Master.xlsx...")
        excel_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "AICTE_Approved_Colleges_Master.xlsx")
        
        colleges_to_create = []
        if os.path.exists(excel_path):
            df = pd.read_excel(excel_path, sheet_name="AICTE Approved Colleges")
            # Select diverse colleges across districts
            sample_df = df.head(max_colleges)
            for _, row in sample_df.iterrows():
                aicte_id = str(row["Aicte ID"]).strip()
                name = str(row["Name"]).strip()
                address = str(row["Address"]).strip() if pd.notna(row["Address"]) else ""
                district = str(row["District"]).strip() if pd.notna(row["District"]) else ""
                inst_type = str(row["Institution Type"]).strip() if pd.notna(row["Institution Type"]) else "Private-Self Financing"
                women = str(row["Women"]).strip() if pd.notna(row["Women"]) else "N"
                minority = str(row["Minority"]).strip() if pd.notna(row["Minority"]) else "N"
                
                # Infer state from address/district or default
                state = "Maharashtra"
                if any(x in address.upper() or x in district.upper() for x in ["GOA", "NORTH GOA", "SOUTH GOA"]):
                    state = "Goa"
                elif any(x in address.upper() or x in district.upper() for x in ["DELHI", "NEW DELHI"]):
                    state = "Delhi"
                elif any(x in address.upper() or x in district.upper() for x in ["BANGALORE", "BENGALURU", "MYSORE", "KARNATAKA"]):
                    state = "Karnataka"
                elif any(x in address.upper() or x in district.upper() for x in ["CHENNAI", "COIMBATORE", "TAMIL NADU"]):
                    state = "Tamil Nadu"
                elif any(x in address.upper() or x in district.upper() for x in ["PUNE", "MUMBAI", "NAGPUR", "NASHIK", "AURANGABAD", "KOLHAPUR", "THANE", "RAIGAD"]):
                    state = "Maharashtra"

                slug = aicte_id.replace("-", "").lower()
                colleges_to_create.append(College(
                    aicte_id=aicte_id,
                    name=name,
                    address=address,
                    district=district,
                    state=state,
                    institution_type=inst_type,
                    women=women,
                    minority=minority,
                    website=f"https://www.{slug}-college.edu.in",
                    contact_email=f"admissions@{slug}.edu.in",
                    contact_phone=f"+91 {random.randint(700, 999)} {random.randint(1000000, 9999999)}",
                    password_hash="aicte@123",
                    nodal_officer_name="Dr. S. K. Narayanan",
                    nodal_officer_email=f"registrar@{slug}.edu.in",
                    nodal_officer_mobile=f"+91 9{random.randint(100000000, 999999999)}"
                ))
        else:
            # Fallback mock colleges if excel missing
            for i in range(1, 20):
                cid = f"1-462090{i:05d}"
                colleges_to_create.append(College(
                    aicte_id=cid,
                    name=f"GOVERNMENT COLLEGE OF ENGINEERING & TECHNOLOGY {i}",
                    address=f"CAMPUS SECTOR {i}, TECH HIGHWAY",
                    district="PUNE",
                    state="Maharashtra",
                    institution_type="Government" if i % 3 == 0 else "Private-Self Financing",
                    women="Y" if i % 5 == 0 else "N",
                    minority="Y" if i % 4 == 0 else "N",
                    password_hash="aicte@123"
                ))

        db.bulk_save_objects(colleges_to_create)
        db.commit()
        print(f"Created {len(colleges_to_create)} colleges.")

        # Create Courses for each college
        all_colleges = db.query(College).all()
        courses_to_create = []
        for college in all_colleges:
            for dept in DEPARTMENTS:
                courses_to_create.append(CourseIntake(
                    aicte_id=college.aicte_id,
                    program=dept["program"],
                    department=dept["name"],
                    level=dept["level"],
                    shift="1st Shift",
                    approved_intake=dept["intake"],
                    supernumerary_intake=dept["super"],
                    nri_quota=3,
                    fn_quota=3,
                    academic_year="2026-2027"
                ))

        db.bulk_save_objects(courses_to_create)
        db.commit()
        print(f"Created {len(courses_to_create)} course intake records.")

        # Now Seed Synthetic Students with both VALID and EDGE-CASE records
        print("Generating synthetic student records with AICTE edge cases...")
        primary_colleges = all_colleges[:10]  # Deeply populate the first 10 colleges
        students_to_create = []
        roll_seq = 1000

        # Dedicated Edge-Case Cross-College APAAR ID
        CROSS_COLLEGE_APAAR = "778899001122"
        # Dedicated Duplicate APAAR ID within same college
        SAME_COLLEGE_DUP_APAAR = "889911223344"

        for c_idx, college in enumerate(primary_colleges):
            courses = db.query(CourseIntake).filter(CourseIntake.aicte_id == college.aicte_id).all()
            if not courses:
                continue

            cs_course = courses[0]  # CSE

            # Populate normal students (25-35 students per course)
            for s_idx in range(30):
                roll_seq += 1
                is_female = (s_idx % 3 == 0)
                fname = random.choice(FIRST_NAMES_FEMALE) if is_female else random.choice(FIRST_NAMES_MALE)
                lname = random.choice(LAST_NAMES)
                fullname = f"{fname} {lname}"
                gender = "Female" if is_female else "Male"
                cat = random.choice(CATEGORIES)
                apaar = generate_random_apaar()
                
                # Quota variations
                adm_type = "Regular"
                is_nri = False
                is_oci = False
                is_fn = False
                if s_idx == 1:
                    adm_type = "Supernumerary-TFW"
                elif s_idx == 2:
                    adm_type = "Supernumerary-PMSSS"
                elif s_idx == 3:
                    adm_type = "Supernumerary-Sports"
                elif s_idx == 4:
                    adm_type = "Regular"
                    is_nri = True
                elif s_idx == 5:
                    adm_type = "Regular"
                    is_fn = True

                sdata = {
                    "apaar_id": apaar,
                    "enrollment_no": f"EN26CS{roll_seq}",
                    "full_name": fullname,
                    "aicte_id": college.aicte_id,
                    "department": cs_course.department,
                    "academic_year": "2026-2027"
                }
                v_hash = ValidationEngine.generate_verification_hash(sdata)

                students_to_create.append(Student(
                    apaar_id=apaar,
                    enrollment_no=f"EN26CS{roll_seq}",
                    full_name=fullname,
                    gender=gender,
                    category=cat,
                    date_of_birth=f"200{random.randint(3, 6)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}",
                    date_of_admission="2026-08-15",
                    academic_year="2026-2027",
                    aicte_id=college.aicte_id,
                    course_id=cs_course.id,
                    program=cs_course.program,
                    department=cs_course.department,
                    level=cs_course.level,
                    admission_type=adm_type,
                    is_nri=is_nri,
                    is_oci=is_oci,
                    is_fn=is_fn,
                    validation_status="VALID",
                    validation_remarks="All validation checks passed. Record verified against AICTE National APAAR Registry.",
                    verification_hash=v_hash,
                    is_verified=True
                ))

            # -----------------------------------------------------------------
            # EDGE CASES FOR COLLEGE 0 (Primary test institution)
            # -----------------------------------------------------------------
            if c_idx == 0:
                # Edge Case 1: Missing APAAR ID
                roll_seq += 1
                students_to_create.append(Student(
                    apaar_id=None,
                    enrollment_no=f"EN26CS{roll_seq}",
                    full_name="Akash S. Deshmukh",
                    gender="Male",
                    category="General",
                    date_of_birth="2005-04-12",
                    date_of_admission="2026-08-16",
                    academic_year="2026-2027",
                    aicte_id=college.aicte_id,
                    course_id=cs_course.id,
                    program=cs_course.program,
                    department=cs_course.department,
                    level=cs_course.level,
                    admission_type="Regular",
                    validation_status="MISSING_APAAR",
                    validation_remarks="Mandatory 12-digit APAAR ID is missing.",
                    is_verified=False
                ))

                # Edge Case 2: Invalid APAAR ID Format (short / non-numeric)
                roll_seq += 1
                students_to_create.append(Student(
                    apaar_id="98234-INVALID",
                    enrollment_no=f"EN26CS{roll_seq}",
                    full_name="Sameer R. Kadam",
                    gender="Male",
                    category="OBC-NCL",
                    date_of_birth="2004-11-20",
                    date_of_admission="2026-08-16",
                    academic_year="2026-2027",
                    aicte_id=college.aicte_id,
                    course_id=cs_course.id,
                    program=cs_course.program,
                    department=cs_course.department,
                    level=cs_course.level,
                    admission_type="Regular",
                    validation_status="INVALID_APAAR_FORMAT",
                    validation_remarks="APAAR ID '98234-INVALID' is invalid. Must be exactly 12 numeric digits.",
                    is_verified=False
                ))

                # Edge Case 3: Duplicate APAAR ID within the SAME College
                roll_seq += 1
                students_to_create.append(Student(
                    apaar_id=SAME_COLLEGE_DUP_APAAR,
                    enrollment_no=f"EN26CS{roll_seq}",
                    full_name="Karan G. Malhotra",
                    gender="Male",
                    category="General",
                    date_of_birth="2005-01-10",
                    date_of_admission="2026-08-16",
                    academic_year="2026-2027",
                    aicte_id=college.aicte_id,
                    course_id=cs_course.id,
                    program=cs_course.program,
                    department=cs_course.department,
                    level=cs_course.level,
                    admission_type="Regular",
                    validation_status="DUPLICATE_APAAR",
                    validation_remarks=f"Duplicate student: APAAR ID {SAME_COLLEGE_DUP_APAAR} is already registered in this institution.",
                    is_verified=False
                ))
                roll_seq += 1
                students_to_create.append(Student(
                    apaar_id=SAME_COLLEGE_DUP_APAAR,
                    enrollment_no=f"EN26CS{roll_seq}",
                    full_name="Karan Malhotra (Duplicate Entry)",
                    gender="Male",
                    category="General",
                    date_of_birth="2005-01-10",
                    date_of_admission="2026-08-17",
                    academic_year="2026-2027",
                    aicte_id=college.aicte_id,
                    course_id=cs_course.id,
                    program=cs_course.program,
                    department=cs_course.department,
                    level=cs_course.level,
                    admission_type="Regular",
                    validation_status="DUPLICATE_APAAR",
                    validation_remarks=f"Duplicate student: APAAR ID {SAME_COLLEGE_DUP_APAAR} is already registered in this institution.",
                    is_verified=False
                ))

                # Edge Case 4: Cross-Institutional Duplicate (College 0 vs College 1)
                roll_seq += 1
                students_to_create.append(Student(
                    apaar_id=CROSS_COLLEGE_APAAR,
                    enrollment_no=f"EN26CS{roll_seq}",
                    full_name="Manish V. Pandey",
                    gender="Male",
                    category="General",
                    date_of_birth="2005-03-25",
                    date_of_admission="2026-08-10",
                    academic_year="2026-2027",
                    aicte_id=college.aicte_id,
                    course_id=cs_course.id,
                    program=cs_course.program,
                    department=cs_course.department,
                    level=cs_course.level,
                    admission_type="Regular",
                    validation_status="VALID",
                    validation_remarks="Original enrollment at primary institution.",
                    verification_hash=ValidationEngine.generate_verification_hash({
                        "apaar_id": CROSS_COLLEGE_APAAR,
                        "enrollment_no": f"EN26CS{roll_seq}",
                        "full_name": "Manish V. Pandey",
                        "aicte_id": college.aicte_id,
                        "department": cs_course.department,
                        "academic_year": "2026-2027"
                    }),
                    is_verified=True
                ))

                # Edge Case 5: Data Inconsistency (Foreign National claiming SC/ST reservation)
                roll_seq += 1
                students_to_create.append(Student(
                    apaar_id=generate_random_apaar(),
                    enrollment_no=f"EN26CS{roll_seq}",
                    full_name="John David Miller",
                    gender="Male",
                    category="SC",  # Inconsistent for FN
                    date_of_birth="2004-05-18",
                    date_of_admission="2026-08-18",
                    academic_year="2026-2027",
                    aicte_id=college.aicte_id,
                    course_id=cs_course.id,
                    program=cs_course.program,
                    department=cs_course.department,
                    level=cs_course.level,
                    admission_type="Regular",
                    is_fn=True,
                    validation_status="DATA_INCONSISTENCY",
                    validation_remarks="Inconsistency: Foreign National students cannot claim domestic SC/ST/OBC reservation quotas.",
                    is_verified=False
                ))

            # Edge Case 4 Cont.: Duplicate of Cross-Institutional student in College 1
            if c_idx == 1:
                roll_seq += 1
                students_to_create.append(Student(
                    apaar_id=CROSS_COLLEGE_APAAR,
                    enrollment_no=f"EN26CS{roll_seq}",
                    full_name="Manish V. Pandey",
                    gender="Male",
                    category="General",
                    date_of_birth="2005-03-25",
                    date_of_admission="2026-08-20",
                    academic_year="2026-2027",
                    aicte_id=college.aicte_id,
                    course_id=cs_course.id,
                    program=cs_course.program,
                    department=cs_course.department,
                    level=cs_course.level,
                    admission_type="Regular",
                    validation_status="CROSS_INSTITUTION_DUPLICATE",
                    validation_remarks=f"Cross-Institutional Conflict: Student (APAAR {CROSS_COLLEGE_APAAR}) is actively enrolled at '{primary_colleges[0].name}' ({primary_colleges[0].aicte_id}). Dual full-time enrollment is prohibited.",
                    is_verified=False
                ))

                # Edge Case 6: Approved Intake Exceeded
                # Artificially set a small course intake and flood it with students
                it_course = courses[1]  # IT
                it_course.approved_intake = 10  # Reduced capacity
                for over_i in range(14):  # 14 students > 10 approved intake
                    roll_seq += 1
                    status_flag = "VALID" if over_i < 10 else "INTAKE_EXCEEDED"
                    remarks_flag = (
                        "Within sanctioned intake capacity." if over_i < 10
                        else f"Approved Intake limit of 10 exceeded for {it_course.department}. Current regular enrollment: {over_i + 1}."
                    )
                    students_to_create.append(Student(
                        apaar_id=generate_random_apaar(),
                        enrollment_no=f"EN26IT{roll_seq}",
                        full_name=f"{random.choice(FIRST_NAMES_MALE)} {random.choice(LAST_NAMES)}",
                        gender="Male",
                        category="General",
                        date_of_birth="2005-07-15",
                        date_of_admission="2026-08-22",
                        academic_year="2026-2027",
                        aicte_id=college.aicte_id,
                        course_id=it_course.id,
                        program=it_course.program,
                        department=it_course.department,
                        level=it_course.level,
                        admission_type="Regular",
                        validation_status=status_flag,
                        validation_remarks=remarks_flag,
                        is_verified=(status_flag == "VALID")
                    ))

        db.bulk_save_objects(students_to_create)
        db.commit()
        print(f"Created {len(students_to_create)} synthetic student records (including all edge cases).")

        # Seed Sankalp Hemant Mane (APAAR 126430259751) with DigiLocker ABC Card
        primary_c = primary_colleges[0]
        cs_c = db.query(CourseIntake).filter(CourseIntake.aicte_id == primary_c.aicte_id).first()
        sankalp_student = Student(
            apaar_id="126430259751",
            enrollment_no="EN26CS1264",
            full_name="SANKALP HEMANT MANE",
            gender="Male",
            category="General",
            date_of_birth="2004-06-18",
            date_of_admission="2026-08-01",
            academic_year="2026-2027",
            mobile_number="8767434172",
            credits_earned=84,
            cgpa=8.92,
            aicte_id=primary_c.aicte_id,
            course_id=cs_c.id if cs_c else None,
            program="Engineering and Technology",
            department="Computer Science and Engineering",
            level="UG",
            admission_type="Regular",
            validation_status="VALID",
            validation_remarks="All checks passed. Cryptographically verified against National Academic Bank of Credits (ABC).",
            verification_hash="sha256:d8b2e176430259751e041fa89c0281b37651e43c",
            is_verified=True,
            verified_by="Academic Bank of Credits (ABC) & AICTE Trust Network"
        )
        db.add(sankalp_student)
        db.commit()
        print("Seeded Sankalp Hemant Mane (APAAR 126430259751).")

        # Seed sample discrepancy remarks
        sample_remarks = [
            StudentRemark(
                apaar_id="126430259751",
                student_name="SANKALP HEMANT MANE",
                aicte_id=primary_c.aicte_id,
                remark_type="Inaccurate Personal Details",
                description="Date of birth was entered as 2004-06-18 instead of official Class X certificate date. Requesting sync with DigiLocker.",
                status="RESOLVED",
                contact_email="sankalp.mane@abc.gov.in",
                contact_mobile="8767434172",
                admin_notes="Synced with DigiLocker Aadhaar e-KYC record on 24-Oct-2026.",
                resolved_at=datetime.now(timezone.utc)
            ),
            StudentRemark(
                apaar_id="778899001122",
                student_name="Manish V. Pandey",
                aicte_id="1-46208965893",
                remark_type="Wrong College Mapping",
                description="System shows I am also enrolled at Dr. D. Y. Patil Technical Campus, but I cancelled my admission there during CAP Round 2.",
                status="PENDING",
                contact_email="manish.pandey@gmail.com",
                contact_mobile="8767434172"
            )
        ]
        db.bulk_save_objects(sample_remarks)
        db.commit()
        print("Seeded sample student remarks.")

        # Initial Audit Log entries
        audit_entries = [
            AuditLog(
                action="SYSTEM_INIT",
                entity_type="Platform",
                entity_id="AICTE_REGISTRY_V1",
                actor_id="AICTE_CENTRAL",
                actor_name="AICTE Central Authority",
                actor_role="AICTE_VERIFIER",
                details="Initial platform setup and national institute registry sync completed.",
                ip_address="10.0.1.1"
            ),
            AuditLog(
                action="VALIDATION_ALERT",
                entity_type="Student",
                entity_id=CROSS_COLLEGE_APAAR,
                actor_id="SYSTEM",
                actor_name="Automated Validation Engine",
                actor_role="SYSTEM",
                details=f"Cross-institution dual enrollment conflict flagged for APAAR {CROSS_COLLEGE_APAAR}.",
                ip_address="127.0.0.1"
            ),
            AuditLog(
                action="INTAKE_EXCEEDED_ALERT",
                entity_type="CourseIntake",
                entity_id="IT_UG_CAPACITY",
                actor_id="SYSTEM",
                actor_name="Automated Validation Engine",
                actor_role="SYSTEM",
                details="Course intake threshold breach detected: Information Technology (14/10 students).",
                ip_address="127.0.0.1"
            ),
        ]
        db.bulk_save_objects(audit_entries)
        db.commit()
        print("Audit trail initialized.")

    except Exception as e:
        db.rollback()
        print(f"Error during database seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
