from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from core.database import get_db
from core.config import get_settings

settings = get_settings()

# Using bcrypt scheme; "deprecated=auto" automatically upgrades legacy hashes
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hashes a plain-text password with bcrypt; used during registration."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain-text password against the stored hash; used during login."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    """
    Creates a signed JWT access token.
    The `data` dict is copied to avoid mutating the original, then an exp claim is added.
    Expiry duration is controlled by access_token_expire_minutes in config.
    """
    to_encode = data.copy()
    # Expiry is calculated in UTC to avoid timezone-related drift
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    # Signed with HS256 by default; secret_key is loaded from .env
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


# HTTPBearer automatically parses the Authorization: Bearer <token> header
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """
    FastAPI dependency: resolves and returns the authenticated user for protected endpoints.
    Raises 401 if the token is invalid or the user no longer exists.
    """
    from models import User  # late import to avoid circular dependency

    token = credentials.credentials
    try:
        # Verifies token signature and expiry; raises JWTError if invalid
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str | None = payload.get("sub")
        if user_id is None:
            # Token is present but missing the sub claim — malformed token
            raise HTTPException(status_code=401, detail="User ID missing from token")
        user_id_int = int(user_id)
    except (JWTError, ValueError):
        # JWTError: invalid signature, expired token, etc.
        # ValueError: sub claim is not a valid integer
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Look up the user in DB; token may be valid but the account could have been deleted
    user = db.query(User).filter(User.id == user_id_int).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user
