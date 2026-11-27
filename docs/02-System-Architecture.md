# 02 — System Architecture

> Visual reference: [System Architecture Diagram](diagrams/system-architecture.md) | [Deployment Architecture Diagram](diagrams/deployment-architecture.md)

---

## 1. Overall Distributed Architecture

Mantu is structured as a **multi-tier, event-driven microservices platform** separating synchronous payment orchestration from asynchronous side-effects (webhook delivery, batch settlements, and ML anomaly detection):

1. **Edge & Discovery Layer**:
   - `eureka-discovery-service` (`8761`) acts as the service registry for both Java Spring Boot services and the Python `ml-services` instance.
   - `config-service` (`8888`) centralizes externalized configuration from `https://github.com/rishbootdev/distributed-mantu-config`.
   - `api-gateway` (`8080`) terminates external client traffic, enforces JWT or API Key authentication, applies Redis-backed rate limiting, enforces KYC onboarding gates, and forwards trusted identity headers (`X-Merchant-Id`, `X-Key-Id`, `X-User-Role`) downstream.

2. **Core Domain Microservices**:
   - `merchant-service`: Identity, merchant profile, KYC compliance lifecycle, API key lifecycle, webhook subscriptions, and customer directory.
   - `vault-service`: PCI-style isolation boundary for raw card PAN/CVV tokenization and envelope encryption.
   - `payment-service`: Order management, payment state machine, Saga compensation, fraud/routing ML orchestration, and transactional outbox.
   - `operations-service`: Event-driven webhook delivery with Redis delayed retry queues and DLQ, virtual-thread batch settlements, and Ops risk/anomaly aggregation.

3. **Machine Learning Layer (`ml-services`, `8100`)**:
   - Exposes low-latency synchronous REST endpoints for **Fraud Detection** and **Smart Payment Routing** (consumed by `payment-service` via OpenFeign).
   - Runs an asynchronous `aiokafka` background worker (`AnomalyWorker`) for **Real-Time Transaction Anomaly Detection**, publishing alerts back to Kafka for `operations-service`.

4. **Client & Simulation Layer**:
   - `frontend/` (`3000`): Mantu Merchant Dashboard & Ops Risk Portal.
   - `sample_merchant_application/` (`5173` / `8000`): Deskwell e-commerce store integrating with Mantu via HTTP Basic API keys and HMAC-verified webhooks.

---

## 2. Microservices Decomposition Strategy

Mantu decomposes domains by **bounded context and security/compliance isolation**:

- **Compliance & PCI Boundary (`vault-service`)**: Raw PANs and CVVs are never persisted in `payment-service` or `merchant-service`. `vault-service` isolates cryptographic key material (32-byte DEK + `vault.master-key`) and executes card charges inside a dedicated Resilience4j thread-pool `@Bulkhead`.
- **Control Plane vs. Data Plane (`merchant-service` vs. `payment-service`)**: Merchant onboarding, KYC review, and API key rotation are isolated from high-throughput payment state transitions.
- **Side-Effect Isolation (`operations-service`)**: Slow or unreliable external merchant webhook HTTP calls (with 7-attempt exponential backoff) and batch settlement calculations run asynchronously in `operations-service` so they never block payment authorization latency.
- **Polyglot ML Separation (`ml-services`)**: Python/scikit-learn workloads run in an independent FastAPI process rather than embedding JNI/PMML inside the JVM, while still participating in Eureka service discovery.

---

## 3. Inter-Service Communication Patterns

### Synchronous Communication (OpenFeign + Eureka Load Balancing)
- `api-gateway` -> `merchant-service`: `ApiKeyLookupClient`, `MerchantOnboardingClient`.
- `payment-service` -> `merchant-service`: `CustomerServiceClient` (`@CircuitBreaker` + `@Retry`).
- `payment-service` -> `vault-service`: `VaultServiceClient` (`@CircuitBreaker` + `@Retry`).
- `payment-service` -> `ml-services`: `FraudDetectionClient`, `SmartRoutingClient` (explicit `try/catch` deterministic fallbacks).
- `operations-service` -> `payment-service` & `merchant-service`: `PaymentServiceClient`, `MerchantServiceClient` (`SettlementIntegrationGateway` with `@CircuitBreaker` + `@Retry`; `RiskDashboardController` direct Feign calls).

### Asynchronous Communication (Transactional Outbox + Kafka)
- `payment-service` and `operations-service` never publish directly to Kafka inside business transactions before DB commit. Instead, they persist an `OutboxEvent` row in the same ACID database transaction as the domain entity (`OrderRecord`, `Payment`, `Settlement`), and a ShedLock-coordinated `OutboxPoller` publishes events to Kafka reliably.
- `operations-service` consumes payment/order/settlement/refund topics for webhook dispatch (`WebhookKafkaConsumer`) and `ml.transaction.anomaly.detected` for anomaly alert storage (`AnomalyAlertKafkaConsumer`).
- `ml-services` (`AnomalyWorker`) consumes `payment.transaction.created` and produces `ml.transaction.anomaly.detected`.

---

## 4. Database-per-Service Strategy

Each of the four core Spring Boot services owns its own MySQL schema (`merchant-service`, `payment-service`, `vault-service`, `operations-service`), enforced by JPA entities in separate modules. Cross-service data access is strictly prohibited at the SQL layer; services exchange data exclusively via internal REST endpoints (`/internal/*`) or Kafka events (for example, `OrderServiceImpl` calls `CustomerServiceClient.findOrCreateCustomer` to obtain a `customerId` UUID rather than querying `merchant-service`'s `customer` table).
