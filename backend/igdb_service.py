import httpx
from fastapi import HTTPException
from config import get_settings

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
    """Searches IGDB by game name and returns up to 10 results."""
    # Apicalypse sorgusunu bozabilecek tırnak ve noktalı virgül karakterlerini temizle
    clean_query = query.replace('"', "").replace(";", "").strip()
    if not clean_query:
        return []
    return await igdb_request(
        "games",
        f'search "{clean_query}"; fields name, cover.url, first_release_date, summary, genres.name, platforms.name; limit 10;',
    )


async def get_game_detail(game_id: int):
    """Fetches full details of a specific game from IGDB."""
    # game_id FastAPI tarafından integer olarak doğrulanır, sorgu injection riski yok
    return await igdb_request(
        "games",
        f"fields name, cover.url, first_release_date, summary, storyline, genres.name, platforms.name, involved_companies.company.name, rating, aggregated_rating; where id = {game_id};",
    )