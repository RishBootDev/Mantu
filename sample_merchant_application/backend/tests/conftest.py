import os
import tempfile

                                                                   
_tmp = tempfile.mkdtemp()
os.environ["MERCHANT_APP_DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["MANTU_BASE_URL"] = "http://localhost:8080"
os.environ["MERCHANT_APP_ORIGIN"] = "http://localhost:5173"
os.environ["MANTU_KEY_ID"] = "mantu_test_key"
os.environ["MANTU_KEY_SECRET"] = "test_secret_value"
os.environ["MANTU_WEBHOOK_SECRET"] = "whsec_test"

import hashlib              
import hmac              
import itertools              

import pytest              
from fastapi.testclient import TestClient              

from app.api.deps import get_mantu              
from app.clients.mantu import MantuOrder, MantuPayment              
from app.main import app              

WEBHOOK_SECRET = "whsec_test"


class FakeMantu:
    def __init__(self) -> None:
        self._ids = itertools.count(1)
        self.payment_calls: list[dict] = []
        self.next_payment_status = "AUTHORIZING"

    async def create_order(self, *, amount_units, currency, receipt, customer, idempotency_key):
        self.last_order_amount = amount_units
        return MantuOrder(id=f"mantu_order_{next(self._ids)}")

    async def tokenize_card(self, **kwargs):
        return "vault_tok_123"

    async def create_payment(self, *, order_id, method, method_details, idempotency_key):
        self.payment_calls.append({"order_id": order_id, "key": idempotency_key, "details": method_details})
        return MantuPayment.model_validate(
            {
                "id": f"mantu_pay_{len(self.payment_calls)}",
                "orderId": order_id,
                "status": self.next_payment_status,
                "method": method,
                "amount": {"amountUnits": self.last_order_amount, "currency": "INR"},
                "selectedRouteId": "upi_gateway_a",
            }
        )

    async def capture_payment(self, payment_id):
        raise AssertionError("not used")


@pytest.fixture()
def fake():
    return FakeMantu()


@pytest.fixture()
def client(fake):
    app.dependency_overrides[get_mantu] = lambda: fake
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def sign(body: bytes) -> str:
    return hmac.new(WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
