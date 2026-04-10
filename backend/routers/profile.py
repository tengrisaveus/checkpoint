from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta
from core.database import get_db
from models import User, UserGame, DiaryEntry, GameList, GameListItem

router = APIRouter()


@router.get("/{username}")
def get_public_profile(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    entries = db.query(UserGame).filter(UserGame.user_id == user.id).all()
    total = len(entries)

    by_status: dict[str, int] = {}
    for entry in entries:
        status = str(entry.status)
        by_status[status] = by_status.get(status, 0) + 1

    rated = [e for e in entries if e.rating is not None]
    avg_rating = (
        round(sum(float(e.rating) for e in rated) / len(rated), 1) if rated else None
    )

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

    favorites = (
        db.query(UserGame)
        .filter(UserGame.user_id == user.id, UserGame.is_favorite == True)
        .all()
    )
    favorites_list = [
        {
            "game_id": f.game_id,
            "game_name": f.game_name,
            "game_cover_url": f.game_cover_url,
        }
        for f in favorites
    ]

    diary_entries = db.query(DiaryEntry).filter(DiaryEntry.user_id == user.id).all()
    monthly_map: dict[str, int] = {}
    for entry in diary_entries:
        month_key = entry.played_at.strftime("%Y-%m")
        monthly_map[month_key] = monthly_map.get(month_key, 0) + 1

    today = date.today()
    monthly = []
    for i in range(5, -1, -1):
        d = today.replace(day=1) - timedelta(days=i * 30)
        key = d.strftime("%Y-%m")
        label = d.strftime("%b")
        monthly.append({"month": key, "label": label, "count": monthly_map.get(key, 0)})

    recent_diary = (
        db.query(DiaryEntry)
        .filter(DiaryEntry.user_id == user.id)
        .order_by(DiaryEntry.played_at.desc())
        .limit(10)
        .all()
    )
    recent_diary_list = [
        {
            "game_id": d.game_id,
            "game_name": d.game_name,
            "game_cover_url": d.game_cover_url,
            "played_at": str(d.played_at),
            "status": d.status,
            "rating": d.rating,
            "note": d.note,
        }
        for d in recent_diary
    ]

    lists = (
        db.query(GameList)
        .filter(GameList.user_id == user.id)
        .order_by(GameList.updated_at.desc())
        .all()
    )
    lists_data = []
    for lst in lists:
        items = (
            db.query(GameListItem)
            .filter(GameListItem.list_id == lst.id)
            .order_by(GameListItem.position)
            .limit(4)
            .all()
        )
        lists_data.append({
            "id": lst.id,
            "name": lst.name,
            "description": lst.description,
            "item_count": db.query(GameListItem).filter(GameListItem.list_id == lst.id).count(),
            "preview_covers": [
                item.game_cover_url for item in items if item.game_cover_url
            ],
        })

    return {
        "user": {
            "username": user.username,
            "created_at": str(user.created_at),
        },
        "stats": {
            "total_games": total,
            "by_status": by_status,
            "average_rating": avg_rating,
            "rated_count": len(rated),
            "completion_ratio": completion_ratio,
            "top_genres": top_genres_list,
        },
        "favorites": favorites_list,
        "monthly": monthly,
        "recent_diary": recent_diary_list,
        "lists": lists_data,
    }
