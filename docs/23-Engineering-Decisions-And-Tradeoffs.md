# 23 — Engineering Decisions and Tradeoffs

| Decision | Choice Made | Alternative | Rationale & Tradeoff |
|---|---|---|---|
| **API Gateway Stack** | Spring Cloud Gateway **WebMVC** (Servlet) | Reactive WebFlux / Netty Gateway | Matches the Servlet (`OncePerRequestFilter`) stack of `common-library` and OpenFeign without reactive/blocking bridges; trades lower raw connection concurrency for codebase simplicity |
| **Event Reliability** | **Transactional Outbox** + ShedLock + Kafka | Direct `KafkaTemplate.send()` in `@Transactional` | Eliminates DB-vs-Kafka dual-write inconsistency; adds slight polling latency and outbox table maintenance |
| **ML Serving Architecture** | Separate **Python FastAPI** service (`ml-services`) registered in Eureka | In-JVM PMML / ONNX runtime | Allows native `scikit-learn`/`pandas` pipelines and independent `aiokafka` anomaly worker; introduces network hop for synchronous fraud/routing calls |
| **ML Model Family** | `HistGradientBoostingClassifier` across all 3 models | Deep Neural Networks / XGBoost | Fast tabular training & sub-millisecond inference on CPU with native missing-value support |
| **Fraud Enforcement Mode** | Configurable `OBSERVE` (default) vs `BLOCK` | Hard block by default | Allows observing live IEEE-baseline model scores without false-positive checkout failures during simulation |
| **Card Security** | Dedicated `vault-service` with per-card AES-GCM DEK + `@Bulkhead` | Storing encrypted PAN inside `payment-service` | Enforces PCI-style data boundary and protects payment threads from crypto/processor contention |
| **Webhook Retries** | **Redis ZSet** delayed queue + MySQL `dlq_event` | Kafka dead-letter topics only | Supports arbitrary exponential backoff (`1m` -> `24h`) without blocking partition consumers |
| **Concurrency for Batch I/O** | Java 21 **Virtual Threads** (`SettlementEngine`, `WebhookDeliverySchedular`) | Fixed `ExecutorService` thread pools | High throughput for blocking HTTP/Feign I/O with minimal memory footprint |
| **Centralized Config** | Spring Cloud Config backed by external Git repo | Local per-service `application.yaml` | Enables shared secrets/topics across 5+ services; makes local startup dependent on Config Server availability |
