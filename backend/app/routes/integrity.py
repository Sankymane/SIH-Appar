"""
Enrollment Integrity & Anomaly Detection API (L1-L5 pipeline from the sih2 module).

POST /integrity/audit        upload a batch CSV  -> full BatchReport (verdict, risk index, per-record violations)
POST /integrity/audit/demo   run the bundled planted demo batch
GET  /integrity/demo-batch   download the planted demo CSV
"""
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import ValidationError
from sqlalchemy.orm import Session

from ..auth import get_current_user_context
from ..database import get_db
from ..integrity import DATA_DIR
from ..integrity.pipeline import parse_and_validate_batch
from ..models import AuditLog

router = APIRouter(prefix="/integrity", tags=["Enrollment Integrity & Anomaly Detection"])

DEMO_CSV = DATA_DIR / "demo_planted_batch.csv"


def _run_batch(csv_text: str, user_context: dict, db: Session, source: str) -> dict:
    try:
        report = parse_and_validate_batch(csv_content=csv_text)
    except ValidationError as e:
        first = e.errors()[0]
        loc = ".".join(str(x) for x in first.get("loc", []))
        raise HTTPException(status_code=400, detail=f"Invalid batch CSV ({loc}): {first.get('msg')}")
    except (ValueError, KeyError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid batch CSV: {e}")

    db.add(AuditLog(
        action="INTEGRITY_AUDIT",
        entity_type="Batch",
        entity_id=report.batch_id,
        actor_id=user_context.get("aicte_id", "SYSTEM"),
        actor_name=user_context.get("college_name", "Institute Admin"),
        actor_role=user_context.get("role", "INSTITUTE_ADMIN"),
        details=(
            f"Integrity audit ({source}): {report.total_records} records, "
            f"{report.flagged_records_count} flagged, {report.critical_records_count} critical. "
            f"IRI {report.institution_risk_index} -> {report.regulatory_verdict}."
        ),
    ))
    db.commit()
    return report.model_dump(mode="json")


@router.post("/audit")
async def audit_batch(
    file: UploadFile = File(...),
    user_context: dict = Depends(get_current_user_context),
    db: Session = Depends(get_db),
):
    if not (file.filename or "").lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv batch file.")
    raw = await file.read()
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded CSV.")
    if not text.strip():
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    return _run_batch(text, user_context, db, source=file.filename)


@router.post("/audit/demo")
def audit_demo_batch(
    user_context: dict = Depends(get_current_user_context),
    db: Session = Depends(get_db),
):
    return _run_batch(DEMO_CSV.read_text(encoding="utf-8"), user_context, db, source="planted demo batch")


@router.get("/demo-batch")
def download_demo_batch():
    return FileResponse(Path(DEMO_CSV), media_type="text/csv", filename="demo_planted_batch.csv")
