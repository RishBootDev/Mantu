from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any

import pandas as pd

NUMERIC_FEATURE_COLUMNS = (
    "amount_log",
    "order_attempts",
    "hour_sin",
    "hour_cos",
    "health_score",
    "route_success_rate_5m",
    "route_success_rate_1h",
    "route_error_rate_5m",
    "route_p95_latency_ms",
    "route_fee_bps",
    "route_capacity_score",
)
CATEGORICAL_FEATURE_COLUMNS = (
    "payment_method",
    "currency",
    "route_id",
    "gateway",
    "issuer_group",
    "card_network",
)
FEATURE_COLUMNS = NUMERIC_FEATURE_COLUMNS + CATEGORICAL_FEATURE_COLUMNS


def _hour_parts(occurred_at: datetime | None) -> tuple[float, float]:
    if occurred_at is None:
        hour = 12.0
    else:
        if occurred_at.tzinfo is None:
            occurred_at = occurred_at.replace(tzinfo=timezone.utc)
        utc_time = occurred_at.astimezone(timezone.utc)
        hour = utc_time.hour + utc_time.minute / 60
    radians = 2 * math.pi * hour / 24
    return math.sin(radians), math.cos(radians)


def build_route_feature_row(transaction: dict[str, Any], route: dict[str, Any]) -> dict[str, Any]:

    hour_sin, hour_cos = _hour_parts(transaction.get("occurred_at"))
    return {
        "amount_log": math.log1p(float(transaction["amount"])),
        "order_attempts": int(transaction.get("order_attempts") or 0),
        "hour_sin": hour_sin,
        "hour_cos": hour_cos,
        "health_score": float(route["health_score"]),
        "route_success_rate_5m": float(route["route_success_rate_5m"]),
        "route_success_rate_1h": float(route["route_success_rate_1h"]),
        "route_error_rate_5m": float(route["route_error_rate_5m"]),
        "route_p95_latency_ms": int(route["route_p95_latency_ms"]),
        "route_fee_bps": int(route["route_fee_bps"]),
        "route_capacity_score": float(route["route_capacity_score"]),
        "payment_method": str(transaction["payment_method"]).upper(),
        "currency": str(transaction["currency"]).upper(),
        "route_id": str(route["route_id"]),
        "gateway": str(route["gateway"]),
        "issuer_group": str(transaction.get("issuer_group") or "UNKNOWN").upper(),
        "card_network": str(transaction.get("card_network") or "UNKNOWN").upper(),
    }


def build_training_features(frame: pd.DataFrame) -> pd.DataFrame:

    result = pd.DataFrame(index=frame.index)
    times = pd.to_datetime(frame["occurred_at"], utc=True)
    hour = times.dt.hour + times.dt.minute / 60
    result["amount_log"] = frame["amount"].clip(lower=0).map(math.log1p)
    result["order_attempts"] = frame["order_attempts"].fillna(0).clip(lower=0).astype(int)
    result["hour_sin"] = (2 * math.pi * hour / 24).map(math.sin)
    result["hour_cos"] = (2 * math.pi * hour / 24).map(math.cos)
    for column in NUMERIC_FEATURE_COLUMNS[4:]:
        result[column] = pd.to_numeric(frame[column], errors="coerce").fillna(0)
    for column in CATEGORICAL_FEATURE_COLUMNS:
        source = frame[column] if column in frame else "UNKNOWN"
        result[column] = source.fillna("UNKNOWN").astype(str).str.upper()
    return result.loc[:, FEATURE_COLUMNS]
