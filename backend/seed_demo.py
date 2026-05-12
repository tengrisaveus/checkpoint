#!/usr/bin/env python3
"""
Seed the production demo account with a curated library, diary, and lists.

Run from the backend/ directory in an environment where the application's env
vars are loaded (DATABASE_URL, SECRET_KEY, TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET):

    python seed_demo.py

Behaviour:
  - Finds the demo user by email (demo@checkpoint.app). Creates it if missing,
    with password demo123456 and username 'demo'.
  - Wipes that user's library entries, diary entries, and lists (cascading
    list items). The User row itself is preserved.
  - Resolves each curated game name against IGDB to fetch the real game id,
    cover URL, and genre list — matching what the live "add to library" flow
    stores. Games that don't resolve are silently skipped.
  - Re-inserts ~40 library entries (across all 4 statuses, 4 favourites),
    ~25 diary entries spanning the last ~4 months, and 5 themed lists.

The script is idempotent: running it again wipes and refills cleanly.
"""

import os
import sys
import time
from datetime import date, timedelta

import httpx

# Allow running this file directly from backend/.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session  # noqa: E402

from core.auth import hash_password  # noqa: E402
from core.config import get_settings  # noqa: E402
from core.database import SessionLocal  # noqa: E402
from models import DiaryEntry, GameList, GameListItem, User, UserGame  # noqa: E402

DEMO_EMAIL = "demo@checkpoint.app"
DEMO_USERNAME = "demo"
DEMO_PASSWORD = "demo123456"

settings = get_settings()
_access_token: str | None = None


# -- IGDB lookup ---------------------------------------------------------------

def _get_twitch_token() -> str:
    global _access_token
    r = httpx.post(
        "https://id.twitch.tv/oauth2/token",
        params={
            "client_id": settings.twitch_client_id,
            "client_secret": settings.twitch_client_secret,
            "grant_type": "client_credentials",
        },
        timeout=10,
    )
    r.raise_for_status()
    _access_token = r.json()["access_token"]
    return _access_token


def _igdb(endpoint: str, body: str) -> list[dict]:
    global _access_token
    if _access_token is None:
        _get_twitch_token()

    def _do(token: str):
        return httpx.post(
            f"https://api.igdb.com/v4/{endpoint}",
            headers={
                "Client-ID": settings.twitch_client_id,
                "Authorization": f"Bearer {token}",
            },
            content=body,
            timeout=15,
        )

    r = _do(_access_token or "")
    if r.status_code == 401:
        _get_twitch_token()
        r = _do(_access_token or "")
    r.raise_for_status()
    return r.json()


def resolve_game(name: str) -> dict | None:
    """Search IGDB for a game name and return the best matching base game."""
    clean = name.replace('"', "").replace(";", "").strip()
    if not clean:
        return None
    results = _igdb(
        "games",
        (
            f'search "{clean}";'
            " fields name, cover.url, genres.name, category;"
            " where category = (0,4,8,9,10);"
            " limit 8;"
        ),
    )
    if not results:
        return None

    target = clean.lower()
    # Exact name match first
    for r in results:
        if r.get("name", "").lower() == target:
            return r
    # Then loose match — first result with a cover
    for r in results:
        if r.get("cover"):
            return r
    return results[0]


# -- Curated dataset -----------------------------------------------------------

