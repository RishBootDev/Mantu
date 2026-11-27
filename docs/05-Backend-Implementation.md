# 05 — Backend Implementation

This document details the internal implementation of the four domain Spring Boot microservices under `D:\Mantu\microservices\`.

---

## 1. `merchant-service` (`com.rishbootdev.mantu.merchant_service`)

### Business Responsibility
Owns merchant registration, authentication (JWT), API key lifecycle with key rotation, KYC document onboarding and review, webhook endpoint configuration, and merchant customer directory.

### Package Structure & Key Classes
- `controller/`: `AuthController`, `ApiKeyController`, `MerchantKycController`, `WebhookConfigController`, `KycReviewController`, `InternalApiKeyController`, `InternalCustomerController`, `InternalMerchantController`
- `service/` & `service/impl/`: `AuthServiceImpl`, `ApiKeyServiceImpl`, `KycOnboardingServiceImpl`, `WebhookConfigServiceImpl`, `CustomerServiceImpl`
- `repository/`: `MerchantRepository`, `AppUserRepository`, `ApiKeyRepository`, `CustomerRepository`, `MerchantWebhookConfigRepository`, `MerchantKycCaseRepository` (`@Lock(PESSIMISTIC_WRITE)`), `MerchantKycDocumentRepository`
- `entity/`: `Merchant`, `AppUser`, `ApiKey`, `Customer`, `MerchantWebhookConfig`, `MerchantKycCase`, `MerchantKycDocument`
- `mapper/`: MapStruct mappers (`ApiKeyMapper`, `MerchantMapper`, `WebhookConfigMapper`)
- `kyc/`: `KycDocumentStorage` interface, `LocalKycDocumentStorage`, `KycReviewEmailService`
- `security/`: `JwtUtil`, `WebSecurityConfig`
- `config/`: `OperationsAdminInitializer` (seeds/promotes `MANTU_OPS_ADMIN` on startup)

### Request Lifecycle (`POST /v1/merchants/api-keys`)
1. `api-gateway` validates JWT -> injects `X-Merchant-Id`.
2. `MerchantContextFilter` (`common-library`) populates `MerchantContext`.
3. `IdempotencyFilter` checks `X-Idempotency-Key` in Redis if present.
4. `ApiKeyController` calls `ApiKeyServiceImpl.createKey()`.
5. Service generates `keyId` + random secret (`RandomizerUtil`), hashes secret with `BCryptPasswordEncoder`, persists `ApiKey` to MySQL, and returns plaintext secret **once** in `ApiKeyCreateResponse`.

---

## 2. `payment-service` (`com.rishbootdev.mantu.payment_service`)

### Business Responsibility
Orchestrates order creation, payment attempts, state transitions, Saga compensation, ML fraud screening, ML smart routing, and transactional outbox event publishing.

### Package Structure & Key Classes
- `controller/`: `OrderController` (`/v1/orders`), `PaymentController` (`/v1/payments`), `InternalMerchantController` (`/internal/payments`)
- `service/impl/`: `OrderServiceImpl`, `OrderPersistenceService`, `PaymentServiceImpl`
- `client/`: Feign clients `CustomerServiceClient` (`merchant-service`), `VaultServiceClient` (`vault-service`), `FraudDetectionClient` (`ml-services`), `SmartRoutingClient` (`ml-services`)
- `ml/`: `FraudScreeningService`, `SmartRoutingService`
- `saga/`: `PaymentAuthorizationRecorder`
- `statemachine/`: `PaymentStateMachine`, `PaymentTransitionService`
- `adapter/`: `PaymentGatewayRouter`, `PaymentAdapter`, `CardPaymentAdapter`, `UpiPaymentAdapter`, `NetBankingAdapter`
- `processor/`: `PaymentProcessorRouter`, `PaymentProcessor`, `CardPaymentProcessor`, `UpiPaymentProcessor`, `NetBankingPaymentProcessor`
- `outbox/`: `OutboxEventPublisher`, `OutboxPoller` (`@Scheduled` + `@SchedulerLock`), `OutboxResultHandler`

### Request Lifecycle (`POST /v1/payments`)
1. `PaymentController.initiate()` reads `MerchantContext.getMerchantId()` and `X-Idempotency-Key`.
2. `PaymentAuthorizationRecorder.recordPayment()` validates order ownership/expiry, checks DB idempotency `(merchant_id, idempotency_key)`, and saves `Payment` (`INITIATING`) + `PaymentTransitionLog` inside a DB transaction.
3. `FraudScreeningService.screen()` queries `PaymentRepository.countRecentByCustomer(...)` for 10-minute velocity and calls `FraudDetectionClient` (`/api/v1/fraud/predict`). In `OBSERVE` mode, risk metadata is stored on `Payment`; in `BLOCK` mode, `HIGH` risk triggers `compensateAuthorizationFailure` and aborts.
4. `SmartRoutingService.recommendRoute()` builds eligible gateway routes and calls `SmartRoutingClient` (`/api/v1/routing/recommend`), falling back to health-score ordering on error.
5. `PaymentGatewayRouter` dispatches to `CardPaymentAdapter` (which calls `VaultServiceClient.charge` under `@CircuitBreaker` + `@Retry`), `UpiPaymentAdapter`, or `NetBankingAdapter`.
6. `PaymentAuthorizationRecorder.applyGatewayResult()` validates transitions via `PaymentStateMachine`, updates `Payment` (`AUTHORIZED` / `FAILED`), logs `PaymentTransitionLog`, and writes an `OutboxEvent` (`PAYMENT_APPROVED` / `PAYMENT_STATUS_CHANGED`).

---

## 3. `vault-service` (`com.rishbootdev.mantu.vault_service`)

### Business Responsibility
Secures sensitive cardholder data via envelope encryption and executes card charges in bulkhead isolation.

### Package Structure & Key Classes
- `controller/`: `VaultController` (`/v1/vault/tokenize`), `InternalVaultController` (`/internal/vault/charge`)
- `sevice/impl/VaultServiceImpl` [sic: package `sevice`]: Tokenization & charging
- `processor/CardPaymentProcessor`: `@Bulkhead(name = "vault-card-processor", type = Bulkhead.Type.THREADPOOL)` returning `CompletableFuture<PaymentProcessorResponse>`
- `config/VaultEncryptionConfig`, `WebSecurityConfig`
- `validation/ExpiryYear`, `ExpiryYearValidator`

---

## 4. `operations-service` (`com.rishbootdev.mantu.operations_service`)

### Business Responsibility
Handles post-payment asynchronous workflows: outbound merchant webhook delivery, delayed retries, dead-letter queuing, batch settlements, anomaly alert persistence, and Ops risk dashboards.

### Package Structure & Key Classes
- `controller/`: `RiskDashboardController` (`/internal/ops/risk-dashboard`), `AnomalyAlertController` (`/internal/anomaly-alerts`), `DummyMerchantWebhookController` (`/webhook/success`)
- `webhook/`: `WebhookKafkaConsumer`, `WebhookDeliverySchedular`, `WebhookDeliveryExecutor`, `WebhookRetryQueue` (Redis ZSet `webhook-retry`), `WebhookDlqRecorder` (`REQUIRES_NEW`)
- `settlement/`: `SettlementEngine` (`Executors.newVirtualThreadPerTaskExecutor()`), `SettlementIntegrationGateway` (`@CircuitBreaker` + `@Retry`), `SettlementTransactionExecutor`
- `risk/`: `AnomalyAlertKafkaConsumer`, `AnomalyAlertService`
- `outbox/`: `OutboxEventPublisher`, `OutboxPoller`, `OutboxResultHandler`
- `client/`: `MerchantServiceClient`, `PaymentServiceClient` (OpenFeign)
