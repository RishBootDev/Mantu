import hashlib
import hmac
import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.clients.mantu import MantuClient, MantuError
from app.core.config import Settings
from app.core.errors import AppError
from app.models import (
    CANCELLED,
    FAILED_STATES,
    PAID,
    PENDING_PAYMENT,
    CatalogProduct,
    MerchantOrder,
    PaymentAttempt,
)
from app.schemas import CreateCheckoutOrderRequest, InitiatePaymentRequest, VerifyPaymentRequest
from app.services.payment_state import SUCCESS_STATES, apply_payment_state, fail_attempt

logger = logging.getLogger("merchant.checkout")

MAX_QTY_PER_PRODUCT = 10


                                                                            
def to_app_error(exc: MantuError) -> AppError:
    if exc.kind == "config":
                                                                                            
        logger.error("Mantu configuration error: %s", exc.detail)
        return AppError(503, "payments_unavailable", "Payments are temporarily unavailable. Please contact the store.")
    if exc.kind == "rate_limited":
        return AppError(
            503, "busy", "We're a bit busy right now. Please try again in a moment.", retry_after=exc.retry_after
        )
    if exc.kind == "client_error":
        return AppError(422, "request_rejected", "We couldn't process that request. Check your details and try again.")
    return AppError(502, "gateway_unreachable", "We couldn't reach the payment service. Please try again shortly.")


                                                                             
def get_owned_order(db: Session, session_id: str, order_id: str) -> MerchantOrder:
    order = db.scalar(
        select(MerchantOrder).where(MerchantOrder.id == order_id, MerchantOrder.session_id == session_id)
    )
    if order is None:                                                    
        raise AppError(404, "order_not_found", "Order not found.")
    return order


def list_orders(db: Session, session_id: str) -> list[MerchantOrder]:
    stmt = (
        select(MerchantOrder)
        .where(MerchantOrder.session_id == session_id, MerchantOrder.mantu_order_id.is_not(None))
        .order_by(MerchantOrder.created_at.desc())
        .limit(50)
    )
    return list(db.scalars(stmt))


def _active_attempt(order: MerchantOrder) -> PaymentAttempt | None:
    for a in reversed(order.attempts):
        if a.status not in FAILED_STATES:
            return a
    return None


                                                                            
async def create_checkout_order(
    db: Session, mantu: MantuClient, session_id: str, req: CreateCheckoutOrderRequest
) -> MerchantOrder:
    problems = req.field_problems()
    if problems:
        raise AppError(422, "validation_error", "Please check the highlighted fields.", field_errors=problems)

    wanted: dict[str, int] = {}
    for item in req.items:
        wanted[item.product_id] = wanted.get(item.product_id, 0) + item.quantity
    if any(q > MAX_QTY_PER_PRODUCT for q in wanted.values()):
        raise AppError(400, "quantity_too_large", f"You can order up to {MAX_QTY_PER_PRODUCT} of each item.")

    products = {
        p.id: p
        for p in db.scalars(
            select(CatalogProduct).where(CatalogProduct.id.in_(list(wanted)), CatalogProduct.active.is_(True))
        )
    }
    if len(products) != len(wanted):
        raise AppError(400, "unknown_product", "One or more items are no longer available.")
    if len({p.currency for p in products.values()}) != 1:
        raise AppError(400, "mixed_currency", "Items in one order must share a currency.")

                                                  
    items = [
        {
            "product_id": pid,
            "name": products[pid].name,
            "quantity": qty,
            "unit_amount_units": products[pid].price_amount_units,
        }
        for pid, qty in wanted.items()
    ]
    total = sum(i["quantity"] * i["unit_amount_units"] for i in items)
    if total <= 0:
        raise AppError(400, "invalid_total", "The order total is invalid.")
    currency = next(iter(products.values())).currency

    order = MerchantOrder(
        session_id=session_id,
        receipt=f"merchant-order-{uuid.uuid4().hex[:10]}",
        order_idempotency_key=str(uuid.uuid4()),
        amount_units=total,
        currency=currency,
        status=PENDING_PAYMENT,
        items_json=items,
        customer_name=req.customer_name,
        customer_email=str(req.customer_email) if req.customer_email else None,
        customer_phone=req.customer_phone,
        customer_address=req.customer_address.strip() if req.customer_address else None,
        customer_country=req.customer_country.strip().upper() if req.customer_country else None,
    )
    db.add(order)
    db.commit()                                                                

    customer = {
        k: v
        for k, v in {
            "name": order.customer_name,
            "email": order.customer_email,
            "phone": order.customer_phone,
            "country": order.customer_country,
        }.items()
        if v
    }
    try:
        mantu_order = await mantu.create_order(
            amount_units=order.amount_units,
            currency=order.currency,
            receipt=order.receipt,
            customer=customer or None,
            idempotency_key=order.order_idempotency_key,
        )
    except MantuError as exc:
        logger.warning("Mantu order creation failed for local order %s: %s", order.id, exc)
        order.status = CANCELLED
        db.commit()
        raise to_app_error(exc) from exc

    order.mantu_order_id = mantu_order.id
    db.commit()
    logger.info("Created order local=%s mantu=%s amount=%s", order.id, order.mantu_order_id, order.amount_units)
    return order


                                                                            
