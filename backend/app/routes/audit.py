from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from ..database import get_db
from ..models import AuditLog
from ..schemas import AuditLogSchema

router = APIRouter(prefix="/audit-trail", tags=["Audit Trail"])

@router.get("", response_model=dict)
def get_audit_trail(
    action: Optional[str] = None,
    actor_role: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Retrieves chronological regulatory audit logs tracking student enrollments,
    verification changes, bulk uploads, and intake threshold breaches.
    """
    query = db.query(AuditLog)

    if action and action != "--All--":
        query = query.filter(AuditLog.action == action)
    if actor_role and actor_role != "--All--":
        query = query.filter(AuditLog.actor_role == actor_role)

    total_count = query.count()
    offset = (page - 1) * page_size
    logs = query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(page_size).all()

    return {
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size,
        "records": [
            AuditLogSchema(
                id=l.id,
                action=l.action,
                entity_type=l.entity_type,
                entity_id=l.entity_id,
                actor_id=l.actor_id,
                actor_name=l.actor_name,
                actor_role=l.actor_role,
                details=l.details,
                ip_address=l.ip_address,
                timestamp=l.timestamp
            )
            for l in logs
        ]
    }
