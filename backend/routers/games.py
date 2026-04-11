from fastapi import APIRouter, HTTPException
from services.igdb import (
    search_games,
    get_game_detail,
    get_popular_games,
    get_new_releases,
    get_upcoming_games,
    get_games_by_genre,
    get_similar_games,
)

router = APIRouter()


@router.get("/popular")
async def popular():
    return await get_popular_games()


@router.get("/new-releases")
async def new_releases():
    return await get_new_releases()


@router.get("/upcoming")
async def upcoming():
    return await get_upcoming_games()


@router.get("/genre/{genre_id}")
async def by_genre(genre_id: int):
    return await get_games_by_genre(genre_id)


@router.get("/search")
async def search(query: str):
    return await search_games(query)


@router.get("/{game_id}/similar")
async def similar(game_id: int):
    return await get_similar_games(game_id)


@router.get("/{game_id}")
async def game_detail(game_id: int):
    results = await get_game_detail(game_id)
    if not results:
        raise HTTPException(status_code=404, detail="Game not found")
    return results[0]