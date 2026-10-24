import time
import random
from typing import Dict, Optional
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .database import get_db
from .models import College

SECRET_KEY = "AICTE_APAAR_SUPER_SECURE_JWT_SECRET_2026_KEY"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token", auto_error=False)

# In-memory storage for active simulated OTP sessions
# session_token -> {"aicte_id": ..., "otp": ..., "expires_at": ...}
OTP_SESSIONS: Dict[str, Dict] = {}

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def generate_simulated_otp(aicte_id: str) -> Dict[str, str]:
    """Generates a random 6-digit OTP and creates a temporary session."""
    otp = f"{random.randint(100000, 999999)}"
    session_token = f"sess_{aicte_id}_{int(time.time())}_{random.randint(1000, 9999)}"
    
    OTP_SESSIONS[session_token] = {
        "aicte_id": aicte_id,
        "otp": otp,
        "expires_at": time.time() + 300  # 5 minutes expiry
    }
    return {
        "session_token": session_token,
        "otp": otp
    }

def verify_otp_session(session_token: str, input_otp: str, aicte_id: str) -> bool:
    """Verifies OTP from active session; accepts master demo OTP '123456' as well."""
    # Always allow master demo OTP for seamless evaluation
    if input_otp == "123456":
        return True

    session = OTP_SESSIONS.get(session_token)
    if not session:
        return False

    if session["aicte_id"] != aicte_id:
        return False

    if time.time() > session["expires_at"]:
        del OTP_SESSIONS[session_token]
        return False

    if session["otp"] == input_otp.strip():
        del OTP_SESSIONS[session_token]
        return True

    return False

def get_current_user_context(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Extracts authenticated user context from token or defaults to demo context."""
    if not token:
        # If no token passed, return demo Institute Admin context
        college = db.query(College).first()
        if college:
            return {
                "aicte_id": college.aicte_id,
                "college_name": college.name,
                "role": "INSTITUTE_ADMIN"
            }
        return {
            "aicte_id": "1-44525213207",
            "college_name": "Demo Institute of Technology",
            "role": "INSTITUTE_ADMIN"
        }

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        aicte_id: str = payload.get("sub")
        role: str = payload.get("role", "INSTITUTE_ADMIN")
        college_name: str = payload.get("name", "")
        if aicte_id is None:
            raise HTTPException(status_code=401, detail="Invalid auth credentials")
        return {
            "aicte_id": aicte_id,
            "college_name": college_name,
            "role": role
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
