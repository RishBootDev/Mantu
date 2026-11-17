from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_fraud_prediction_contract() -> None:
    response = client.post(
        "/api/v1/fraud/predict",
        json={
            "transaction_id": "txn_test",
            "merchant_id": "merchant_test",
            "amount": 100.0,
            "currency": "INR",
            "payment_method": "UPI",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["transaction_id"] == "txn_test"
    assert 0 <= payload["fraud_probability"] <= 1
    assert payload["risk_level"] in {"LOW", "MEDIUM", "HIGH", "UNAVAILABLE"}


def test_routing_recommendation_scaffold() -> None:
    response = client.post(
        "/api/v1/routing/recommend",
        json={
            "transaction_id": "txn_test",
            "amount": 100.0,
            "currency": "INR",
            "payment_method": "UPI",
            "eligible_routes": [
                {"route_id": "route_a", "gateway": "gateway_a", "health_score": 0.9},
                {"route_id": "route_b", "gateway": "gateway_b", "health_score": 0.95},
            ],
        },
    )
    assert response.status_code == 200
    assert response.json()["recommended_route_id"] == "route_b"
