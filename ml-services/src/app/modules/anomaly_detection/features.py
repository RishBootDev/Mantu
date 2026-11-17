from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any

import pandas as pd


FEATURE_COLUMNS = (
    "transaction_count_log",
    "total_amount_log",
    "mean_amount_log",
    "max_amount_log",
    "amount_stddev_log",
    "p95_amount_log",
    "failure_rate",
    "retry_rate",
    "unique_customers_log",
    "unique_routes",
    "payment_method_entropy",
    "mean_latency_log",
    "p95_latency_log",
    "gateway_timeout_rate",
    "issuer_decline_rate",
    "average_route_health_score",
    "average_route_success_rate_5m",
    "average_route_error_rate_5m",
    "transaction_count_vs_baseline",
    "total_amount_vs_baseline",
    "failure_rate_delta",
    "p95_latency_vs_baseline",
    "retry_rate_delta",
    "hour_sin",
    "hour_cos",
)


def _ratio(numerator: float, denominator: float) -> float:
    return float(numerator) / max(float(denominator), 1.0)


def _hour_parts(value: datetime) -> tuple[float, float]:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    value = value.astimezone(timezone.utc)
    hour = value.hour + value.minute / 60
    radians = 2 * math.pi * hour / 24
    return math.sin(radians), math.cos(radians)


def build_anomaly_features(window: dict[str, Any]) -> dict[str, float]:

    transaction_count = int(window["transaction_count"])
    failure_rate = _ratio(window["failure_count"], transaction_count)
    retry_rate = _ratio(window.get("retry_count", 0), transaction_count)
    hour_sin, hour_cos = _hour_parts(window["window_start"])
    return {
        "transaction_count_log": math.log1p(transaction_count),
        "total_amount_log": math.log1p(float(window["total_amount"])),
        "mean_amount_log": math.log1p(float(window["mean_amount"])),
        "max_amount_log": math.log1p(float(window["max_amount"])),
        "amount_stddev_log": math.log1p(float(window.get("amount_stddev", 0))),
        "p95_amount_log": math.log1p(float(window["p95_amount"])),
        "failure_rate": failure_rate,
        "retry_rate": retry_rate,
        "unique_customers_log": math.log1p(int(window.get("unique_customers", 0))),
        "unique_routes": float(window.get("unique_routes", 0)),
        "payment_method_entropy": float(window.get("payment_method_entropy", 0)),
        "mean_latency_log": math.log1p(float(window.get("mean_authorization_latency_ms", 0))),
        "p95_latency_log": math.log1p(float(window.get("p95_authorization_latency_ms", 0))),
        "gateway_timeout_rate": _ratio(window.get("gateway_timeout_count", 0), transaction_count),
        "issuer_decline_rate": _ratio(window.get("issuer_decline_count", 0), transaction_count),
        "average_route_health_score": float(window.get("average_route_health_score", 0)),
        "average_route_success_rate_5m": float(window.get("average_route_success_rate_5m", 0)),
        "average_route_error_rate_5m": float(window.get("average_route_error_rate_5m", 0)),
        "transaction_count_vs_baseline": _ratio(
            transaction_count, window.get("baseline_transaction_count", 0)
        ),
        "total_amount_vs_baseline": _ratio(
            window["total_amount"], window.get("baseline_total_amount", 0)
        ),
        "failure_rate_delta": failure_rate - float(window.get("baseline_failure_rate", 0)),
        "p95_latency_vs_baseline": _ratio(
            window.get("p95_authorization_latency_ms", 0), window.get("baseline_p95_latency_ms", 0)
        ),
        "retry_rate_delta": retry_rate - float(window.get("baseline_retry_rate", 0)),
        "hour_sin": hour_sin,
        "hour_cos": hour_cos,
    }


def feature_frame(windows: pd.DataFrame) -> pd.DataFrame:

    return pd.DataFrame(
        [build_anomaly_features(row) for row in windows.to_dict(orient="records")],
        columns=FEATURE_COLUMNS,
    )
