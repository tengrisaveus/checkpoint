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
    """
    Adds a game to the user's library.
    Fetches metadata from IGDB and upgrades the cover thumbnail to full size.
    """
    existing = db.query(UserGame).filter(
        UserGame.user_id == current_user.id,
        UserGame.game_id == game_data.game_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Game already in library")

    # Fetch game metadata from IGDB to store name and cover alongside the entry
    results = await get_game_detail(game_data.game_id)
    if not results:
        raise HTTPException(status_code=404, detail="Game not found on IGDB")

    game_info = results[0]
    cover_url = None
    if game_info.get("cover") and game_info["cover"].get("url"):
        # IGDB returns thumbnail URLs (t_thumb); upgrade to full cover size (t_cover_big)
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
    """Returns all games in the current user's library."""
    return db.query(UserGame).filter(UserGame.user_id == current_user.id).all()


# IMPORTANT: /stats must be defined before /{game_id} (PUT) to avoid any future
# route conflicts if a GET /{game_id} endpoint is ever added.
@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns aggregate stats for the user's library: totals, status breakdown, ratings, and reviews."""
    entries = db.query(UserGame).filter(UserGame.user_id == current_user.id).all()

    if not entries:
        return {
            "total_games": 0,
            "by_status": {},
            "average_rating": None,
            "rated_count": 0,
            "reviewed_count": 0,
        }

    total = len(entries)

    by_status = {}
    for entry in entries:
        status = str(entry.status)
        by_status[status] = by_status.get(status, 0) + 1

    rated = [e for e in entries if e.rating is not None]
    avg_rating = round(sum(float(e.rating) for e in rated) / len(rated), 1) if rated else None #type: ignore

    reviewed = [e for e in entries if e.review] #type: ignore

    return {
        "total_games": total,
        "by_status": by_status,
        "average_rating": avg_rating,
        "rated_count": len(rated),
        "reviewed_count": len(reviewed),
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

    # Clear existing favorites
    db.query(UserGame).filter(
        UserGame.user_id == current_user.id,
        UserGame.is_favorite == True,
    ).update({"is_favorite": False})

    # Set new favorites
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
    Only fields explicitly provided (non-None) are updated (partial update semantics).
    """
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
    """Removes a game from the user's library. Returns 404 if the game isn't in the library."""
    entry = db.query(UserGame).filter(
        UserGame.user_id == current_user.id,
        UserGame.game_id == game_id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Game not in library")

    db.delete(entry)
    db.commit()

    return {"detail": "Game removed from library"}

