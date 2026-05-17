import re
import time
import httpx
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
from fastapi import HTTPException
from jose import jwt, JWTError
from core.config import get_settings

settings = get_settings()

STEAM_OPENID_URL = "https://steamcommunity.com/openid/login"
STEAM_API_BASE = "https://api.steampowered.com"
STEAM_CDN_BASE = "https://media.steampowered.com/steamcommunity/public/images/apps"

# claimed_id format: https://steamcommunity.com/openid/id/76561198023716352
STEAM_ID_PATTERN = re.compile(r"^https?://steamcommunity\.com/openid/id/(\d{17})$")

OPENID_NS = "http://specs.openid.net/auth/2.0"
OPENID_IDENTIFIER_SELECT = "http://specs.openid.net/auth/2.0/identifier_select"


# ---------- OpenID state tokens ----------

def create_state_token(user_id: int) -> str:
    """
    Short-lived JWT used to carry the user_id through the Steam OpenID redirect
    chain (Steam OpenID has no session of its own). The `purpose` claim keeps
    these from being confused with auth access tokens.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=10)
    return jwt.encode(
        {"sub": str(user_id), "exp": expire, "purpose": "steam-oauth-state"},
        settings.secret_key,
        algorithm=settings.algorithm,
    )


def verify_state_token(token: str) -> int:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        if payload.get("purpose") != "steam-oauth-state":
            raise HTTPException(status_code=400, detail="Invalid state token")
        return int(payload["sub"])
    except (JWTError, ValueError, KeyError):
        raise HTTPException(status_code=400, detail="Invalid or expired state token")


# ---------- OpenID flow ----------

def build_login_url(state: str) -> str:
    """Builds the URL the frontend should redirect the user to in order to start Steam login."""
    return_to = f"{settings.backend_url}/connections/steam/callback?state={state}"
    realm = settings.backend_url + "/"
    params = {
        "openid.ns": OPENID_NS,
        "openid.mode": "checkid_setup",
        "openid.return_to": return_to,
        "openid.realm": realm,
        "openid.identity": OPENID_IDENTIFIER_SELECT,
        "openid.claimed_id": OPENID_IDENTIFIER_SELECT,
    }
    return f"{STEAM_OPENID_URL}?{urlencode(params)}"


async def verify_openid_response(params: dict) -> str:
    """
    Verifies the OpenID response Steam sent back. Verification requires a
    second round-trip to Steam (openid.mode='check_authentication'); without
    it, an attacker could hit the callback directly with any SteamID. Returns
    the parsed 64-bit SteamID when Steam responds with `is_valid:true`.
    """
    if params.get("openid.mode") != "id_res":
        raise HTTPException(status_code=400, detail="Steam authentication was cancelled")

    claimed_id = params.get("openid.claimed_id", "")
    match = STEAM_ID_PATTERN.match(claimed_id)
    if not match:
        raise HTTPException(status_code=400, detail="Invalid Steam identity")

    verification_params = dict(params)
    verification_params["openid.mode"] = "check_authentication"

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(STEAM_OPENID_URL, data=verification_params)
        response.raise_for_status()

    if "is_valid:true" not in response.text:
        raise HTTPException(status_code=400, detail="Steam response could not be verified")

    return match.group(1)


# ---------- Steam Web API ----------

async def _steam_api(client: httpx.AsyncClient, path: str, **params) -> dict:
    if not settings.steam_api_key:
        raise HTTPException(status_code=503, detail="Steam integration not configured")
    params["key"] = settings.steam_api_key
    response = await client.get(f"{STEAM_API_BASE}/{path}", params=params)
    response.raise_for_status()
    return response.json()


def _steam_app_image(app_id: int, hash_value: str | None) -> str | None:
    """Builds the Steam community CDN URL for a game icon. Returns None when hash is missing."""
    if not hash_value:
        return None
    return f"{STEAM_CDN_BASE}/{app_id}/{hash_value}.jpg"


async def fetch_showcase(steam_id: str) -> dict:
    """
    Collects showcase data from the Steam Web API. When a profile is private,
    only GetPlayerSummaries returns useful data — the others 200 with empty
    payloads. In that case showcase_data['private']=True is returned so the
    frontend can render an appropriate "your profile is private" message.
    """
    async with httpx.AsyncClient(timeout=15.0) as client:
        summaries = await _steam_api(
            client,
            "ISteamUser/GetPlayerSummaries/v2/",
            steamids=steam_id,
        )
        players = summaries.get("response", {}).get("players", [])
        if not players:
            raise HTTPException(status_code=404, detail="Steam profile not found")
        player = players[0]

        display_name = player.get("personaname")
        avatar_url = player.get("avatarfull") or player.get("avatarmedium")
        # 3 = public, 1 = private, 2 = friends-only
        is_public = player.get("communityvisibilitystate") == 3

        if not is_public:
            return {
                "display_name": display_name,
                "avatar_url": avatar_url,
                "showcase_data": {"private": True},
            }

        owned = await _steam_api(
            client,
            "IPlayerService/GetOwnedGames/v1/",
            steamid=steam_id,
            include_played_free_games=True,
            include_appinfo=True,
        )
        recent = await _steam_api(
            client,
            "IPlayerService/GetRecentlyPlayedGames/v1/",
            steamid=steam_id,
            count=6,
        )

    games = owned.get("response", {}).get("games", [])
    total_games = len(games)
    total_playtime_minutes = sum(g.get("playtime_forever", 0) for g in games)

    # Top 6 by lifetime playtime
    top_games = sorted(games, key=lambda g: g.get("playtime_forever", 0), reverse=True)[:6]
    top_games_payload = [
        {
            "app_id": g["appid"],
            "name": g.get("name", "Unknown"),
            "playtime_minutes": g.get("playtime_forever", 0),
            "image_url": _steam_app_image(g["appid"], g.get("img_icon_url")),
        }
        for g in top_games
    ]

    recent_games_raw = recent.get("response", {}).get("games", [])
    recent_games_payload = [
        {
            "app_id": g["appid"],
            "name": g.get("name", "Unknown"),
            "playtime_minutes": g.get("playtime_forever", 0),
            "playtime_2weeks_minutes": g.get("playtime_2weeks", 0),
            "image_url": _steam_app_image(g["appid"], g.get("img_icon_url")),
        }
        for g in recent_games_raw
    ]

    return {
        "display_name": display_name,
        "avatar_url": avatar_url,
        "showcase_data": {
            "private": False,
            "total_games": total_games,
            "total_playtime_minutes": total_playtime_minutes,
            "top_games": top_games_payload,
            "recent_games": recent_games_payload,
            "synced_at": int(time.time()),
        },
    }
