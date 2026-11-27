# 09 — Event-Driven Architecture

Mantu uses **Apache Kafka** paired with the **Transactional Outbox Pattern** and **ShedLock** distributed locking to guarantee reliable asynchronous event propagation without dual-write inconsistencies.

---

## 1. Transactional Outbox Pattern (`payment-service` & `operations-service`)

Both `payment-service` and `operations-service` implement the identical outbox pipeline:
1. **Atomic Persistence (`OutboxEventPublisher`)**: Within the same `@Transactional` boundary that creates/updates an `OrderRecord`, `Payment`, or `Settlement`, the service inserts an `OutboxEvent` row (`status = PENDING`, `payload` JSON).
2. **Distributed Polling (`OutboxPoller`)**: A `@Scheduled` job guarded by `@SchedulerLock` (`RedisLockProvider` via ShedLock `6.9.0`) polls pending outbox events.
3. **Kafka Publishing (`KafkaTemplate`)**:
   - Topic is resolved via `KafkaProperties.topicFor(aggregateType)` (`app.kafka.topics.*`).
   - Message key is `merchantId` (preserving per-merchant ordering within partitions).
   - Envelope format: `{ eventId, eventType, aggregateType, aggregateId, occurredAt, data }`.
4. **Result Recording (`OutboxResultHandler`)**: Marks `OutboxEvent` as `PUBLISHED` with `publishedAt`, or increments `attempts` and records `lastError` on failure.

---

## 2. Kafka Topics, Producers & Consumers

| Event / Aggregate | Producer | Kafka Topic | Consumers | Purpose |
|---|---|---|---|---|
| `ORDER_CREATED`, `ORDER_CANCELLED` (`ORDER`) | `payment-service` (`OutboxPoller`) | `${app.kafka.topics.orders:orders.events}` | `operations-service` (`WebhookKafkaConsumer`) | Triggers merchant webhook notifications for order lifecycle |
| `PAYMENT_APPROVED`, `PAYMENT_AUTHORIZATION_COMPENSATED`, `PAYMENT_STATUS_CHANGED` (`PAYMENT`) | `payment-service` (`OutboxPoller`) | `${app.kafka.topics.payments:payments.events}` | `operations-service` (`WebhookKafkaConsumer`) | Triggers merchant webhook notifications for payment status changes |
| `SETTLEMENT_PROCESSED`, `SETTLEMENT_FAILED` (`SETTLEMENT`) | `operations-service` (`OutboxPoller`) | `${app.kafka.topics.settlements:settlements.events}` | `operations-service` (`WebhookKafkaConsumer`) | Triggers merchant webhook notifications for settlements |
| Transaction Events | Payment / Event Producer | `payment.transaction.created` (`KAFKA_TRANSACTION_TOPIC`) | `ml-services` (`AnomalyWorker`) | Feeds 5-minute tumbling window aggregation for anomaly detection |
| `TRANSACTION_ANOMALY_DETECTED` | `ml-services` (`AnomalyWorker`) | `${app.kafka.topics.anomaly-alerts:ml.transaction.anomaly.detected}` | `operations-service` (`AnomalyAlertKafkaConsumer`) | Persists `AnomalyAlert` rows for Ops Risk Dashboard |

---

## 3. Consumer Reliability, Retries & Dead-Letter Queue

- **Manual Acknowledgment**: `operations-service` configures `spring.kafka.listener.ack-mode: manual_immediate`; both `WebhookKafkaConsumer` and `AnomalyAlertKafkaConsumer` invoke `Acknowledgment.acknowledge()` only after DB persistence succeeds.
- **Webhook Delivery & Retry Engine (`operations-service`)**:
  - `WebhookKafkaConsumer` looks up active merchant webhook targets from `merchant-service`, computes `X-Mantu-Signature` (HMAC-SHA256 via `SignerUtil`), and inserts `WebhookEvent`.
  - Failed deliveries are scheduled into a **Redis Sorted Set (`webhook-retry`)** via `WebhookRetryQueue` with exponential backoff (`1m, 5m, 30m, 2h, 8h, 24h`, max `7` attempts).
  - After `7` failed attempts, `WebhookDlqRecorder` (in `Propagation.REQUIRES_NEW`) writes a `DlqEvent` row for audit/replay.
- **ML Anomaly Worker Deduplication (`ml-services`)**:
  - `AnomalyWorker` disables auto-commit (`enable_auto_commit=False`), deduplicates `event_id`s using an in-memory `collections.deque(maxlen=100_000)` + `set`, and commits offsets only after scoring/publishing.

---

## 4. Runtime Infrastructure Screenshots

### Apache Kafka (KRaft) & Consumer Groups (`mantu-group`, `operations-anomaly-alerts`)
![Kafka KRaft Server Startup](<../screenshots/Screenshot%202026-11-27%20123927.png>)
![Kafka Consumer Group Coordination](<../screenshots/Screenshot%202026-11-27%20123944.png>)

### Redis Cloud Console (Idempotency, Rate Limiting, API Key Cache & Webhook Retry ZSet)
![Redis Cloud Console Metrics](<../screenshots/Screenshot%202026-11-27%20123433.png>)
