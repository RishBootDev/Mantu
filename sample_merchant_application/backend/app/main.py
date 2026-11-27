import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import checkout, orders, webhooks
from app.clients.mantu import MantuClient
from app.core.config import get_settings
from app.core.context import request_id_var
from app.core.errors import AppError
from app.database import Base, SessionLocal, engine
from app.services.catalog import seed_catalog

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("merchant.app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    Base.metadata.create_all(engine)
    from sqlalchemy import text
    with engine.begin() as conn:
        if engine.dialect.name == "postgresql":
            conn.execute(text("ALTER TABLE merchant_order ADD COLUMN IF NOT EXISTS customer_address VARCHAR(400)"))
            conn.execute(text("ALTER TABLE merchant_order ADD COLUMN IF NOT EXISTS customer_country VARCHAR(3)"))
        else:
            for ddl in (
                "ALTER TABLE merchant_order ADD COLUMN customer_address VARCHAR(400)",
                "ALTER TABLE merchant_order ADD COLUMN customer_country VARCHAR(3)",
            ):
                try:
                    conn.execute(text(ddl))
                except Exception:
                    pass
    with SessionLocal() as db:
        seed_catalog(db)
    if not settings.mantu_configured:
        logger.warning("MANTU_KEY_ID / MANTU_KEY_SECRET are not set: catalog works, payments will fail.")
    if not settings.mantu_webhook_secret.get_secret_value():
        logger.warning("MANTU_WEBHOOK_SECRET is not set: webhooks will be rejected.")
    app.state.mantu = MantuClient(settings)
    yield
    await app.state.mantu.aclose()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Sample Merchant Checkout API", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.merchant_app_origin],
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )

    @app.middleware("http")
    async def correlation_id(request: Request, call_next):
        rid = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        token = request_id_var.set(rid[:64])
        try:
            response = await call_next(request)
        finally:
            request_id_var.reset(token)
        response.headers["X-Request-ID"] = rid[:64]
        return response

    @app.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError):
        headers = {"Retry-After": str(exc.retry_after)} if exc.retry_after else None
        return JSONResponse(
            status_code=exc.status_code,
            content={"code": exc.code, "message": exc.message, "field_errors": exc.field_errors},
            headers=headers,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_handler(_: Request, exc: RequestValidationError):
        errors = []
        for err in exc.errors():
            loc = [str(x) for x in err.get("loc", ()) if x != "body"]
            msg = str(err.get("msg", "Invalid value")).removeprefix("Value error, ")
            errors.append({"field": ".".join(loc) or "body", "message": msg})
        return JSONResponse(
            status_code=422,
            content={"code": "validation_error", "message": "Please check the highlighted fields.", "field_errors": errors},
        )

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    app.include_router(checkout.router)
    app.include_router(orders.router)
    app.include_router(webhooks.router)
    return app


app = create_app()
