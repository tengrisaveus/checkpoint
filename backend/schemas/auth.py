from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime


class UserCreate(BaseModel):
    # Sadece harf, rakam ve alt çizgi — " admin ", emoji, sırf nokta gibi
    # gariplikleri en başta eliyor. min_length 3 zaten vardı.
    username: str = Field(min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr
    # NIST'in modern önerisi 8+ minimum; eski 6 çok zayıf signal'di.
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