import logging
import re

from app.models import PAID, PAYMENT_FAILED, MerchantOrder, PaymentAttempt

logger = logging.getLogger("merchant.payment_state")

SUCCESS_STATES = {"CAPTURED", "SETTLED"}
FAILURE_STATES = {"FAILED", "CANCELLED", "AUTH_EXPIRED"}
REFUND_STATES = {"REFUNDED", "PARTIALLY_REFUNDED"}

                                                                                           
RANK = {
    "INITIATING": 0,
    "AUTHORIZING": 1,
    "AUTHORIZED": 2,
    "FAILED": 3,
    "CANCELLED": 3,
    "AUTH_EXPIRED": 3,
    "CAPTURED": 4,
    "SETTLED": 5,
    "PARTIALLY_REFUNDED": 6,
    "REFUNDED": 7,
}

GENERIC_FAILURE = "Payment could not be completed. Try another method."
_INTERNALS = re.compile(
    r"fraud|risk|score|rule|rout|gateway|exception|traceback|stack|internal|policy|velocity|model|block|sql|null",
    re.IGNORECASE,
)
_CODE_OK = re.compile(r"^[A-Za-z0-9_.\-]{1,64}$")


def safe_error_message(code: str | None, description: str | None) -> str:
    text = (description or "").strip()
    if not text or len(text) > 140 or _INTERNALS.search(text) or (code and _INTERNALS.search(code)):
        return GENERIC_FAILURE
    return text


def apply_payment_state(
    order: MerchantOrder,
    attempt: PaymentAttempt,
    *,
    status: str,
    route_id: str | None = None,
    error_code: str | None = None,
    error_description: str | None = None,
    amount_units: int | None = None,
    currency: str | None = None,
) -> bool:
    new_rank = RANK.get(status)
    if new_rank is None:
        logger.warning("Ignoring unknown payment status %r for attempt %s", status, attempt.id)
        return False
    if new_rank < RANK.get(attempt.status, 0):
        logger.info("Ignoring stale status %s (attempt %s is already %s)", status, attempt.id, attempt.status)
        return False

                                                                                               
    if status in SUCCESS_STATES | REFUND_STATES:
        if (amount_units is not None and amount_units != order.amount_units) or (
            currency is not None and currency != order.currency
        ):
            logger.error("Amount mismatch on %s for order %s; not applying %s", attempt.id, order.id, status)
            return False

    attempt.status = status
    if route_id:
        attempt.selected_route_id = route_id[:64]

    if status in FAILURE_STATES:
        attempt.error_code = error_code[:64] if error_code and _CODE_OK.match(error_code) else None
        attempt.error_description = safe_error_message(error_code, error_description)
        attempt.active_slot = None                                                          

    if status in SUCCESS_STATES:
        order.status = PAID
    elif status in REFUND_STATES:
        order.status = PAID
        order.refund_state = status
    elif status in FAILURE_STATES:
        latest = order.latest_attempt
                                                                                            
        if order.status != PAID and latest is not None and latest.id == attempt.id:
            order.status = PAYMENT_FAILED
    return True


def fail_attempt(order: MerchantOrder, attempt: PaymentAttempt, code: str, message: str) -> None:
    attempt.status = "FAILED"
    attempt.error_code = code[:64]
    attempt.error_description = message[:200]
    attempt.active_slot = None
    if order.status != PAID:
        order.status = PAYMENT_FAILED
