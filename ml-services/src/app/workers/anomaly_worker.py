from __future__ import annotations

import asyncio
import json
import math
from collections import defaultdict, deque
from datetime import UTC, datetime, timedelta
from typing import Any

from app.core.config import Settings, get_settings
from app.modules.anomaly_detection.schemas import AnomalyWindowRequest
from app.modules.anomaly_detection.service import AnomalyDetectionService

TERMINAL_EVENTS = {"PAYMENT_CAPTURED", "PAYMENT_FAILED", "PAYMENT_CANCELLED"}


def _timestamp(value: str | datetime) -> datetime:
    if isinstance(value, datetime):
        return value.astimezone(UTC)
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(UTC)


def _window_start(value: datetime, seconds: int) -> datetime:
    epoch = int(value.timestamp())
    return datetime.fromtimestamp(epoch - epoch % seconds, tz=UTC)


def normalize_payment_event(envelope: dict[str, Any], kafka_timestamp_ms: int | None) -> dict[str, Any]:

    event = dict(envelope.get("data", envelope))
    event_type = event.get("event_type") or event.get("eventType")
    if event_type == "PAYMENT_STATUS_CHANGED":
        event_type = None
    if not event_type:
        status = str(event.get("paymentStatus") or "").upper()
        event_type = {
            "CAPTURED": "PAYMENT_CAPTURED",
            "FAILED": "PAYMENT_FAILED",
            "CANCELLED": "PAYMENT_CANCELLED",
        }.get(status)
    event["event_type"] = event_type
    if "merchant_id_hash" not in event and event.get("merchantId"):
        event["merchant_id_hash"] = event["merchantId"]
    if "payment_method" not in event and event.get("paymentMethod"):
        event["payment_method"] = event["paymentMethod"]
    if "selected_route_id" not in event and event.get("selectedRouteId"):
        event["selected_route_id"] = event["selectedRouteId"]
    if "amount" not in event and event.get("amountUnits") is not None:
        event["amount"] = event["amountUnits"]
    if "failure_category" not in event and event.get("errorCode"):
        event["failure_category"] = event["errorCode"]
    if "event_id" not in event and envelope.get("eventId"):
        event["event_id"] = envelope["eventId"]
    if "occurred_at" not in event and envelope.get("occurredAt"):
        event["occurred_at"] = envelope["occurredAt"]
    if "occurred_at" not in event and kafka_timestamp_ms is not None:
        event["occurred_at"] = datetime.fromtimestamp(kafka_timestamp_ms / 1000, tz=UTC).isoformat()
    if "result" not in event:
        event["result"] = "SUCCESS" if event_type == "PAYMENT_CAPTURED" else "FAILURE"
    return event


class MerchantWindow:
    def __init__(self, merchant_id: str, start: datetime, seconds: int) -> None:
        self.merchant_id, self.start = merchant_id, start
        self.end = start + timedelta(seconds=seconds)
        self.count = self.successes = self.failures = self.retries = 0
        self.amounts: list[float] = []
        self.customers: set[str] = set()
        self.routes: set[str] = set()
        self.methods: dict[str, int] = defaultdict(int)
        self.latencies: list[float] = []
        self.timeouts = self.declines = 0
        self.health: list[float] = []
        self.success_rates: list[float] = []
        self.error_rates: list[float] = []

    def add(self, event: dict[str, Any]) -> None:
        self.count += 1
        self.successes += int(event.get("result") == "SUCCESS")
        self.failures += int(event.get("result") == "FAILURE")
        self.amounts.append(float(event.get("amount", 0)))
        self.retries += int(int(event.get("order_attempts") or 0) >= 3)
        if value := event.get("customer_id_hash") or event.get("customerId"):
            self.customers.add(str(value))
        if value := event.get("selected_route_id") or event.get("selectedRouteId"):
            self.routes.add(str(value))
        self.methods[str(event.get("payment_method") or event.get("paymentMethod") or "UNKNOWN")] += 1
        if value := event.get("authorization_latency_ms") or event.get("authorizationLatencyMs"):
            self.latencies.append(float(value))
        self.timeouts += int(event.get("failure_category") == "GATEWAY_TIMEOUT")
        self.declines += int(event.get("failure_category") == "BANK_DECLINED")
        self.health.append(float(event.get("route_health_score", 0)))
        self.success_rates.append(float(event.get("route_success_rate_5m", 0)))
        self.error_rates.append(float(event.get("route_error_rate_5m", 0)))

    @staticmethod
    def _mean(values: list[float]) -> float:
        return sum(values) / len(values) if values else 0.0

    @staticmethod
    def _p95(values: list[float]) -> float:
        if not values:
            return 0.0
        ordered = sorted(values)
        return ordered[min(len(ordered) - 1, math.ceil(len(ordered) * 0.95) - 1)]

    def values(self, baseline: dict[str, float]) -> dict[str, Any]:
        total = sum(self.amounts)
        method_shares = [count / self.count for count in self.methods.values()]
        amount_mean = self._mean(self.amounts)
        return {
            "merchant_id": self.merchant_id,
            "window_start": self.start,
            "window_end": self.end,
            "transaction_count": self.count,
            "success_count": self.successes,
            "failure_count": self.failures,
            "total_amount": total,
            "mean_amount": amount_mean,
            "max_amount": max(self.amounts, default=0.0),
            "amount_stddev": (
                sum((amount - amount_mean) ** 2 for amount in self.amounts) / len(self.amounts)
            ) ** 0.5 if self.amounts else 0.0,
            "p95_amount": self._p95(self.amounts),
            "retry_count": self.retries,
            "unique_customers": len(self.customers),
            "unique_routes": len(self.routes),
            "payment_method_entropy": -sum(share * math.log(share) for share in method_shares if share),
            "mean_authorization_latency_ms": self._mean(self.latencies),
            "p95_authorization_latency_ms": self._p95(self.latencies),
            "gateway_timeout_count": self.timeouts,
            "issuer_decline_count": self.declines,
            "average_route_health_score": self._mean(self.health),
            "average_route_success_rate_5m": self._mean(self.success_rates),
            "average_route_error_rate_5m": self._mean(self.error_rates),
            **baseline,
        }


