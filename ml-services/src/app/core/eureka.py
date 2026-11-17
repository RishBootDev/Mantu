"""Eureka lifecycle management for the FastAPI process."""

from __future__ import annotations

import logging
from typing import Any

from app.core.config import Settings

logger = logging.getLogger(__name__)


class EurekaRegistration:

    def __init__(self) -> None:
        self._client: Any | None = None
        self.error: str | None = None

    @property
    def is_registered(self) -> bool:
        return self._client is not None

    async def start(self, settings: Settings) -> None:
        if not settings.eureka_enabled:
            return
        try:
            from py_eureka_client.eureka_client import EurekaClient

            client_kwargs: dict[str, Any] = {
                "eureka_server": settings.eureka_server_url,
                "app_name": settings.eureka_app_name,
                "instance_port": settings.service_port,
                "should_discover": False,
            }
            if settings.eureka_instance_host:
                client_kwargs["instance_host"] = settings.eureka_instance_host
                client_kwargs["health_check_url"] = (
                    f"http://{settings.eureka_instance_host}:{settings.service_port}/health"
                )
            client = EurekaClient(**client_kwargs)
            await client.start()
            self._client = client
            self.error = None
            logger.info("Registered %s with Eureka", settings.eureka_app_name)
        except Exception as exc:
            self._client = None
            self.error = str(exc)

            logger.warning("Unable to register ML service with Eureka: %s", exc)

    async def stop(self) -> None:
        if self._client is None:
            return
        try:
            await self._client.stop()
        except Exception as exc:
            logger.warning("Unable to cancel Eureka registration: %s", exc)
        finally:
            self._client = None


eureka_registration = EurekaRegistration()
