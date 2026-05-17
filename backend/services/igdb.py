import httpx
import time
from fastapi import HTTPException
from core.config import get_settings

settings = get_settings()

# Twitch OAuth2 erişim token'ı modül seviyesinde önbelleklenir.
# Token süresi dolduğunda igdb_request içinde 401 retry ile yenilenir.
access_token = None

# Tüm IGDB istekleri için global timeout süresi (saniye)
IGDB_TIMEOUT = 10.0

# IGDB game_type değerleri (eski `category` alanı 2025'te deprecate oldu, ID'ler aynı):
# 0 = main_game, 4 = standalone_expansion, 8 = remake, 9 = remaster, 10 = expanded_game
# Edition / bundle / DLC olanları (1, 2, 3, 5, 6, 7, 11, 12, 13, 14) bu filtre eler.
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


def _reorder_by_ids(games: list[dict], ids: list[int]) -> list[dict]:
    """
    IGDB 'games' endpoint'i `where id = (a,b,c)` query'lerinde dönüş sırasını
    korumuyor — kendi sıralama mantığımıza göre yeniden diziyoruz.
    """
    order = {gid: i for i, gid in enumerate(ids)}
    return sorted(games, key=lambda g: order.get(g.get("id"), 10_000))


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
    Most visited games on IGDB — popularity_type 1 = Visits.
    primitives'ten gelen sıra (visits desc) games endpoint'inde korunmadığı için
    sonradan _reorder_by_ids ile yeniden diziliyor.
    """
    popular = await igdb_request(
        "popularity_primitives",
        "fields game_id, value; where popularity_type = 1; "
        "sort value desc; limit 30;",
    )
    if not popular:
        return []
    ids = [p["game_id"] for p in popular]
    games = await igdb_request(
        "games",
        f"fields name, cover.url, first_release_date, genres.name, "
        f"platforms.name, aggregated_rating; "
        f"where id = ({','.join(map(str, ids))}) & cover != null "
        f"& game_type = {MAIN_GAME_TYPES}; limit 30;",
    )
    return _reorder_by_ids(games, ids)[:20]


async def get_new_releases():
    """
    "Hot" — son 2 yılda çıkmış ve şu an aktif oynanan oyunlar.
    popularity_type 3 = Playing (currently active players).
    """
    playing = await igdb_request(
        "popularity_primitives",
        "fields game_id, value; where popularity_type = 3; "
        "sort value desc; limit 100;",
    )
    if not playing:
        return []
    ids = [p["game_id"] for p in playing]
    two_years_ago = int(time.time()) - (730 * 24 * 60 * 60)
    games = await igdb_request(
        "games",
        f"fields name, cover.url, first_release_date, genres.name, "
        f"platforms.name, aggregated_rating; "
        f"where id = ({','.join(map(str, ids))}) & cover != null "
        f"& game_type = {MAIN_GAME_TYPES} "
        f"& first_release_date > {two_years_ago}; limit 30;",
    )
    return _reorder_by_ids(games, ids)[:20]


async def get_upcoming_games():
    """
    Önümüzdeki 6 ay içinde çıkacak oyunlar.
    release_dates'ten tarih sırası alınıp games endpoint'inde edition/version
    filtrelendikten sonra orijinal tarih sırası geri yükleniyor.
    """
    now = int(time.time())
    six_months = now + (180 * 24 * 60 * 60)
    releases = await igdb_request(
        "release_dates",
        f"fields game; where date > {now} & date < {six_months}; "
        f"sort date asc; limit 100;",
    )
    if not releases:
        return []
    seen: set[int] = set()
    ids: list[int] = []
    for r in releases:
        gid = r.get("game")
        if isinstance(gid, int) and gid not in seen:
            seen.add(gid)
            ids.append(gid)
    if not ids:
        return []
    games = await igdb_request(
        "games",
        f"fields name, cover.url, first_release_date, genres.name, platforms.name; "
        f"where id = ({','.join(map(str, ids))}) & cover != null "
        f"& game_type = {MAIN_GAME_TYPES} & version_parent = null; limit 30;",
    )
    return _reorder_by_ids(games, ids)[:20]


async def get_games_by_genre(genre_id: int):
    return await igdb_request(
        "games",
        f"fields name, cover.url, first_release_date, genres.name, "
        f"platforms.name, aggregated_rating; "
        f"where genres = ({genre_id}) & cover != null "
        f"& game_type = {MAIN_GAME_TYPES} & aggregated_rating_count > 5; "
        f"sort aggregated_rating desc; limit 20;",
    )


async def get_similar_games(game_id: int):
    """
    Önce IGDB'nin similar_games alanını dener. Boş gelirse aynı genre'lardan
    yüksek puanlı oyunları fallback olarak döner (boş "Similar Games" rail'i
    göstermemek için).
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

    # Fallback: aynı genre'dan top-rated, kendisini hariç tut
    genres = result[0].get("genres", [])
    if not genres:
        return []
    genre_list = ",".join(str(g) for g in genres)
    return await igdb_request(
        "games",
        f"fields name, cover.url, first_release_date, genres.name; "
        f"where genres = ({genre_list}) & id != {game_id} & cover != null "
        f"& game_type = {MAIN_GAME_TYPES} & aggregated_rating_count > 10; "
        f"sort aggregated_rating desc; limit 10;",
    )