# (name, status, rating, review, is_favorite)
LIBRARY: list[tuple[str, str, int | None, str | None, bool]] = [
    # COMPLETED (14, with 4 favorites)
    ("Hollow Knight", "Completed", 10, "Quiet, lonely, and devastating. A small kingdom that feels enormous.", True),
    ("Outer Wilds", "Completed", 10, "I will never get to feel this for the first time again.", True),
    ("Portal 2", "Completed", 10, "Comedy and physics, both perfect.", True),
    ("Celeste", "Completed", 10, "A game about being kind to yourself, dressed as a platformer.", True),
    ("Disco Elysium", "Completed", 10, "The best writing in the medium. Read it again every year.", False),
    ("The Witcher 3: Wild Hunt", "Completed", 9, "Bloody Baron is the best quest in any RPG.", False),
    ("Sekiro: Shadows Die Twice", "Completed", 9, "When the rhythm clicks, it's the closest games get to dancing.", False),
    ("Hades", "Completed", 9, None, False),
    ("Return of the Obra Dinn", "Completed", 9, "A puzzle that respects you.", False),
    ("Inside", "Completed", 8, None, False),
    ("Stardew Valley", "Completed", 9, None, False),
    ("Hyper Light Drifter", "Completed", 8, "Mood as gameplay.", False),
    ("Dark Souls", "Completed", 9, None, False),
    ("What Remains of Edith Finch", "Completed", 9, "Sat in the chair for ten minutes after the credits.", False),

    # PLAYING (6)
    ("Baldur's Gate 3", "Playing", 9, "Act 3 fatigue is real but I keep coming back.", False),
    ("Elden Ring", "Playing", 9, None, False),
    ("The Legend of Zelda: Tears of the Kingdom", "Playing", 8, None, False),
    ("Pizza Tower", "Playing", None, None, False),
    ("Cyberpunk 2077", "Playing", 8, None, False),
    ("Final Fantasy XVI", "Playing", None, None, False),

    # WANT TO PLAY (16)
    ("Death Stranding", "Want to Play", None, None, False),
    ("Red Dead Redemption 2", "Want to Play", None, None, False),
    ("Metaphor: ReFantazio", "Want to Play", None, None, False),
    ("Pentiment", "Want to Play", None, None, False),
    ("Tunic", "Want to Play", None, None, False),
    ("Citizen Sleeper", "Want to Play", None, None, False),
    ("Lies of P", "Want to Play", None, None, False),
    ("Alan Wake 2", "Want to Play", None, None, False),
    ("Resident Evil 4", "Want to Play", None, None, False),
    ("Marvel's Spider-Man 2", "Want to Play", None, None, False),
    ("Persona 5 Royal", "Want to Play", None, None, False),
    ("Slay the Spire", "Want to Play", None, None, False),
    ("Inscryption", "Want to Play", None, None, False),
    ("Cocoon", "Want to Play", None, None, False),
    ("Balatro", "Want to Play", None, None, False),
    ("Stray", "Want to Play", None, None, False),

    # DROPPED (4)
    ("No Man's Sky", "Dropped", 5, "Will come back, maybe. Drifted off.", False),
    ("Far Cry 6", "Dropped", 5, None, False),
    ("Anthem", "Dropped", 4, None, False),
    ("Marvel's Avengers", "Dropped", 4, None, False),
]

# (name, description, [game names])
LISTS: list[tuple[str, str, list[str]]] = [
    (
        "Soulslike pilgrimage",
        "From the first hollow to the lands between.",
        ["Dark Souls", "Sekiro: Shadows Die Twice", "Elden Ring", "Lies of P", "Hollow Knight"],
    ),
    (
        "Cozy Saturdays",
        "Slow afternoons, warm tea, nothing on fire.",
        ["Stardew Valley", "Cocoon", "Tunic", "Stray"],
    ),
    (
        "Slept on 2024",
        "Loud games hogged the headlines.",
        ["Pentiment", "Citizen Sleeper", "Cocoon", "Pizza Tower", "Balatro"],
    ),
    (
        "Comfort replays",
        "Games I return to like favorite books.",
        ["Portal 2", "Hades", "Celeste", "Hollow Knight"],
    ),
    (
        "On the radar",
        "Soon. Hopefully.",
        ["Metaphor: ReFantazio", "Alan Wake 2", "Marvel's Spider-Man 2", "Resident Evil 4"],
    ),
]

# (name, days_ago, status, rating, note)
DIARY: list[tuple[str, int, str, int | None, str | None]] = [
    ("Baldur's Gate 3", 2, "Playing", 9, "Half-elf bard, sleeping with absolutely everyone."),
    ("Pizza Tower", 4, "Playing", None, None),
    ("Cyberpunk 2077", 6, "Playing", 8, None),
    ("Elden Ring", 8, "Playing", None, "Got Malenia to phase 2 and then bed."),
    ("Baldur's Gate 3", 9, "Playing", None, None),
    ("The Legend of Zelda: Tears of the Kingdom", 12, "Playing", 8, None),
    ("Hollow Knight", 18, "Completed", 10, "Started a new file just for the Path of Pain."),
    ("Hades", 22, "Completed", 9, "21st clear, still not bored."),
    ("Pizza Tower", 25, "Playing", None, None),
    ("Outer Wilds", 30, "Completed", 10, "Replay with friends. They cried, I cried."),
    ("Disco Elysium", 38, "Completed", 10, None),
    ("Sekiro: Shadows Die Twice", 45, "Completed", 9, "Genichiro tonight, Owl tomorrow."),
    ("Celeste", 50, "Completed", 10, None),
    ("Inside", 55, "Completed", 8, "Three hours, one of them spent staring at the ending."),
    ("Hyper Light Drifter", 62, "Completed", 8, None),
    ("Stardew Valley", 70, "Completed", 9, "Year three. Married Abigail."),
    ("The Witcher 3: Wild Hunt", 78, "Completed", 9, None),
    ("No Man's Sky", 85, "Dropped", 5, "Drifted off in a star system I can't remember."),
    ("Return of the Obra Dinn", 92, "Completed", 9, "Lighthouse last. As it should be."),
    ("Dark Souls", 98, "Completed", 9, None),
    ("Portal 2", 105, "Completed", 10, "Coop with my brother, finally."),
    ("Far Cry 6", 110, "Dropped", 5, None),
    ("What Remains of Edith Finch", 115, "Completed", 9, "Lewis."),
    ("Anthem", 120, "Dropped", 4, None),
]


