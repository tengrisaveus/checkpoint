from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, UserGame
from schemas import UserGameCreate, UserGameUpdate, UserGameResponse
from auth import get_current_user
from igdb_service import get_game_detail

router = APIRouter()


@router.post("/", response_model=UserGameResponse)
async def add_game(
    game_data: UserGameCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(UserGame).filter(
        UserGame.user_id == current_user.id,
        UserGame.game_id == game_data.game_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Game already in library")

    # IGDB'den oyun bilgisini çek
    results = await get_game_detail(game_data.game_id)
    if not results:
        raise HTTPException(status_code=404, detail="Game not found on IGDB")

    game_info = results[0]
    cover_url = None
    if game_info.get("cover") and game_info["cover"].get("url"):
        cover_url = game_info["cover"]["url"].replace("t_thumb", "t_cover_big")

    new_entry = UserGame(
        user_id=current_user.id,
        game_id=game_data.game_id,
        game_name=game_info["name"],
        game_cover_url=cover_url,
        status=game_data.status.value,
        rating=game_data.rating,
        review=game_data.review,
    )

    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)

    return new_entry


@router.get("/", response_model=list[UserGameResponse])
def get_library(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(UserGame).filter(UserGame.user_id == current_user.id).all()


@router.put("/{game_id}", response_model=UserGameResponse)
def update_game(
    game_id: int,
    game_data: UserGameUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = db.query(UserGame).filter(
        UserGame.user_id == current_user.id,
        UserGame.game_id == game_id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Game not in library")

    if game_data.status is not None:
        entry.status = game_data.status.value  # type: ignore
    if game_data.rating is not None:
        entry.rating = game_data.rating  # type: ignore
    if game_data.review is not None:
        entry.review = game_data.review  # type: ignore

    db.commit()
    db.refresh(entry)

    return entry


@router.delete("/{game_id}")
def remove_game(
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = db.query(UserGame).filter(
        UserGame.user_id == current_user.id,
        UserGame.game_id == game_id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Game not in library")

    db.delete(entry)
    db.commit()

    return {"detail": "Game removed from library"}