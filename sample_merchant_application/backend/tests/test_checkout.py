CUSTOMER = {"customer_name": "Asha Sharma", "customer_email": "asha@example.com", "customer_phone": "+919876543210"}


def make_order(client):
    r = client.post(
        "/api/checkout/orders",
                                                                             
        json={"items": [{"product_id": "mug", "quantity": 2, "price": 1}, {"product_id": "headphones", "quantity": 1}], **CUSTOMER},
    )
    assert r.status_code == 201, r.text
    return r.json()


def test_catalog_has_server_prices(client):
    prices = {p["id"]: p["price_amount_units"] for p in client.get("/api/catalog").json()}
    assert prices == {"headphones": 299900, "keyboard": 449900, "mug": 49900}


def test_total_is_computed_by_server(client, fake):
    order = make_order(client)
    assert order["amount_units"] == 2 * 49900 + 299900
    assert fake.last_order_amount == order["amount_units"]
    assert order["status"] == "PENDING_PAYMENT"


def test_unknown_product_rejected(client):
    r = client.post("/api/checkout/orders", json={"items": [{"product_id": "nope", "quantity": 1}]})
    assert r.status_code == 400


def test_duplicate_pay_creates_single_attempt(client, fake):
    order = make_order(client)
    body = {"method": "UPI", "vpa": "asha@upi"}
    a = client.post(f"/api/checkout/orders/{order['id']}/pay", json=body)
    b = client.post(f"/api/checkout/orders/{order['id']}/pay", json=body)
    assert a.status_code == b.status_code == 200
    assert len(fake.payment_calls) == 1
    assert a.json()["latest_payment"]["id"] == b.json()["latest_payment"]["id"]


def test_other_session_cannot_see_or_pay_order(client):
    order = make_order(client)
    client.cookies.clear()                        
    assert client.get(f"/api/orders/{order['id']}").status_code == 404
    assert client.post(f"/api/checkout/orders/{order['id']}/pay", json={"method": "UPI", "vpa": "x@upi"}).status_code == 404


def test_method_fields_are_enforced(client):
    order = make_order(client)
    r = client.post(f"/api/checkout/orders/{order['id']}/pay", json={"method": "UPI", "bank": "HDFC"})
    assert r.status_code == 422
    fields = {e["field"] for e in r.json()["field_errors"]}
    assert {"vpa", "bank"} <= fields


def test_card_data_is_never_echoed_in_errors(client):
    order = make_order(client)
    r = client.post(
        f"/api/checkout/orders/{order['id']}/pay",
        json={"method": "CARD", "pan": "4111111111111111", "cvv": "12", "expiry_month": "bad", "expiry_year": 2035, "card_holder_name": "A"},
    )
    assert r.status_code == 422
    assert "4111111111111111" not in r.text


def test_card_payment_uses_vault_token(client, fake):
    order = make_order(client)
    r = client.post(
        f"/api/checkout/orders/{order['id']}/pay",
        json={"method": "CARD", "pan": "4111111111111111", "cvv": "123", "expiry_month": 12, "expiry_year": 2035, "card_holder_name": "Asha"},
    )
    assert r.status_code == 200
    assert fake.payment_calls[0]["details"] == {"token": "vault_tok_123"}
    assert "4111" not in r.text


def test_verify_payment_success(client):
    import hashlib
    import hmac
    import os
    order = make_order(client)
    payment_id = "pay_test_12345"
    mantu_order_id = order["mantu_order_id"]
    sig = hmac.new(os.environ["MANTU_KEY_SECRET"].encode(), f"{mantu_order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()

    r = client.post(
        f"/api/checkout/orders/{order['id']}/verify",
        json={
            "mantu_payment_id": payment_id,
            "mantu_order_id": mantu_order_id,
            "mantu_signature": sig,
        },
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["status"] == "PAID"
    assert data["latest_payment"]["mantu_payment_id"] == payment_id
    assert data["latest_payment"]["status"] == "CAPTURED"


def test_verify_payment_invalid_signature_rejected(client):
    order = make_order(client)
    r = client.post(
        f"/api/checkout/orders/{order['id']}/verify",
        json={
            "mantu_payment_id": "pay_test_fake",
            "mantu_order_id": order["mantu_order_id"],
            "mantu_signature": "invalid_sig_abc123",
        },
    )
    assert r.status_code == 400
    assert r.json()["code"] == "invalid_signature"

