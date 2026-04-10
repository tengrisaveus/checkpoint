from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from starlette.requests import Request
from core.database import get_db
from core.auth import hash_password, verify_password, create_access_token, get_current_user
from core.limiter import limiter
from models import User
from schemas.auth import UserCreate, UserResponse, LoginRequest, UserProfileUpdate

router = APIRouter()


@router.post("/register", response_model=UserResponse)
@limiter.limit("5/minute")
def register(request: Request, user_data: UserCreate, db: Session = Depends(get_db)):
    """Registers a new user after checking for duplicate email and username."""
    # Check if email is already in use
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check if username is already taken
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already taken")

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login")
@limiter.limit("10/minute")
def login(request: Request, user_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates a user and returns a JWT access token.
    Both 'user not found' and 'wrong password' return the same 401 to prevent user enumeration.
    """
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(user_data.password, str(user.hashed_password)):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # sub claim stores user ID as string, as per JWT convention
    access_token = create_access_token(data={"sub": str(user.id)})

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns the currently authenticated user. Token validation is handled by get_current_user."""
    return current_user

@router.put("/me", response_model=UserResponse)
def update_profile(
    profile_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if profile_data.bio is not None:
        current_user.bio = profile_data.bio # type: ignore
    if profile_data.avatar_url is not None:
        current_user.avatar_url = profile_data.avatar_url # type: ignore
    db.commit()
    db.refresh(current_user)
    return current_user
