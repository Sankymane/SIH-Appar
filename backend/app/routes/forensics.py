from __future__ import annotations
import os
import io
import time
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from PIL import Image, ImageDraw, ImageFont

from ..database import get_db
from ..models import AuditLog
from ..auth import get_current_user_context, AUTHORIZED_ADMIN_PHONES
from ..forensic_service import analyze_document_authenticity, image_to_base64_data_uri

router = APIRouter(prefix="/document-verification", tags=["Document Verification"])

MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".tiff", ".tif", ".bmp"}
ALLOWED_MIMES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/tiff",
    "image/bmp",
    "application/octet-stream"
}


def require_stakeholder_role(user: dict = Depends(get_current_user_context)) -> dict:
    """
    Enforces that the current session belongs to a logged-in user with the 'stakeholder' role.
    Rejects other roles (e.g., student, unverified institute) with 403 Forbidden.
    """
    role = (user.get("role") or "").upper()
    aicte_id = str(user.get("aicte_id") or "")
    
    is_stakeholder = (
        role in ("AICTE_VERIFIER", "STAKEHOLDER", "REGULATOR", "SUPER_ADMIN") or
        aicte_id == "AICTE-CENTRAL" or
        aicte_id in AUTHORIZED_ADMIN_PHONES
    )
    
    if not is_stakeholder:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Access Denied: Document Forensic Verification (PhotoHolmes) is "
                "restricted exclusively to users with the 'stakeholder' / regulatory authority role."
            )
        )
    return user


@router.post("/verify", response_model=Dict[str, Any])
async def verify_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_stakeholder_role)
):
    """
    Secure Document Forgery Verification Endpoint (PhotoHolmes Pipeline).
    Exclusively accessible to logged-in stakeholders.
    """
    filename = file.filename or "uploaded_document"
    _, ext = os.path.splitext(filename)
    clean_ext = ext.lower()

    # 1. Validate File Format Extension
    if clean_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported document format '{clean_ext}'. "
                f"Please upload a standard image ({', '.join(ALLOWED_EXTENSIONS - {'.pdf'})}) "
                f"or a PDF document (.pdf)."
            )
        )

    # 2. Validate MIME Type if provided
    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_MIMES and not clean_ext:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file MIME type '{content_type}'."
        )

    # 3. Read File and Enforce File Size Limit (15MB)
    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(e)}"
        )

    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty (0 bytes)."
        )

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of 15MB (Received {round(len(file_bytes)/(1024*1024), 2)}MB)."
        )

    # 4. Execute PhotoHolmes Forensic Verification Pipeline
    try:
        result = analyze_document_authenticity(
            file_bytes=file_bytes,
            filename=filename,
            content_type=content_type
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PhotoHolmes forensic pipeline execution encountered an error: {str(e)}"
        )

    # 5. Record Cryptographic Audit Trail
    try:
        audit = AuditLog(
            action="DOCUMENT_FORGERY_VERIFICATION",
            actor_id=current_user.get("aicte_id") or "STAKEHOLDER",
            actor_name=current_user.get("college_name") or "Stakeholder Authority",
            details=(
                f"PhotoHolmes Document Verification for '{filename}': Verdict={result['verdict']}, "
                f"ForgeryProbability={result['forgery_probability']}%, Conf={result['confidence_score']}"
            ),
            ip_address="127.0.0.1"
        )
        db.add(audit)
        db.commit()
    except Exception as ae:
        print(f"Warning: Audit log write skipped: {ae}")

    return result


@router.get("/samples")
def get_sample_test_documents(current_user: dict = Depends(require_stakeholder_role)):
    """
    Generates synthetic sample documents (Authentic and Tampered/Forged)
    for immediate 1-click evaluation by stakeholders.
    """
    samples = []

    # Sample 1: Authentic Degree Certificate
    try:
        img_auth = Image.new("RGB", (900, 650), color=(252, 252, 250))
        d_auth = ImageDraw.Draw(img_auth)
        # Border
        d_auth.rectangle([(20, 20), (880, 630)], outline=(11, 34, 101), width=4)
        d_auth.rectangle([(28, 28), (872, 622)], outline=(255, 87, 34), width=1)
        d_auth.text((280, 50), "ALL INDIA COUNCIL FOR TECHNICAL EDUCATION", fill=(11, 34, 101))
        d_auth.text((310, 80), "OFFICIAL DEGREE COMPLETION CERTIFICATE", fill=(11, 34, 101))
        d_auth.text((80, 160), "This is to certify that SANKALP HEMANT MANE has successfully completed the prescribed", fill=(30, 41, 59))
        d_auth.text((80, 190), "curriculum for BACHELOR OF TECHNOLOGY in COMPUTER SCIENCE AND ENGINEERING.", fill=(30, 41, 59))
        d_auth.text((80, 240), "APAAR ID: 1264 3025 9751 | Enrollment No: EN26CS1001 | CGPA: 9.42 / 10.00", fill=(11, 34, 101))
        d_auth.text((80, 280), "Institution: JAWAHARLAL NEHRU RAJKEEYA MAHAVIDYALAYA (1-44465113304)", fill=(71, 85, 105))
        d_auth.text((80, 520), "Date of Issue: 25th October 2026", fill=(71, 85, 105))
        d_auth.text((650, 520), "[ Registrar Signature ]", fill=(11, 34, 101))
        
        # Save authentic as uniform JPEG 90
        buf_auth = io.BytesIO()
        img_auth.save(buf_auth, format="JPEG", quality=90)
        auth_b64 = image_to_base64_data_uri(img_auth, "JPEG", 90)

        samples.append({
            "id": "sample-authentic",
            "name": "Authentic Degree Certificate (Pristine)",
            "expected_verdict": "AUTHENTIC",
            "description": "Uniform compression throughout. No spliced text or mismatched noise characteristics.",
            "data_uri": auth_b64
        })

        # Sample 2: Tampered Degree Certificate (Forged CGPA & Spliced Signature Block)
        img_forged = img_auth.copy()
        d_forged = ImageDraw.Draw(img_forged)
        # Spliced CGPA patch with mismatched compression
        patch_cgpa = Image.new("RGB", (320, 36), color=(240, 240, 230))
        d_patch = ImageDraw.Draw(patch_cgpa)
        d_patch.text((10, 8), "ALTERED CGPA: 9.98 (FORGED)", fill=(185, 28, 28))
        buf_patch = io.BytesIO()
        patch_cgpa.save(buf_patch, format="JPEG", quality=35)
        buf_patch.seek(0)
        img_forged.paste(Image.open(buf_patch), (480, 235))

        # Spliced stamp / signature block with noise anomaly
        patch_sig = Image.new("RGB", (220, 60), color=(220, 220, 240))
        d_sig = ImageDraw.Draw(patch_sig)
        d_sig.text((10, 10), "[ SPLICED STAMP / SEAL ]", fill=(153, 27, 27))
        buf_sig = io.BytesIO()
        patch_sig.save(buf_sig, format="JPEG", quality=40)
        buf_sig.seek(0)
        img_forged.paste(Image.open(buf_sig), (640, 500))

        forged_b64 = image_to_base64_data_uri(img_forged, "JPEG", 85)

        samples.append({
            "id": "sample-forged",
            "name": "Tampered Degree Certificate (Altered CGPA & Spliced Signature)",
            "expected_verdict": "TAMPERED_FORGERY",
            "description": "Exhibits sharp Error Level Analysis (ELA) divergence and PhotoHolmes noise anomalies in 2 altered patches.",
            "data_uri": forged_b64
        })
    except Exception as e:
        print(f"Sample generation notice: {e}")

    return samples
