import hashlib
import hmac
import json
import logging

from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response
from pydantic import BaseModel, ConfigDict, Field, ValidationError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_app_settings, get_db
from app.core.config import Settings
from app.models import MerchantOrder, PaymentAttempt, ProcessedWebhookEvent
from app.services.payment_state import apply_payment_state

logger = logging.getLogger("merchant.webhooks")
router = APIRouter(tags=["webhooks"])


class WebhookPayload(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)
    order_id: str = Field(alias="orderId", min_length=1)
    payment_id: str = Field(alias="paymentId", min_length=1)
    merchant_id: str | None = Field(default=None, alias="merchantId")
    payment_status: str = Field(alias="paymentStatus", min_length=1)
    amount_units: int | None = Field(default=None, alias="amountUnits")
    amount_currency: str | None = Field(default=None, alias="amountCurrency")
    payment_method: str | None = Field(default=None, alias="paymentMethod")
    selected_route_id: str | None = Field(default=None, alias="selectedRouteId")
    error_code: str | None = Field(default=None, alias="errorCode")


class WebhookEnvelope(BaseModel):
    model_config = ConfigDict(extra="ignore")
    event: str = Field(min_length=1, max_length=100)
    payload: WebhookPayload


@router.post("/api/webhooks/mantu", status_code=204, response_class=Response)
async def receive_mantu_webhook(
    request: Request,
    x_mantu_signature: str | None = Header(default=None),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_app_settings),
) -> Response:
    raw_body = await request.body()

    if not x_mantu_signature:
        raise HTTPException(status_code=401, detail="Missing webhook signature")

    secret = settings.mantu_webhook_secret.get_secret_value()
    if not secret:
        logger.error("Webhook received but MANTU_WEBHOOK_SECRET is not configured")
        raise HTTPException(status_code=503, detail="Webhook receiver not configured")

    expected = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, x_mantu_signature.strip().lower()):
        logger.warning("Rejected webhook with invalid signature (body %d bytes)", len(raw_body))
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        envelope = WebhookEnvelope.model_validate_json(raw_body)
    except ValidationError:
        logger.warning("Rejected signed webhook with invalid envelope")
        raise HTTPException(status_code=400, detail="Invalid webhook payload") from None
    p = envelope.payload

    event_id = hashlib.sha256(raw_body).hexdigest()
    if db.scalar(select(ProcessedWebhookEvent.id).where(ProcessedWebhookEvent.event_id == event_id)):
        return Response(status_code=204)

    canonical = json.dumps(p.model_dump(by_alias=True), sort_keys=True, separators=(",", ":"))
    payload_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    note: str | None = None
    order = db.scalar(select(MerchantOrder).where(MerchantOrder.mantu_order_id == p.order_id))
    if order is None:
        note = "no matching local order"
        logger.warning("Webhook for unknown Mantu order %s (payment %s)", p.order_id, p.payment_id)
    else:
        attempt = db.scalar(select(PaymentAttempt).where(PaymentAttempt.mantu_payment_id == p.payment_id))
        if attempt is None:
                                                                                                            
            attempt = next((a for a in order.attempts if a.mantu_payment_id is None and a.status == "INITIATING"), None)
            if attempt is None:

                raise HTTPException(status_code=503, detail="Payment not yet known, retry later")
            attempt.mantu_payment_id = p.payment_id
        if attempt.merchant_order_id != order.id:
            note = "payment belongs to a different order"
        else:
            changed = apply_payment_state(
                order,
                attempt,
                status=p.payment_status,
                route_id=p.selected_route_id,
                error_code=p.error_code,
                amount_units=p.amount_units,
                currency=p.amount_currency,
            )
            note = None if changed else "ignored (stale, unknown status or amount mismatch)"
        logger.info("Webhook %s payment=%s status=%s applied=%s", envelope.event, p.payment_id, p.payment_status, note is None)

    db.add(
        ProcessedWebhookEvent(
            event_id=event_id, event_type=envelope.event, payload_hash=payload_hash, note=note
        )
    )
    try:
        db.commit()
    except IntegrityError:
        db.rollback()

    return Response(status_code=204)
