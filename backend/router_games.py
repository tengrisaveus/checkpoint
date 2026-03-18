from fastapi import APIRouter, HTTPException

from igdb_service import search_games, get_game_detail

router = APIRouter()

@router.get("/search")
async def search(query: str):
    results = await search_games(query)
    return results

@router.get("/{game_id}")
async def game_detail(game_id: int):
    results = await get_game_detail(game_id)
    if not results:
        raise HTTPException(status_code=404, detail="Game not found")
    return results[0]