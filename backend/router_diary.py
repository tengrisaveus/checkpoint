from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, DiaryEntry
from schemas import DiaryEntryCreate, DiaryEntryResponse
from auth import get_current_user
from igdb_service import get_game_detail

router = APIRouter()


@router.post("/", response_model=DiaryEntryResponse)
async def add_diary_entry(
    entry_data: DiaryEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Adds a diary entry. A game can have multiple entries (e.g. replays)."""
    results = await get_game_detail(entry_data.game_id)
    if not results:
        raise HTTPException(status_code=404, detail="Game not found on IGDB")

    game_info = results[0]
    cover_url = None
    if game_info.get("cover") and game_info["cover"].get("url"):
        cover_url = game_info["cover"]["url"].replace("t_thumb", "t_cover_big")

    new_entry = DiaryEntry(
        user_id=current_user.id,
        game_id=entry_data.game_id,
        game_name=game_info["name"],
        game_cover_url=cover_url,
        played_at=entry_data.played_at,
        status=entry_data.status.value,
        rating=entry_data.rating,
        note=entry_data.note,
    )

    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry


@router.get("/", response_model=list[DiaryEntryResponse])
def get_diary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns all diary entries for the current user, newest first."""
    return (
        db.query(DiaryEntry)
        .filter(DiaryEntry.user_id == current_user.id)
        .order_by(DiaryEntry.played_at.desc())
        .all()
    )


@router.delete("/{entry_id}")
def delete_diary_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deletes a diary entry by ID."""
    entry = db.query(DiaryEntry).filter(
        DiaryEntry.id == entry_id,
        DiaryEntry.user_id == current_user.id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Diary entry not found")

    db.delete(entry)
    db.commit()
    return {"detail": "Diary entry deleted"}