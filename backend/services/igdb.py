import httpx
import time
from fastapi import HTTPException
from core.config import get_settings

settings = get_settings()

# Twitch OAuth2 access token is cached at module level.
# It is refreshed via a 401 retry inside igdb_request when it expires.
access_token = None

# Global timeout (seconds) for all IGDB requests
IGDB_TIMEOUT = 10.0

# IGDB game_type values (the old `category` field was deprecated in 2025, IDs are the same):
# 0 = main_game, 4 = standalone_expansion, 8 = remake, 9 = remaster, 10 = expanded_game
# This filter excludes editions / bundles / DLC (1, 2, 3, 5, 6, 7, 11, 12, 13, 14).
MAIN_GAME_TYPES = "(0,4,8,9,10)"


async def get_twitch_token():
    """Fetches and caches a new OAuth2 token using the Twitch client credentials flow."""
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
    """
    Sends an Apicalypse query to the IGDB API.
    Automatically refreshes the token and retries once if a 401 is returned.
    """
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
    clean_query = query.replace('"', "").replace(";", "").strip()
    if not clean_query:
        return []
    return await igdb_request(
        "games",
        f'search "{clean_query}"; '
        f"fields name, cover.url, first_release_date, summary, genres.name, "
        f"platforms.name, category, involved_companies.company.name; limit 20;",
    )


async def get_game_detail(game_id: int):
    """Fetches full details of a specific game from IGDB."""
    return await igdb_request(
        "games",
        f"fields name, cover.url, first_release_date, summary, storyline, "
        f"genres.name, platforms.abbreviation, platforms.name, "
        f"involved_companies.company.name, rating, aggregated_rating, "
        f"screenshots.url, artworks.url, websites.url, websites.category; "
        f"where id = {game_id};",
    )


async def get_popular_games():
    """
    Popular games — pulled from a wide pool of the IGDB Visits trend (top 200),
    filtered to games with a high rating count, then sorted by total rating count.
    Result: games that are both trending and genuinely well-known.
    """
    popular = await igdb_request(
        "popularity_primitives",
        "fields game_id, value; where popularity_type = 1; "
        "sort value desc; limit 200;",
    )
    if not popular:
        return []
    ids = [p["game_id"] for p in popular]
    return await igdb_request(
        "games",
        f"fields name, cover.url, first_release_date, genres.name, "
        f"platforms.name, aggregated_rating, total_rating_count; "
        f"where id = ({','.join(map(str, ids))}) & cover != null "
        f"& game_type = {MAIN_GAME_TYPES} "
        f"& total_rating_count > 20; "
        f"sort total_rating_count desc; limit 20;",
    )


async def get_new_releases():
    """
    "Hot" — games released in the last 2 years that are widely rated on IGDB.
    The popularity_primitives "Playing" tracker is fed by very few users and was
    mixing unknown indies into the results; instead we sort by total_rating_count
    with a threshold — a reliable proxy for recognition.
    """
    now = int(time.time())
    two_years_ago = now - (730 * 24 * 60 * 60)
    return await igdb_request(
        "games",
        f"fields name, cover.url, first_release_date, genres.name, "
        f"platforms.name, aggregated_rating, total_rating_count; "
        f"where first_release_date > {two_years_ago} "
        f"& first_release_date < {now} "
        f"& cover != null "
        f"& game_type = {MAIN_GAME_TYPES} "
        f"& total_rating_count > 20; "
        f"sort total_rating_count desc; limit 20;",
    )


async def get_upcoming_games():
    """
    Games releasing within the next 6 months.
    They have no total_rating_count yet since they haven't shipped; instead we
    sort by `hypes` (IGDB users' excitement counter) with a threshold.
    """
    now = int(time.time())
    six_months = now + (180 * 24 * 60 * 60)
    return await igdb_request(
        "games",
        f"fields name, cover.url, first_release_date, genres.name, platforms.name, hypes; "
        f"where first_release_date > {now} "
        f"& first_release_date < {six_months} "
        f"& cover != null "
        f"& game_type = {MAIN_GAME_TYPES} "
        f"& version_parent = null "
        f"& hypes > 1; "
        f"sort hypes desc; limit 20;",
    )


async def get_games_by_genre(genre_id: int):
    return await igdb_request(
        "games",
        f"fields name, cover.url, first_release_date, genres.name, "
        f"platforms.name, aggregated_rating, total_rating_count; "
        f"where genres = ({genre_id}) & cover != null "
        f"& game_type = {MAIN_GAME_TYPES} & total_rating_count > 20; "
        f"sort aggregated_rating desc; limit 20;",
    )


async def get_similar_games(game_id: int):
    """
    First tries IGDB's similar_games field. If empty, falls back to top-rated
    games from the same genres (so we never show an empty "Similar Games" rail).
    """
    result = await igdb_request(
        "games",
        f"fields similar_games.name, similar_games.cover.url, "
        f"similar_games.first_release_date, similar_games.genres.name, genres; "
        f"where id = {game_id};",
    )
    if not result:
        return []

    similar = result[0].get("similar_games", [])
    if similar:
        return similar

    # Fallback: top-rated from the same genre, excluding the game itself
    genres = result[0].get("genres", [])
    if not genres:
        return []
    genre_list = ",".join(str(g) for g in genres)
    return await igdb_request(
        "games",
        f"fields name, cover.url, first_release_date, genres.name, total_rating_count; "
        f"where genres = ({genre_list}) & id != {game_id} & cover != null "
        f"& game_type = {MAIN_GAME_TYPES} & total_rating_count > 20; "
        f"sort aggregated_rating desc; limit 10;",
    )