async def initiate_payment(
    db: Session,
    mantu: MantuClient,
    settings: Settings,
    session_id: str,
    order_id: str,
    req: InitiatePaymentRequest,
) -> MerchantOrder:
    problems = req.field_problems()
    if problems:
        raise AppError(422, "validation_error", "Please check the highlighted fields.", field_errors=problems)

    order = get_owned_order(db, session_id, order_id)
    if order.status == PAID:
        raise AppError(409, "already_paid", "This order has already been paid.")
    if order.status == CANCELLED or not order.mantu_order_id:
        raise AppError(409, "order_unavailable", "This order can no longer be paid. Please start a new checkout.")

    attempt = _active_attempt(order)
    if attempt is not None:
        age = (datetime.now(timezone.utc) - _aware(attempt.updated_at)).total_seconds()
        if attempt.mantu_payment_id or age < settings.pending_attempt_retry_after_seconds:
                                                                                          
            return order
        logger.info("Retrying stale attempt %s with its original idempotency key", attempt.id)
    else:
        attempt = PaymentAttempt(method=req.method, status="INITIATING", idempotency_key=str(uuid.uuid4()))
        order.attempts.append(attempt)
        order.status = PENDING_PAYMENT
        try:
            db.commit()                                                        
        except IntegrityError:
            db.rollback()
            db.refresh(order)
            return order                                       

                                                                       
    try:
        method_details = await _method_details(mantu, req, order)
    except MantuError as exc:
        message = (
            "Card details could not be verified. Check them and try again."
            if exc.kind == "client_error"
            else "We couldn't process your payment right now. Please try again."
        )
        fail_attempt(order, attempt, f"TOKENIZE_{exc.kind.upper()}", message)
        db.commit()
        err = to_app_error(exc)
        raise AppError(err.status_code, err.code, message if exc.kind == "client_error" else err.message,
                       retry_after=err.retry_after) from exc

    try:
        payment = await mantu.create_payment(
            order_id=order.mantu_order_id,
            method=req.method,
            method_details=method_details,
            idempotency_key=attempt.idempotency_key,
        )
    except MantuError as exc:
        if exc.ambiguous:
                                                                                             
                                                                   
            logger.warning("Payment outcome unknown for attempt %s: %s", attempt.id, exc)
            return order
        fail_attempt(order, attempt, f"GATEWAY_{exc.kind.upper()}", "Payment could not be completed. Try another method.")
        db.commit()
        if exc.kind == "client_error":
            return order                                                               
        raise to_app_error(exc) from exc

    db.refresh(attempt)                                                    
    attempt.mantu_payment_id = payment.id
    apply_payment_state(
        order,
        attempt,
        status=payment.status,
        route_id=payment.selected_route_id,
        error_code=payment.error_code,
        error_description=payment.error_description,
        amount_units=payment.amount.amount_units if payment.amount else None,
        currency=payment.amount.currency if payment.amount else None,
    )
    db.commit()
    logger.info("Payment attempt=%s mantu_payment=%s status=%s", attempt.id, payment.id, attempt.status)

    if attempt.status == "AUTHORIZED" and settings.merchant_auto_capture:
        await _capture(db, mantu, order, attempt, raise_errors=False)
    return order


async def _method_details(mantu: MantuClient, req: InitiatePaymentRequest, order: MerchantOrder) -> dict:
    if req.method == "UPI":
        details: dict = {"vpa": (req.vpa or "").strip()}
    elif req.method == "NETBANKING":
        details = {"bank": req.bank}
    else:
        assert req.pan and req.cvv and req.expiry_month and req.expiry_year and req.card_holder_name
        token = await mantu.tokenize_card(
            pan=req.pan.get_secret_value().replace(" ", "").replace("-", ""),
            cvv=req.cvv.get_secret_value(),
            expiry_month=req.expiry_month,
            expiry_year=req.expiry_year,
            card_holder_name=req.card_holder_name.strip(),
        )
        details = {"token": token}

    if req.device_id and req.device_id.strip():
        details["device_id"] = req.device_id.strip()
    if req.ip_country and req.ip_country.strip():
        details["ip_country"] = req.ip_country.strip().upper()
    billing_country = req.billing_country or order.customer_country
    if billing_country and billing_country.strip():
        details["billing_country"] = billing_country.strip().upper()
    if order.customer_email and "@" in order.customer_email:
        details["email_domain"] = order.customer_email.split("@", 1)[1].strip().lower()
    return details


                                                                            
