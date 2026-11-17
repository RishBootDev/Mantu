from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.eureka import eureka_registration
from app.core.logging import configure_logging
from app.modules.anomaly_detection.api.router import load_anomaly_model, service as anomaly_service
from app.modules.fraud_detection.api.router import load_fraud_model, service as fraud_service
from app.modules.smart_routing.api.router import load_routing_model, service as routing_service


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_logging()
    load_fraud_model()
    load_routing_model()
    load_anomaly_model()
    await eureka_registration.start(settings)
    yield
    await eureka_registration.stop()


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="ML inference APIs and worker capabilities for Mantu.",
    lifespan=lifespan,
)
app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/health", tags=["operations"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/ready", tags=["operations"])
async def readiness() -> dict[str, str]:

    is_ready = fraud_service.is_ready and routing_service.is_ready and anomaly_service.is_ready and (
        not settings.eureka_enabled or eureka_registration.is_registered
    )
    return {"status": "ready" if is_ready else "degraded"}
