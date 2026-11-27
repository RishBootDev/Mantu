import json

from sqlalchemy import func, select

from app.database import SessionLocal
from app.models import ProcessedWebhookEvent
from tests.conftest import sign
from tests.test_checkout import make_order


def start_payment(client):
    order = make_order(client)
    r = client.post(f"/api/checkout/orders/{order['id']}/pay", json={"method": "UPI", "vpa": "asha@upi"})
    return order, r.json()["latest_payment"]


def event(order, payment, status, amount=None):
    return json.dumps(
        {
            "event": "payment.updated",
            "payload": {
                "orderId": order["mantu_order_id"],
                "paymentId": payment["mantu_payment_id"],
                "paymentStatus": status,
                "amountUnits": amount if amount is not None else order["amount_units"],
                "amountCurrency": "INR",
                "paymentMethod": "UPI",
            },
        }
    ).encode()


def post(client, body, sig=None):
    headers = {"Content-Type": "application/json"}
    if sig is not None:
        headers["X-Mantu-Signature"] = sig
    return client.post("/api/webhooks/mantu", content=body, headers=headers)


def event_count():
    with SessionLocal() as db:
        return db.scalar(select(func.count()).select_from(ProcessedWebhookEvent))


def test_missing_signature_is_401(client):
    assert post(client, b"{}").status_code == 401


def test_tampered_body_is_401_and_changes_nothing(client):
    order, pay = start_payment(client)
    body = event(order, pay, "CAPTURED")
    assert post(client, body.replace(b"CAPTURED", b"CAPTURED "), sign(body)).status_code == 401
    assert client.get(f"/api/orders/{order['id']}").json()["status"] == "PENDING_PAYMENT"


def test_captured_webhook_marks_order_paid(client):
    order, pay = start_payment(client)
    body = event(order, pay, "CAPTURED")
    r = post(client, body, sign(body))
    assert r.status_code == 204 and r.content == b""
    got = client.get(f"/api/orders/{order['id']}").json()
    assert got["status"] == "PAID"
    assert got["latest_payment"]["status"] == "CAPTURED"


def test_replay_is_acknowledged_once(client):
    order, pay = start_payment(client)
    body = event(order, pay, "CAPTURED")
    before = event_count()
    assert post(client, body, sign(body)).status_code == 204
    assert post(client, body, sign(body)).status_code == 204
    assert event_count() == before + 1


def test_late_authorizing_cannot_regress_a_captured_payment(client):
    order, pay = start_payment(client)
    cap = event(order, pay, "CAPTURED")
    late = event(order, pay, "AUTHORIZING")
    post(client, cap, sign(cap))
    assert post(client, late, sign(late)).status_code == 204
    assert client.get(f"/api/orders/{order['id']}").json()["latest_payment"]["status"] == "CAPTURED"


def test_amount_mismatch_never_marks_paid(client):
    order, pay = start_payment(client)
    body = event(order, pay, "CAPTURED", amount=1)
    assert post(client, body, sign(body)).status_code == 204
    assert client.get(f"/api/orders/{order['id']}").json()["status"] == "PENDING_PAYMENT"


def test_failed_webhook_allows_new_attempt(client, fake):
    order, pay = start_payment(client)
    body = event(order, pay, "FAILED")
    post(client, body, sign(body))
    got = client.get(f"/api/orders/{order['id']}").json()
    assert got["status"] == "PAYMENT_FAILED"
    assert got["latest_payment"]["error_description"] == "Payment could not be completed. Try another method."
    r = client.post(f"/api/checkout/orders/{order['id']}/pay", json={"method": "UPI", "vpa": "asha@upi"})
    assert r.status_code == 200
    assert len(fake.payment_calls) == 2
    assert fake.payment_calls[0]["key"] != fake.payment_calls[1]["key"]