async def capture_payment(
    db: Session, mantu: MantuClient, session_id: str, payment_id: str
) -> MerchantOrder:
    attempt = db.get(PaymentAttempt, payment_id)
    if attempt is None:
        raise AppError(404, "payment_not_found", "Payment not found.")
    order = get_owned_order(db, session_id, attempt.merchant_order_id)

    if attempt.status in SUCCESS_STATES:
        return order                                
    if attempt.status != "AUTHORIZED" or not attempt.mantu_payment_id:
        raise AppError(409, "not_capturable", "This payment can't be captured right now.")
    await _capture(db, mantu, order, attempt, raise_errors=True)
    return order


async def _capture(
    db: Session, mantu: MantuClient, order: MerchantOrder, attempt: PaymentAttempt, *, raise_errors: bool
) -> None:
    try:
        payment = await mantu.capture_payment(attempt.mantu_payment_id)                          
    except MantuError as exc:
        logger.warning("Capture failed for attempt %s: %s", attempt.id, exc)
        if raise_errors:
            raise to_app_error(exc) from exc
        return                                                               
    db.refresh(attempt)
    apply_payment_state(
        order,
        attempt,
        status=payment.status,
        route_id=payment.selected_route_id,
        error_code=payment.error_code,
        error_description=payment.error_description,
        amount_units=payment.amount.amount_units if payment.amount else None,
        currency=payment.amount.currency if payment.amount else None,
    )
    db.commit()


                                                                           
async def verify_payment(
    db: Session,
    mantu: MantuClient,
    settings: Settings,
    session_id: str,
    order_id: str,
    body: VerifyPaymentRequest,
) -> MerchantOrder:
    payment_id = body.payment_id
    mantu_order_id = body.order_id
    signature = body.signature

    if not payment_id or not mantu_order_id or not signature:
        raise AppError(422, "validation_error", "Missing required payment verification details.")

    order = get_owned_order(db, session_id, order_id)
    if order.status == PAID:
        return order
    if order.status == CANCELLED or not order.mantu_order_id:
        raise AppError(409, "order_unavailable", "This order can no longer be paid.")

                                      
    if order.mantu_order_id != mantu_order_id:
        logger.warning("Order mismatch: local expected mantu_order_id=%s, got %s", order.mantu_order_id, mantu_order_id)
        raise AppError(400, "order_mismatch", "Order ID does not match.")

                                                                                
    secret = settings.mantu_key_secret.get_secret_value().strip()
    if secret:
        payload = f"{mantu_order_id}|{payment_id}".encode("utf-8")
        expected_sig = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected_sig.lower(), signature.strip().lower()):
            logger.warning("Signature mismatch for order %s: expected %s, got %s", order.id, expected_sig, signature)
            raise AppError(400, "invalid_signature", "Payment signature verification failed.")

                                               
    attempt = _active_attempt(order)
    if attempt is None:
        attempt = PaymentAttempt(
            method="CHECKOUT",
            status="CAPTURED",
            mantu_payment_id=payment_id,
            active_slot=None,
        )
        order.attempts.append(attempt)
    else:
        attempt.mantu_payment_id = payment_id
        attempt.status = "CAPTURED"
        attempt.active_slot = None

    order.status = PAID
    db.commit()
    logger.info("Payment verified and captured: local_order=%s mantu_order=%s payment=%s", order.id, mantu_order_id, payment_id)
    return order


async def refresh_order_status(
    db: Session,
    mantu: MantuClient,
    settings: Settings,
    order: MerchantOrder,
) -> MerchantOrder:
    if order.status != PENDING_PAYMENT:
        return order
    attempt = order.latest_attempt
    if not attempt or not attempt.mantu_payment_id:
        return order
    if attempt.status not in ("INITIATING", "AUTHORIZING", "AUTHORIZED", "CAPTURING"):
        return order

    try:
        payment = await mantu.get_payment(attempt.mantu_payment_id)
    except Exception as exc:
        logger.debug("Payment status poll skipped for %s: %s", attempt.mantu_payment_id, exc)
        return order

    if payment.status != attempt.status:
        apply_payment_state(
            order,
            attempt,
            status=payment.status,
            route_id=payment.selected_route_id,
            error_code=payment.error_code,
            error_description=payment.error_description,
            amount_units=payment.amount.amount_units if payment.amount else None,
            currency=payment.amount.currency if payment.amount else None,
        )
        db.commit()
        if attempt.status == "AUTHORIZED" and settings.merchant_auto_capture:
            await _capture(db, mantu, order, attempt, raise_errors=False)

    return order


def _aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
