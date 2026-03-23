from fastapi import APIRouter, HTTPException

from igdb_service import search_games, get_game_detail

router = APIRouter()


# IMPORTANT: /search must be defined before /{game_id} so FastAPI doesn't
# interpret the literal string "search" as an integer game_id and return 422.
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
    # IGDB always returns a list; extract the single matching game
    return results[0]