import httpx
from fastapi import HTTPException
from config import get_settings

settings = get_settings()

access_token = None

IGDB_TIMEOUT = 10.0


async def get_twitch_token():
    global access_token
    async with httpx.AsyncClient(timeout=IGDB_TIMEOUT) as client:
        response = await client.post(
            "https://id.twitch.tv/oauth2/token",
            params={
                "client_id": settings.twitch_client_id,
                "client_secret": settings.twitch_client_secret,
                "grant_type": "client_credentials",
            },
        )
        response.raise_for_status()
        data = response.json()
        access_token = data["access_token"]
    return access_token


async def igdb_request(endpoint: str, query: str):
    global access_token
    if access_token is None:
        await get_twitch_token()

    try:
        async with httpx.AsyncClient(timeout=IGDB_TIMEOUT) as client:
            response = await client.post(
                f"https://api.igdb.com/v4/{endpoint}",
                headers={
                    "Client-ID": settings.twitch_client_id,
                    "Authorization": f"Bearer {access_token}",
                },
                content=query,
            )

            if response.status_code == 401:
                await get_twitch_token()
                response = await client.post(
                    f"https://api.igdb.com/v4/{endpoint}",
                    headers={
                        "Client-ID": settings.twitch_client_id,
                        "Authorization": f"Bearer {access_token}",
                    },
                    content=query,
                )

            response.raise_for_status()
            return response.json()

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="IGDB API timeout")
    except httpx.HTTPStatusError:
        raise HTTPException(status_code=502, detail="IGDB API error")


async def search_games(query: str):
    clean_query = query.replace('"', "").strip()
    if not clean_query:
        return []
    return await igdb_request(
        "games",
        f'search "{clean_query}"; fields name, cover.url, first_release_date, summary, genres.name, platforms.name; limit 10;',
    )


async def get_game_detail(game_id: int):
    return await igdb_request(
        "games",
        f"fields name, cover.url, first_release_date, summary, storyline, genres.name, platforms.name, involved_companies.company.name, rating, aggregated_rating; where id = {game_id};",
    )