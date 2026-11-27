import secrets

from fastapi import Request, Response

from app.clients.mantu import MantuClient
from app.core.config import Settings, get_settings
from app.database import get_db                          

SESSION_COOKIE = "mc_session"

__all__ = ["get_db", "get_mantu", "get_session_id", "get_app_settings"]


def get_app_settings() -> Settings:
    return get_settings()


def get_mantu(request: Request) -> MantuClient:
    return request.app.state.mantu


def get_session_id(request: Request, response: Response) -> str:
    sid = request.cookies.get(SESSION_COOKIE)
    if not sid or len(sid) > 64:
        sid = secrets.token_hex(24)
        response.set_cookie(
            SESSION_COOKIE,
            sid,
            httponly=True,
            samesite="lax",
            secure=get_settings().merchant_cookie_secure,
            max_age=60 * 60 * 24 * 30,
        )
    return sid
