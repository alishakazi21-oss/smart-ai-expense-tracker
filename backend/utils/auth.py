"""
utils/auth.py
─────────────
JWT creation and verification helpers.
Used as FastAPI dependency: `user = Depends(require_auth)`.
"""

import os
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

JWT_SECRET   = os.getenv("JWT_SECRET", "spendwise-secret-key-change-in-prod")
JWT_ALGO     = "HS256"
JWT_EXP_HRS  = 24

security = HTTPBearer()


# ── Token Creation ────────────────────────────────────────────
def make_token(user_id: int, username: str) -> str:
    """Create a signed JWT for a user."""
    payload = {
        "user_id":  user_id,
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXP_HRS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


# ── Token Verification ────────────────────────────────────────
def decode_token(token: str) -> dict:
    """Decode and verify a JWT. Raises HTTPException on failure."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


# ── FastAPI Dependency ────────────────────────────────────────
def require_auth(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    FastAPI dependency that extracts the current user from the Bearer token.
    Returns dict: {"user_id": int, "username": str}
    """
    return decode_token(credentials.credentials)
