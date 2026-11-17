from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any


FEATURE_NAMES = (
    "amount_log",
    "hour_sin",
    "hour_cos",
    "velocity_log",
    "attempts_log",
    "has_email",
    "has_device",
    "has_ip_country",
    "has_card_token",
    "country_mismatch",
)


def hour_components(occurred_at: datetime | None) -> tuple[float, float]:
    if occurred_at is None:
        hour = 12.0
    else:
        if occurred_at.tzinfo is None:
            occurred_at = occurred_at.replace(tzinfo=timezone.utc)
        hour = occurred_at.astimezone(timezone.utc).hour + occurred_at.minute / 60
    radians = 2 * math.pi * hour / 24
    return math.sin(radians), math.cos(radians)


def build_fraud_features(transaction: dict[str, Any]) -> dict[str, float]:
    amount = float(transaction["amount"])
    hour_sin, hour_cos = hour_components(transaction.get("occurred_at"))
    ip_country = transaction.get("ip_country")
    billing_country = transaction.get("billing_country")

    return {
        "amount_log": math.log1p(amount),
        "hour_sin": hour_sin,
        "hour_cos": hour_cos,
        "velocity_log": math.log1p(int(transaction.get("transactions_last_10m") or 0)),
        "attempts_log": math.log1p(int(transaction.get("order_attempts") or 0)),
        "has_email": float(bool(transaction.get("email_domain"))),
        "has_device": float(bool(transaction.get("device_id"))),
        "has_ip_country": float(bool(ip_country)),
        "has_card_token": float(bool(transaction.get("card_token_id"))),
        "country_mismatch": float(bool(ip_country and billing_country and ip_country != billing_country)),
    }


def feature_vector(features: dict[str, float]) -> list[float]:
    return [float(features[name]) for name in FEATURE_NAMES]
