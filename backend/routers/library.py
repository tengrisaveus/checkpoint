from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.auth import get_current_user
from models import User, UserGame, DiaryEntry
from schemas import UserGameCreate, UserGameUpdate, UserGameResponse
from services.igdb import get_game_detail

router = APIRouter()


def _create_diary_entry(db: Session, user_id: int, entry: UserGame, new_status: str) -> None:
    """
    Library entry'sinden otomatik diary kaydı yaratır.
    Yalnızca `Playing` veya `Completed` status'leri için çağrılmalı — caller
    transition kontrolünü yapar. game_name/game_cover_url library entry'sinde
    cache'li olduğu için ekstra IGDB çağrısı gerekmiyor.
    """
    diary = DiaryEntry(
        user_id=user_id,
        game_id=entry.game_id,
        game_name=entry.game_name,
        game_cover_url=entry.game_cover_url,
        played_at=date.today(),
        status=new_status,
        rating=entry.rating if new_status == "Completed" else None,
        note=None,
    )
    db.add(diary)


@router.post("/", response_model=UserGameResponse)
async def add_game(
    game_data: UserGameCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Adds a game to the user's library.
    Fetches metadata from IGDB and upgrades the cover thumbnail to full size.
    Auto-creates a diary entry if the initial status is Playing or Completed.
    """
    existing = db.query(UserGame).filter(
        UserGame.user_id == current_user.id,
        UserGame.game_id == game_data.game_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Game already in library")

    results = await get_game_detail(game_data.game_id)
    if not results:
        raise HTTPException(status_code=404, detail="Game not found on IGDB")

    game_info = results[0]
    cover_url = None
    if game_info.get("cover") and game_info["cover"].get("url"):
        cover_url = game_info["cover"]["url"].replace("t_thumb", "t_cover_big")

    genres_str = None
    if game_info.get("genres"):
        genres_str = ", ".join(g["name"] for g in game_info["genres"])

    new_entry = UserGame(
        user_id=current_user.id,
        game_id=game_data.game_id,
        game_name=game_info["name"],
        game_cover_url=cover_url,
        game_genres=genres_str,
        status=game_data.status.value,
        rating=game_data.rating,
        review=game_data.review,
    )

    db.add(new_entry)

    # İlk eklemede status Playing/Completed ise diary'ye de düş
    if new_entry.status in ("Playing", "Completed"):
        _create_diary_entry(db, current_user.id, new_entry, new_entry.status)

    db.commit()
    db.refresh(new_entry)

    return new_entry


@router.get("/", response_model=list[UserGameResponse])
def get_library(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns all games in the current user's library."""
    return db.query(UserGame).filter(UserGame.user_id == current_user.id).all()


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns aggregate stats for the user's library."""
    entries = db.query(UserGame).filter(UserGame.user_id == current_user.id).all()

    if not entries:
        return {
            "total_games": 0,
            "by_status": {},
            "average_rating": None,
            "rated_count": 0,
            "reviewed_count": 0,
            "completion_ratio": 0,
            "top_genres": [],
        }

    total = len(entries)

    by_status = {}
    for entry in entries:
        status = str(entry.status)
        by_status[status] = by_status.get(status, 0) + 1

    rated = [e for e in entries if e.rating is not None]
    avg_rating = round(sum(float(e.rating) for e in rated) / len(rated), 1) if rated else None  # type: ignore

    reviewed = [e for e in entries if e.review]  # type: ignore

    completed = by_status.get("Completed", 0)
    completion_ratio = round(completed / total * 100) if total > 0 else 0

    genre_count: dict[str, int] = {}
    for entry in entries:
        genres = str(entry.game_genres) if entry.game_genres is not None else ""
        for genre in genres.split(", "):
            genre = genre.strip()
            if genre:
                genre_count[genre] = genre_count.get(genre, 0) + 1

    top_genres = sorted(genre_count.items(), key=lambda x: x[1], reverse=True)[:5]
    top_genres_list = [{"name": name, "count": count} for name, count in top_genres]

    return {
        "total_games": total,
        "by_status": by_status,
        "average_rating": avg_rating,
        "rated_count": len(rated),
        "reviewed_count": len(reviewed),
        "completion_ratio": completion_ratio,
        "top_genres": top_genres_list,
    }


@router.get("/favorites", response_model=list[UserGameResponse])
def get_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns the user's favorite games (max 4)."""
    return (
        db.query(UserGame)
        .filter(UserGame.user_id == current_user.id, UserGame.is_favorite == True)
        .all()
    )


@router.put("/favorites")
def update_favorites(
    game_ids: list[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Sets favorite games. Accepts a list of up to 4 game_ids."""
    if len(game_ids) > 4:
        raise HTTPException(status_code=400, detail="Maximum 4 favorites allowed")

    db.query(UserGame).filter(
        UserGame.user_id == current_user.id,
        UserGame.is_favorite == True,
    ).update({"is_favorite": False})

    for gid in game_ids:
        entry = db.query(UserGame).filter(
            UserGame.user_id == current_user.id,
            UserGame.game_id == gid,
        ).first()
        if entry:
            entry.is_favorite = True  # type: ignore

    db.commit()
    return {"detail": "Favorites updated"}


@router.put("/{game_id}", response_model=UserGameResponse)
def update_game(
    game_id: int,
    game_data: UserGameUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Updates status, rating, or review for a game in the user's library.
    Auto-creates a diary entry when status transitions INTO Playing or Completed
    (replay scenarios — Completed → Playing — count as a new run).
    """
    entry = db.query(UserGame).filter(
        UserGame.user_id == current_user.id,
        UserGame.game_id == game_id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Game not in library")

    old_status = str(entry.status)
    new_status = game_data.status.value if game_data.status is not None else old_status

    if new_status != "Completed" and (game_data.rating is not None or game_data.review):
        raise HTTPException(status_code=400, detail="Rating and review are only allowed when status is Completed")

    if game_data.status is not None:
        entry.status = game_data.status.value  # type: ignore
    if game_data.rating is not None:
        entry.rating = game_data.rating  # type: ignore
    if game_data.review is not None:
        entry.review = game_data.review  # type: ignore

    if new_status != "Completed":
        entry.rating = None  # type: ignore
        entry.review = None  # type: ignore

    # Status değiştiyse ve hedef Playing/Completed ise diary entry yarat.
    # Aynı status'a re-save (örn. sadece review eklendi) entry üretmiyor.
    if old_status != new_status and new_status in ("Playing", "Completed"):
        _create_diary_entry(db, current_user.id, entry, new_status)

    db.commit()
    db.refresh(entry)

    return entry


@router.delete("/{game_id}")
def remove_game(
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Removes a game from the user's library. Diary entries are preserved
    (deleting from library doesn't erase historical plays)."""
    entry = db.query(UserGame).filter(
        UserGame.user_id == current_user.id,
        UserGame.game_id == game_id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Game not in library")

    db.delete(entry)
    db.commit()

    return {"detail": "Game removed from library"}