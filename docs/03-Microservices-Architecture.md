# 03 — Microservices Architecture

> Visual reference: [Microservices Architecture Diagram](diagrams/microservices-architecture.md)

---

## 1. Service Inventory

| Service | Artifact / Module | Port | Database / Store | Key Responsibilities |
|---|---|---|---|---|
| **eureka-discovery-service** | `com.rishbootdev.mantu:eureka-discovery-service` | `8761` | None | Netflix Eureka service registry for all Spring services and `ml-services` |
| **config-service** | `com.rishbootdev.mantu:config-service` | `8888` | Git repo (`distributed-mantu-config`) | Centralized Spring Cloud Config Server |
| **api-gateway** | `com.rishbootdev.mantu:api-gateway` | `8080` | Redis | Edge routing (WebMVC), JWT & Basic API-key auth, rate limiting, KYC gate |
| **merchant-service** | `com.rishbootdev.mantu:merchant-service` | Config Server | MySQL, Redis, `./data/kyc-documents` | Signup/login, JWT issuance, API keys, KYC workflow, webhook configs, customers |
| **payment-service** | `com.rishbootdev.mantu:payment-service` | Config Server | MySQL, Redis, Kafka | Orders, payment state machine, Saga recorder, ML fraud/routing, outbox publisher |
| **vault-service** | `com.rishbootdev.mantu:vault-service` | Config Server | MySQL | Card tokenization, AES-GCM envelope encryption, bulkhead card charging |
| **operations-service** | `com.rishbootdev.mantu:operations-service` | Config Server | MySQL, Redis, Kafka | Webhook consumer & retry/DLQ engine, virtual-thread settlements, Ops risk dashboard & anomaly alerts |
| **common-library** | `com.rishbootdev.mantu:common-library` | Library (`1.0.0`) | Redis (auto-config) | Shared DTOs, enums, `BaseEntity`, `Money`, `GlobalExceptionHandler`, `IdempotencyFilter`, `MerchantContextFilter`, `RateLimiter`, crypto |
| **ml-services** | `mantu-ml-services` (Python) | `8100` | In-memory windows, `.joblib` artifacts, Kafka | Fraud prediction, smart routing recommendation, 5-min window anomaly detection |

---

## 2. `common-library` Auto-Configuration Backbone

`common-library` wires cross-cutting infrastructure into every Spring Boot service via `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`:

1. **`SharedResilienceAutoConfiguration`**: Registers `StringRedisTemplate`, `RedisApiKeyCache`, `RedisIdempotencyStore`, `IdempotencyFilter` (active when `app.idempotency.enabled=true`), and `RateLimiter` (`FixedWindowRateLimiter`).
2. **`SharedAuditAutoConfiguration`**: Registers `AuditorAwareImpl` to populate `createdBy` / `updatedBy` on `BaseEntity`.
3. **`SharedSecurityAutoConfiguration`**: Registers `SignerUtil` (HMAC-SHA256), `masterKeyEncryptor` (`vault.master-key`), `webhookSecretEncryptor` (`webhoook.secret-encryption-key`), and request-scoped `MerchantContext`.
4. **`SharedKafkaAutoConfiguration`**: Binds `KafkaProperties` (`app.kafka.topics`) mapping `EventAggregateType` (`PAYMENT`, `ORDER`, `REFUND`, `SETTLEMENT`) to topic names.
5. **`SharedExceptionAutoConfiguration`**: Registers `GlobalExceptionHandler` (`@RestControllerAdvice`).
6. **`SharedWebFilterAutoConfiguration`**: Registers `RequestContextFilter` (`HIGHEST_PRECEDENCE`) and `MerchantContextFilter` (`HIGHEST_PRECEDENCE + 1`, disabled in `api-gateway` via `app.security.trust-inbound-headers: false`).

---

## 3. Trust Boundary & Context Propagation

Downstream services (`merchant-service`, `payment-service`, `vault-service`, `operations-service`) do **not** declare Spring Security `SecurityFilterChain` beans. Instead:

1. `api-gateway` disables `MerchantContextFilter` (`app.security.trust-inbound-headers: false`) and runs `GatewayAuthFilter` (`HIGHEST_PRECEDENCE + 1`).
2. `GatewayAuthFilter` authenticates the caller (JWT `Bearer` or API Key `Basic`), verifies Ops role or KYC onboarding gate, and wraps the request with `HeaderAugmentingRequestWrapper` injecting `X-Merchant-Id`, `X-Key-Id`, `X-Environment`, and `X-User-Role`.
3. Downstream services run `MerchantContextFilter` (`common-library`), which reads `X-Merchant-Id` and `X-Key-Id` into the request-scoped `MerchantContext` bean consumed by controllers and services.
