# 21 — Performance, Scalability and Reliability

---

## 1. Implemented Optimizations & Reliability Mechanisms

| Mechanism | Where Implemented | Engineering Impact |
|---|---|---|
| **Redis API Key & Secret Caching** | `api-gateway` (`ApiKeyCache`, `ApiKeyAuthHandler`) | Avoids hitting `merchant-service` and re-running expensive BCrypt hashing on every API request (30s verified secret cache in Redis) |
| **Redis-Backed Idempotency** | `common-library` (`IdempotencyFilter`, `RedisIdempotencyStore`) | 30s in-progress lock + 24h completed response cache prevents duplicate processing |
| **Java 21 Virtual Threads** | `operations-service` (`SettlementEngine`, `WebhookDeliverySchedular`) | Enables high-concurrency I/O-bound webhook HTTP calls and settlement batches without OS thread exhaustion |
| **Resilience4j Circuit Breaker & Retry** | `payment-service` (`OrderServiceImpl`, `CardPaymentAdapter`), `operations-service` (`SettlementIntegrationGateway`) | Prevents cascading failures when `merchant-service`, `vault-service`, or `payment-service` degrades |
| **Thread-Pool Bulkhead** | `vault-service` (`CardPaymentProcessor`) | Isolates card-charging threads (`vault-card-processor`) from starving general Tomcat workers |
| **ShedLock Distributed Locking** | `payment-service`, `operations-service` (`OutboxPoller`) | Allows horizontal scaling of service instances without duplicate outbox polling |
| **Redis ZSet Delayed Retry + DLQ** | `operations-service` (`WebhookRetryQueue`, `WebhookDlqRecorder`) | Non-blocking exponential backoff (`1m` to `24h`, 7 attempts) + persistent DLQ |
| **Database Indexing** | All 4 JPA services | Composite indexes on `(merchant_id, receipt)`, `(merchant_id, idempotency_key)`, `(merchant_id, environment, enabled)`, `(merchant_id, window_start)` |
| **ML Graceful Fallbacks** | `FraudScreeningService`, `SmartRoutingService`, `ml-services` | Checkout continues using deterministic fallbacks if `ml-services` is slow or unavailable |

---

## 2. Bottlenecks & Scalability Recommendations (Not Yet Implemented)

1. **Synchronous ML Latency in Checkout**: `payment-service` makes two sequential synchronous Feign calls (`fraud/predict` then `routing/recommend`) per payment. Explicit Feign connect/read timeouts and Resilience4j circuit breakers should be tuned on `FraudDetectionClient` and `SmartRoutingClient`.
2. **`FixedWindowRateLimiter` Only**: `SharedResilienceAutoConfiguration` currently wires `FixedWindowRateLimiter` for all 4 `app.rate-limit.method` options (`sliding`, `sliding-lua`, `bucket` classes exist but are not instantiated). Fixed windows can allow 2× burst spikes across minute boundaries.
3. **In-Memory Window State in `AnomalyWorker`**: `ml-services/src/app/workers/anomaly_worker.py` holds 5-minute window aggregations and 12-window baselines in Python memory. Scaling `AnomalyWorker` horizontally requires Kafka partition affinity by `merchant_id` or externalizing window state to Redis.
4. **Full-Table Queries in Analytics**: `InternalMerchantController.riskSummary` and `OverviewPage` load broad payment lists in memory; SQL `GROUP BY` / `SUM` projections and pagination should replace full scans as volume grows.
5. **Local Disk KYC Storage**: `./data/kyc-documents` is single-node local storage; multi-instance `merchant-service` deployments should implement an S3/MinIO `KycDocumentStorage` bean.

---

## 3. Observability & Tracing Screenshots

### Zipkin Distributed Tracing (`localhost:9411`)
![Zipkin Trace List](<../screenshots/Screenshot%202026-11-27%20123306.png>)
![Zipkin Trace Detail — WebhookDeliverySchedular with Redis Spans](<../screenshots/Screenshot%202026-11-27%20123349.png>)

### Redis Cloud Console Performance Metrics
![Redis Cloud Console Ops/sec and Latency](<../screenshots/Screenshot%202026-11-27%20123433.png>)
