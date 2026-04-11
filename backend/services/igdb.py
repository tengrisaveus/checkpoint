import httpx
from fastapi import HTTPException
from core.config import get_settings

settings = get_settings()

# Twitch OAuth2 erişim token'ı modül seviyesinde önbelleklenir.
# Not: Bu yaklaşım basit uygulamalar için yeterlidir; ancak yüksek eşzamanlılıkta
# race condition riski taşır. Token süresi dolduğunda igdb_request içinde yenilenir.
access_token = None

# Tüm IGDB istekleri için global timeout süresi (saniye)
IGDB_TIMEOUT = 10.0


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
    # İlk çalıştırmada token henüz alınmamışsa al
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

            # 401: Token süresi dolmuş — yenile ve bir kez daha dene
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

            # 4xx/5xx HTTP hatalarını exception'a çevirir
            response.raise_for_status()
            return response.json()

    except httpx.TimeoutException:
        # IGDB yanıt vermezse istemciye 504 Gateway Timeout döndür
        raise HTTPException(status_code=504, detail="IGDB API timeout")
    except httpx.HTTPStatusError:
        # Diğer HTTP hataları (403, 500 vb.) için genel 502 Bad Gateway
        raise HTTPException(status_code=502, detail="IGDB API error")


async def search_games(query: str):
    clean_query = query.replace('"', "").replace(";", "").strip()
    if not clean_query:
        return []
    return await igdb_request(
        "games",
        f'search "{clean_query}"; fields name, cover.url, first_release_date, summary, genres.name, platforms.name, category; limit 20;',
    )


async def get_game_detail(game_id: int):
    """Fetches full details of a specific game from IGDB."""
    return await igdb_request(
        "games",
        f"fields name, cover.url, first_release_date, summary, storyline, genres.name, platforms.abbreviation, platforms.name, involved_companies.company.name, rating, aggregated_rating, screenshots.url, artworks.url, websites.url, websites.category; where id = {game_id};",
    )


async def get_popular_games():
    """Most visited games on IGDB — popularity_type 1 = Visits"""
    popular = await igdb_request(
        "popularity_primitives",
        "fields game_id, value, popularity_type; where popularity_type = 1; sort value desc; limit 20;",
    )
    if not popular:
        return []
    ids = [str(p["game_id"]) for p in popular]
    return await igdb_request(
        "games",
        f"fields name, cover.url, first_release_date, genres.name, platforms.name, aggregated_rating; where id = ({','.join(ids)}) & cover != null; limit 20;",
    )


async def get_new_releases():
    """Recently released popular games"""
    playing = await igdb_request(
        "popularity_primitives",
        "fields game_id, value, popularity_type; where popularity_type = 3; sort value desc; limit 100;",
    )
    if not playing:
        return []
    ids = [str(p["game_id"]) for p in playing]
    import time
    two_years_ago = int(time.time()) - (730 * 24 * 60 * 60)
    return await igdb_request(
        "games",
        f"fields name, cover.url, first_release_date, genres.name, platforms.name, aggregated_rating; where id = ({','.join(ids)}) & cover != null & first_release_date > {two_years_ago}; limit 20;",
    )


async def get_upcoming_games():
    """Upcoming games: release_dates'ten ID al, games'ten cover'lı olanları çek."""
    import time
    now = int(time.time())
    six_months = now + (180 * 24 * 60 * 60)
    releases = await igdb_request(
        "release_dates",
        f"fields game; where date > {now} & date < {six_months}; sort date asc; limit 100;",
    )
    if not releases:
        return []
    seen: set = set()
    ids = []
    for r in releases:
        gid = r.get("game")
        if isinstance(gid, int) and gid not in seen:
            seen.add(gid)
            ids.append(str(gid))
    if not ids:
        return []
    return await igdb_request(
        "games",
        f"fields name, cover.url, first_release_date, genres.name, platforms.name; where id = ({','.join(ids)}) & cover != null; limit 20;",
    )


async def get_games_by_genre(genre_id: int):
    return await igdb_request(
        "games",
        f"fields name, cover.url, first_release_date, genres.name, platforms.name, aggregated_rating; where genres = ({genre_id}) & cover != null & category = (0,4,8,9,10) & aggregated_rating_count > 5; sort aggregated_rating desc; limit 20;",
    )


async def get_similar_games(game_id: int):
    result = await igdb_request(
        "games",
        f"fields similar_games.name, similar_games.cover.url, similar_games.first_release_date, similar_games.genres.name; where id = {game_id};",
    )
    if result and result[0].get("similar_games"):
        return result[0]["similar_games"]
    return []
