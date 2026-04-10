from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6)


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