class RealtimeWindowAggregator:

    def __init__(self, settings: Settings, service: AnomalyDetectionService) -> None:
        self.settings, self.service = settings, service
        self.windows: dict[tuple[str, datetime], MerchantWindow] = {}
        self.history: dict[str, deque[dict[str, float]]] = defaultdict(
            lambda: deque(maxlen=settings.anomaly_baseline_windows)
        )

    def ingest(self, event: dict[str, Any]) -> None:
        event_type = event.get("event_type") or event.get("eventType")
        if event_type not in TERMINAL_EVENTS:
            return
        merchant = event.get("merchant_id_hash") or event.get("merchantId")
        occurred_at = event.get("occurred_at") or event.get("occurredAt")
        if not merchant or not occurred_at:
            raise ValueError("terminal event requires merchant ID and occurred-at timestamp")
        start = _window_start(_timestamp(occurred_at), self.settings.anomaly_window_seconds)
        key = (str(merchant), start)
        self.windows.setdefault(
            key, MerchantWindow(str(merchant), start, self.settings.anomaly_window_seconds)
        ).add(event)

    def flush_closed(self, now: datetime | None = None) -> list[dict[str, Any]]:
        now = now or datetime.now(UTC)
        scores: list[dict[str, Any]] = []
        for key in sorted([key for key, item in self.windows.items() if item.end <= now], key=lambda x: x[1]):
            window = self.windows.pop(key)
            baseline = self._baseline(self.history[window.merchant_id])
            score = self.service.score_window(AnomalyWindowRequest.model_validate(window.values(baseline)))
            self.history[window.merchant_id].append({
                "transaction_count": float(window.count),
                "total_amount": float(sum(window.amounts)),
                "failure_rate": window.failures / max(window.count, 1),
                "p95_latency_ms": window._p95(window.latencies),
                "retry_rate": window.retries / max(window.count, 1),
            })
            scores.append(score.model_dump(mode="json"))
        return scores

    @staticmethod
    def _baseline(history: deque[dict[str, float]]) -> dict[str, float]:
        if not history:
            return {
                "baseline_transaction_count": 0.0, "baseline_total_amount": 0.0,
                "baseline_failure_rate": 0.0, "baseline_p95_latency_ms": 0.0,
                "baseline_retry_rate": 0.0,
            }
        averages = {key: sum(item[key] for item in history) / len(history) for key in history[0]}
        return {
            "baseline_transaction_count": averages["transaction_count"],
            "baseline_total_amount": averages["total_amount"],
            "baseline_failure_rate": averages["failure_rate"],
            "baseline_p95_latency_ms": averages["p95_latency_ms"],
            "baseline_retry_rate": averages["retry_rate"],
        }


async def run() -> None:
    try:
        from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
    except ImportError as exc:
        raise RuntimeError('Install streaming dependencies: pip install -e ".[streaming]"') from exc

    settings = get_settings()
    service = AnomalyDetectionService()
    if not service.load_model():
        raise RuntimeError("Anomaly artifact could not be loaded; refusing to consume events.")
    consumer = AIOKafkaConsumer(
        settings.kafka_anomaly_topic, bootstrap_servers=settings.kafka_bootstrap_servers,
        group_id=settings.kafka_consumer_group, enable_auto_commit=False,
        value_deserializer=lambda value: json.loads(value.decode("utf-8")),
    )
    producer = AIOKafkaProducer(
        bootstrap_servers=settings.kafka_bootstrap_servers,
        value_serializer=lambda value: json.dumps(value).encode("utf-8"),
    )
    aggregator = RealtimeWindowAggregator(settings, service)
    seen_event_ids: deque[str] = deque(maxlen=100_000)
    seen_event_id_set: set[str] = set()
    await consumer.start()
    await producer.start()
    try:
        async for record in consumer:
            event = normalize_payment_event(record.value, record.timestamp)
            event_id = str(event.get("event_id") or f"{record.topic}:{record.partition}:{record.offset}")
            if event_id not in seen_event_id_set:
                if len(seen_event_ids) == seen_event_ids.maxlen:
                    seen_event_id_set.discard(seen_event_ids.popleft())
                seen_event_ids.append(event_id)
                seen_event_id_set.add(event_id)
                aggregator.ingest(event)
            for score in aggregator.flush_closed():
                if score["is_anomaly"]:
                    alert_id = (
                        f"anomaly:{score['merchant_id']}:{score['window_start']}:{score['model_version']}"
                    )
                    await producer.send_and_wait(settings.kafka_anomaly_result_topic, {
                        "event_id": alert_id,
                        "event_type": "TRANSACTION_ANOMALY_DETECTED",
                        "occurred_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
                        "data": score,
                    }, key=score["merchant_id"].encode())
            await consumer.commit()
    finally:
        await consumer.stop()
        await producer.stop()


if __name__ == "__main__":
    asyncio.run(run())
