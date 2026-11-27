import logging
import socket
from collections.abc import Iterator
from urllib.parse import urlparse

import httpx
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings

logger = logging.getLogger("merchant.db")

class Base(DeclarativeBase):
    pass


def _resolve_via_doh(hostname: str) -> str | None:
    endpoints = (
        ("https://dns.google/resolve", {"name": hostname, "type": "A"}, {}),
        ("https://1.1.1.1/dns-query", {"name": hostname, "type": "A"}, {"Accept": "application/dns-json"}),
    )
    for url, params, headers in endpoints:
        try:
            resp = httpx.get(url, params=params, headers=headers, timeout=5.0)
            if resp.status_code == 200:
                for answer in resp.json().get("Answer", []):
                    if answer.get("type") == 1 and answer.get("data"):
                        return str(answer["data"])
        except Exception as exc:
            logger.debug("DoH lookup failed on %s: %s", url, exc)
    return None


def _pg_connect_args(db_url: str) -> dict:
    host = urlparse(db_url).hostname
    if not host:
        return {}
    try:
        socket.getaddrinfo(host, None)
        return {}
    except socket.gaierror:
        ip = _resolve_via_doh(host)
        if ip:
            logger.info("OS DNS failed for %s; resolved via DoH to %s", host, ip)
            return {"hostaddr": ip}
        logger.warning("OS DNS and DoH both failed to resolve %s", host)
        return {}


_settings = get_settings()
_db_url = _settings.merchant_app_database_url
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif _db_url.startswith("postgresql://") and not _db_url.startswith("postgresql+"):
    _db_url = _db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

if _db_url.startswith("sqlite"):
    _connect_args: dict = {"check_same_thread": False}
elif _db_url.startswith("postgresql"):
    _connect_args = _pg_connect_args(_db_url)
else:
    _connect_args = {}

engine = create_engine(
    _db_url,
    connect_args=_connect_args,
    pool_pre_ping=True,
    pool_recycle=1800,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