# -- Main routine --------------------------------------------------------------

def main() -> None:
    db: Session = SessionLocal()
    try:
        # 1. Ensure demo user exists.
        user = db.query(User).filter(User.email == DEMO_EMAIL).first()
        if user is None:
            user = User(
                username=DEMO_USERNAME,
                email=DEMO_EMAIL,
                hashed_password=hash_password(DEMO_PASSWORD),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created demo user (id={user.id}).")
        else:
            print(f"Found demo user (id={user.id}).")

        # 2. Wipe existing data for this user.
        diary_deleted = (
            db.query(DiaryEntry).filter(DiaryEntry.user_id == user.id).delete()
        )
        lib_deleted = (
            db.query(UserGame).filter(UserGame.user_id == user.id).delete()
        )
        existing_lists = (
            db.query(GameList).filter(GameList.user_id == user.id).all()
        )
        existing_list_ids = [lst.id for lst in existing_lists]
        if existing_list_ids:
            db.query(GameListItem).filter(
                GameListItem.list_id.in_(existing_list_ids)
            ).delete(synchronize_session=False)
        lists_deleted = (
            db.query(GameList).filter(GameList.user_id == user.id).delete()
        )
        db.commit()
        print(
            f"Wiped: {lib_deleted} library, {diary_deleted} diary, "
            f"{lists_deleted} lists."
        )

        # 3. Resolve every referenced game name against IGDB once.
        all_names: set[str] = set()
        for name, *_ in LIBRARY:
            all_names.add(name)
        for _, _, names in LISTS:
            all_names.update(names)
        for name, *_ in DIARY:
            all_names.add(name)

        print(f"\nResolving {len(all_names)} games via IGDB…")
        resolved: dict[str, dict] = {}
        for name in sorted(all_names):
            try:
                game = resolve_game(name)
            except Exception as exc:  # network or auth failure
                print(f"  ✗ {name}: {exc}")
                continue
            if not game or not game.get("cover"):
                print(f"  ✗ {name}: no IGDB result with cover")
                continue
            cover_url = game["cover"]["url"].replace("t_thumb", "t_cover_big")
            genres = ", ".join(g.get("name", "") for g in game.get("genres", []))
            resolved[name] = {
                "id": int(game["id"]),
                "name": game["name"],
                "cover_url": cover_url,
                "genres": genres or None,
            }
            print(f"  ✓ {name} → id={game['id']} ({game['name']})")
            # Gentle pacing — IGDB free tier is 4 req/sec.
            time.sleep(0.3)

        # 4. Insert library entries.
        inserted_lib = 0
        favorites = 0
        for name, status, rating, review, is_favorite in LIBRARY:
            g = resolved.get(name)
            if not g:
                continue
            db.add(
                UserGame(
                    user_id=user.id,
                    game_id=g["id"],
                    game_name=g["name"],
                    game_cover_url=g["cover_url"],
                    status=status,
                    rating=rating,
                    review=review,
                    is_favorite=is_favorite,
                    game_genres=g["genres"],
                )
            )
            inserted_lib += 1
            if is_favorite:
                favorites += 1
        db.commit()
        print(
            f"\nLibrary: {inserted_lib}/{len(LIBRARY)} inserted "
            f"({favorites} favourites)."
        )

        # 5. Insert diary entries.
        today = date.today()
        inserted_diary = 0
        for name, days_ago, status, rating, note in DIARY:
            g = resolved.get(name)
            if not g:
                continue
            db.add(
                DiaryEntry(
                    user_id=user.id,
                    game_id=g["id"],
                    game_name=g["name"],
                    game_cover_url=g["cover_url"],
                    played_at=today - timedelta(days=days_ago),
                    status=status,
                    rating=rating,
                    note=note,
                )
            )
            inserted_diary += 1
        db.commit()
        print(f"Diary: {inserted_diary}/{len(DIARY)} inserted.")

        # 6. Insert lists + items.
        inserted_lists = 0
        for list_name, desc, names in LISTS:
            lst = GameList(user_id=user.id, name=list_name, description=desc)
            db.add(lst)
            db.flush()
            seen: set[int] = set()
            pos = 0
            for n in names:
                g = resolved.get(n)
                if not g or g["id"] in seen:
                    continue
                seen.add(g["id"])
                db.add(
                    GameListItem(
                        list_id=lst.id,
                        game_id=g["id"],
                        game_name=g["name"],
                        game_cover_url=g["cover_url"],
                        position=pos,
                    )
                )
                pos += 1
            inserted_lists += 1
        db.commit()
        print(f"Lists: {inserted_lists}/{len(LISTS)} inserted.")

        print("\n✓ Demo seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
