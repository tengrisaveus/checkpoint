from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.auth import get_current_user
from models import User, GameList, GameListItem
from schemas import (
    GameListCreate,
    GameListUpdate,
    GameListResponse,
    GameListDetailResponse,
    GameListItemAdd,
    GameListItemResponse,
)
from services.igdb import get_game_detail

router = APIRouter()


@router.post("/", response_model=GameListResponse)
def create_list(
    list_data: GameListCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Creates a new custom list."""
    new_list = GameList(
        user_id=current_user.id,
        name=list_data.name,
        description=list_data.description,
    )
    db.add(new_list)
    db.commit()
    db.refresh(new_list)
    return new_list


@router.get("/", response_model=list[GameListResponse])
def get_lists(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns all lists for the current user."""
    return (
        db.query(GameList)
        .filter(GameList.user_id == current_user.id)
        .order_by(GameList.updated_at.desc())
        .all()
    )


@router.get("/{list_id}", response_model=GameListDetailResponse)
def get_list_detail(
    list_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns a list with all its items."""
    game_list = db.query(GameList).filter(
        GameList.id == list_id,
        GameList.user_id == current_user.id,
    ).first()
    if not game_list:
        raise HTTPException(status_code=404, detail="List not found")

    items = (
        db.query(GameListItem)
        .filter(GameListItem.list_id == list_id)
        .order_by(GameListItem.position)
        .all()
    )

    return GameListDetailResponse(
        id=game_list.id,
        name=game_list.name,
        description=game_list.description,
        created_at=game_list.created_at,
        updated_at=game_list.updated_at,
        items=items,
    )


@router.put("/{list_id}", response_model=GameListResponse)
def update_list(
    list_id: int,
    list_data: GameListUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Updates list name or description."""
    game_list = db.query(GameList).filter(
        GameList.id == list_id,
        GameList.user_id == current_user.id,
    ).first()
    if not game_list:
        raise HTTPException(status_code=404, detail="List not found")

    if list_data.name is not None:
        game_list.name = list_data.name
    if list_data.description is not None:
        game_list.description = list_data.description

    db.commit()
    db.refresh(game_list)
    return game_list


@router.delete("/{list_id}")
def delete_list(
    list_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deletes a list and all its items (CASCADE)."""
    game_list = db.query(GameList).filter(
        GameList.id == list_id,
        GameList.user_id == current_user.id,
    ).first()
    if not game_list:
        raise HTTPException(status_code=404, detail="List not found")

    db.delete(game_list)
    db.commit()
    return {"detail": "List deleted"}


@router.post("/{list_id}/items", response_model=GameListItemResponse)
async def add_item_to_list(
    list_id: int,
    item_data: GameListItemAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Adds a game to a list."""
    game_list = db.query(GameList).filter(
        GameList.id == list_id,
        GameList.user_id == current_user.id,
    ).first()
    if not game_list:
        raise HTTPException(status_code=404, detail="List not found")

    existing = db.query(GameListItem).filter(
        GameListItem.list_id == list_id,
        GameListItem.game_id == item_data.game_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Game already in list")

    results = await get_game_detail(item_data.game_id)
    if not results:
        raise HTTPException(status_code=404, detail="Game not found on IGDB")

    game_info = results[0]
    cover_url = None
    if game_info.get("cover") and game_info["cover"].get("url"):
        cover_url = game_info["cover"]["url"].replace("t_thumb", "t_cover_big")

    max_pos = db.query(GameListItem).filter(
        GameListItem.list_id == list_id
    ).count()

    new_item = GameListItem(
        list_id=list_id,
        game_id=item_data.game_id,
        game_name=game_info["name"],
        game_cover_url=cover_url,
        note=item_data.note,
        position=max_pos,
    )

    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@router.delete("/{list_id}/items/{game_id}")
def remove_item_from_list(
    list_id: int,
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Removes a game from a list."""
    game_list = db.query(GameList).filter(
        GameList.id == list_id,
        GameList.user_id == current_user.id,
    ).first()
    if not game_list:
        raise HTTPException(status_code=404, detail="List not found")

    item = db.query(GameListItem).filter(
        GameListItem.list_id == list_id,
        GameListItem.game_id == game_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Game not in list")

    db.delete(item)
    db.commit()
    return {"detail": "Game removed from list"}
