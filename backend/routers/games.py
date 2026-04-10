from fastapi import APIRouter, HTTPException
from services.igdb import search_games, get_game_detail, get_popular_games

router = APIRouter()


@router.get("/popular")
async def popular():
    """Returns popular highly-rated games for the discovery section."""
    return await get_popular_games()


@router.get("/search")
async def search(query: str):
    """Searches IGDB by game name. Returns an empty list if no results are found."""
    return await search_games(query)


@router.get("/{game_id}")
async def game_detail(game_id: int):
    """Returns full details for a single game. Raises 404 if the game ID doesn't exist on IGDB."""
    results = await get_game_detail(game_id)
    if not results:
        raise HTTPException(status_code=404, detail="Game not found")
    return results[0]
