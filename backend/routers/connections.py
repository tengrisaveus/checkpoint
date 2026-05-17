from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from core.database import get_db
from core.auth import get_current_user
from core.config import get_settings
from models import User, ConnectedAccount
from services import steam

settings = get_settings()
router = APIRouter()


@router.get("/me")
def list_my_connections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns the current user's connected platforms (without showcase payload)."""
    accounts = db.query(ConnectedAccount).filter(
        ConnectedAccount.user_id == current_user.id
    ).all()
    return [
        {
            "platform": a.platform,
            "external_id": a.external_id,
            "display_name": a.display_name,
            "avatar_url": a.avatar_url,
            "last_synced_at": a.last_synced_at,
        }
        for a in accounts
    ]


@router.get("/steam/login")
def steam_login(current_user: User = Depends(get_current_user)):
    """
    Returns the Steam OpenID URL the frontend should redirect the user to.
    A short-lived state token carries the user_id through the redirect chain
    (Steam OpenID has no session of its own).
    """
    if not settings.steam_api_key:
        raise HTTPException(status_code=503, detail="Steam integration not configured")
    state = steam.create_state_token(current_user.id)
    return {"redirect_url": steam.build_login_url(state)}


@router.get("/steam/callback")
async def steam_callback(request: Request, db: Session = Depends(get_db)):
    """
    Steam OpenID callback handler. Verifies the response, identifies the
    user via the `state` JWT, fetches the showcase, and redirects back to
    the frontend Settings page with a status flag.
    """
    params = dict(request.query_params)
    state = params.pop("state", None)
    if not state:
        raise HTTPException(status_code=400, detail="Missing state")

    user_id = steam.verify_state_token(state)
    steam_id = await steam.verify_openid_response(params)

    try:
        result = await steam.fetch_showcase(steam_id)
    except Exception:
        # If the showcase fetch fails (API key missing, network error, Steam
        # rate-limit), still persist the connection so the user can hit
        # "Refresh" later. Failing the whole flow would make them think the
        # link never happened.
        result = {"display_name": None, "avatar_url": None, "showcase_data": None}

    existing = db.query(ConnectedAccount).filter(
        ConnectedAccount.user_id == user_id,
        ConnectedAccount.platform == "steam",
    ).first()

    if existing:
        existing.external_id = steam_id  # type: ignore
        existing.display_name = result["display_name"]  # type: ignore
        existing.avatar_url = result["avatar_url"]  # type: ignore
        existing.showcase_data = result["showcase_data"]  # type: ignore
        existing.last_synced_at = datetime.now(timezone.utc)  # type: ignore
    else:
        db.add(ConnectedAccount(
            user_id=user_id,
            platform="steam",
            external_id=steam_id,
            display_name=result["display_name"],
            avatar_url=result["avatar_url"],
            showcase_data=result["showcase_data"],
            last_synced_at=datetime.now(timezone.utc),
        ))
    db.commit()

    return RedirectResponse(
        url=f"{settings.frontend_url}/settings?steam=connected",
        status_code=303,
    )


@router.post("/steam/refresh")
async def steam_refresh(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually re-syncs Steam showcase data. Rate-limited to prevent abuse."""
    account = db.query(ConnectedAccount).filter(
        ConnectedAccount.user_id == current_user.id,
        ConnectedAccount.platform == "steam",
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Steam not connected")

    # Sync at most once per 5 minutes
    if account.last_synced_at is not None:
        elapsed = (datetime.now(timezone.utc) - account.last_synced_at).total_seconds()  # type: ignore
        if elapsed < 300:
            raise HTTPException(status_code=429, detail="Please wait before refreshing again")

    result = await steam.fetch_showcase(str(account.external_id))
    account.display_name = result["display_name"]  # type: ignore
    account.avatar_url = result["avatar_url"]  # type: ignore
    account.showcase_data = result["showcase_data"]  # type: ignore
    account.last_synced_at = datetime.now(timezone.utc)  # type: ignore
    db.commit()

    return {"detail": "Refreshed"}


@router.delete("/steam")
def steam_disconnect(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Disconnects the user's Steam account."""
    account = db.query(ConnectedAccount).filter(
        ConnectedAccount.user_id == current_user.id,
        ConnectedAccount.platform == "steam",
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Steam not connected")
    db.delete(account)
    db.commit()
    return {"detail": "Disconnected"}
