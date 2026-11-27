# 18 — Design Patterns and Engineering Principles

This document distinguishes between **explicitly implemented patterns** in Mantu source code, **framework-provided patterns**, and **potential future patterns**.

---

## 1. Explicitly Implemented Patterns

| Pattern | Where Implemented | Actual Classes / Interfaces | Purpose |
|---|---|---|---|
| **Transactional Outbox** | `payment-service`, `operations-service` | `OutboxEvent`, `OutboxEventPublisher`, `OutboxPoller`, `OutboxResultHandler` | Guarantees atomic DB write + Kafka event publishing without dual-write loss |
| **State Machine** | `payment-service` | `PaymentStateMachine`, `PaymentTransitionService`, `PaymentTransitionLog` | Enforces valid `PaymentStatus` transitions and persists an immutable transition audit trail |
| **Saga / Compensation** | `payment-service` | `PaymentAuthorizationRecorder` (`recordPayment`, `compensateAuthorizationFailure`, `applyGatewayResult`) | Records authorization attempts and executes compensating failure transitions before/after external gateway calls |
| **Adapter + Strategy + Router** | `payment-service`, `vault-service` | `PaymentGatewayRouter`, `PaymentAdapter` (`CardPaymentAdapter`, `UpiPaymentAdapter`, `NetBankingAdapter`), `PaymentProcessorRouter`, `PaymentProcessor` (`CardPaymentProcessor`, `UpiPaymentProcessor`, `NetBankingPaymentProcessor`) | Decouples payment orchestration from channel-specific gateway/processor behavior |
| **Strategy (Storage Abstraction)** | `merchant-service` | `KycDocumentStorage`, `LocalKycDocumentStorage` | Abstracts file persistence so local storage can be swapped for S3/MinIO later |
| **Envelope Encryption** | `vault-service` | `VaultEncryptionConfig`, `VaultServiceImpl` | Per-card 32-byte DEK encrypted by master key (`vault.master-key`) |
| **Anti-Corruption Layer / Gateway** | `operations-service` | `SettlementIntegrationGateway` | Shields `SettlementEngine` behind `@CircuitBreaker` and `@Retry` for Feign calls |
| **Dead Letter Queue (DLQ) + Delayed Retry** | `operations-service` | `WebhookRetryQueue` (Redis ZSet), `WebhookDeliveryExecutor`, `WebhookDlqRecorder` | Exponential backoff retries without blocking Kafka consumers |
| **Idempotency Guard** | `common-library`, `payment-service`, `sample_merchant_application` | `IdempotencyFilter`, `RedisIdempotencyStore`, `PaymentAuthorizationRecorder.findExistingAttempt`, `PaymentAttempt.active_slot` | Prevents duplicate charges on network retries |
| **DTO & Mapper** | `common-library`, `merchant-service`, `payment-service` | `ApiKeyMapper`, `MerchantMapper`, `WebhookConfigMapper`, shared `common-library/dto/*` | Isolates JPA entities from external JSON contracts |

---

## 2. Framework-Provided & Architectural Patterns

- **API Gateway Pattern**: `api-gateway` (Spring Cloud Gateway WebMVC) with `GatewayAuthFilter`.
- **Service Discovery Pattern**: `eureka-discovery-service` + `@EnableEurekaServer` + `py-eureka-client`.
- **Database-per-Service**: Dedicated MySQL schemas per Spring Boot microservice.
- **Repository Pattern & Dependency Injection**: Spring Data `JpaRepository` interfaces and constructor injection (`@RequiredArgsConstructor`).
- **Circuit Breaker, Retry & ThreadPool Bulkhead**: Resilience4j annotations in `payment-service`, `operations-service`, and `vault-service` (`@Bulkhead(type = THREADPOOL)`).
- **Distributed Scheduler Lock**: ShedLock (`@SchedulerLock` + `RedisLockProvider`).

---

## 3. Software Engineering Principles Observed

- **Single Responsibility & Separation of Concerns**: ML inference (`ml-services`), card cryptography (`vault-service`), onboarding (`merchant-service`), payment orchestration (`payment-service`), and async delivery/settlement (`operations-service`) live in separate deployables.
- **DRY via `common-library`**: Shared `BaseEntity`, `Money`, `GlobalExceptionHandler`, `IdempotencyFilter`, `RateLimiter`, `SignerUtil`, and `MerchantContextFilter` eliminate cross-service duplication.
- **Graceful Degradation**: Deterministic fallbacks in `FraudScreeningService`, `SmartRoutingService`, and `ml-services` placeholder mode prevent ML downtime from halting payments.

---

## 4. Future / Not-Yet-Implemented Patterns

- **CQRS**: Read dashboards (`RiskDashboardController`) currently query transactional tables via Feign rather than dedicated read projections.
- **Full Orchestrated Distributed Saga**: Currently implemented locally inside `payment-service` (`PaymentAuthorizationRecorder`) rather than spanning multi-service compensations (e.g., automated refund compensation).
