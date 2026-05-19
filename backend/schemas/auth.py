from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime


class UserCreate(BaseModel):
    # Letters, digits and underscore only — rejects oddities like " admin ",
    # emoji, or just-a-dot up front. min_length 3 was already in place.
    username: str = Field(min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr
    # NIST's current recommendation is 8+ minimum; the previous 6 was a very weak signal.
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    # No password validation here — the hash comparison handles incorrect passwords
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    # from_attributes allows Pydantic to read values from SQLAlchemy model instances
    model_config = ConfigDict(from_attributes=True)