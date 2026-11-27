# 14 — Payment Lifecycle and Business Flows

> Visual reference: [Payment Sequence Diagram](diagrams/payment-sequence.md)

---

## 1. Order Creation (`POST /v1/orders`)
- **Actors**: Merchant Backend (e.g. Deskwell FastAPI) or Dashboard -> `api-gateway` -> `payment-service` -> `merchant-service`.
- **Preconditions**: Merchant `status == ACTIVE` (`MerchantOnboardingGate` passes).
- **Steps**:
  1. `api-gateway` authenticates (`Basic` API key or `Bearer` JWT) and injects `X-Merchant-Id`.
  2. `OrderController.create()` invokes `OrderServiceImpl.create()`.
  3. `OrderServiceImpl` calls `CustomerServiceClient.findOrCreateCustomer` (`@CircuitBreaker` + `@Retry` on `merchant-service`) to resolve `customerId`.
  4. `OrderPersistenceService` saves `OrderRecord` (`CREATED`) and `OutboxEvent` (`ORDER_CREATED`) atomically.

---

## 2. Card Tokenization (`POST /v1/vault/tokenize`, Card Payments Only)
- **Steps**:
  1. `VaultController.tokenize()` validates PAN (Luhn + 13-19 digits), CVV (3-4 digits), and expiry (`@ExpiryYear`).
  2. `VaultServiceImpl` generates a 32-byte random DEK, encrypts the PAN using AES-GCM (`AesBytesEncryptor`), encrypts the DEK with `vault.master-key`, and stores `VaultCard` + `CardToken` (`tok_*`).
  3. Returns `TokenizeResponse` without echoing PAN or CVV.

---

## 3. Payment Initiation, ML Screening, Routing & Authorization (`POST /v1/payments`)
- **Steps**:
  1. `PaymentAuthorizationRecorder.recordPayment()` validates order ownership/expiry, checks `(merchant_id, idempotency_key)` uniqueness, persists `Payment` (`INITIATING`), and records `PaymentTransitionLog`.
  2. `FraudScreeningService.screen()` queries 10-minute customer velocity (`PaymentRepository.countRecentByCustomer`), calls `ml-services` `/api/v1/fraud/predict`, and saves `fraudProbability` / `fraudRiskLevel`. In `BLOCK` mode, `HIGH` risk triggers `compensateAuthorizationFailure()` (`FRAUD_BLOCKED`).
  3. `SmartRoutingService.recommendRoute()` calls `ml-services` `/api/v1/routing/recommend` and persists `selectedRouteId`.
  4. `PaymentGatewayRouter` dispatches to `CardPaymentAdapter` (calls `VaultServiceClient.charge` -> `vault-service` `@Bulkhead` `CardPaymentProcessor`), `UpiPaymentAdapter`, or `NetBankingAdapter`.
  5. `PaymentAuthorizationRecorder.applyGatewayResult()` validates transitions via `PaymentStateMachine`, updates `Payment` (`AUTHORIZED` or `FAILED`), logs `PaymentTransitionLog`, and inserts an `OutboxEvent`.

---

## 4. Payment Capture (`POST /v1/payments/{paymentId}/capture`)
- Deskwell automatically calls `/v1/payments/{id}/capture` when `status == AUTHORIZED` and `merchant_auto_capture=True`.
- `PaymentServiceImpl.capture()` transitions `AUTHORIZED` -> `CAPTURED` via `PaymentStateMachine`, sets `capturedAt`, and publishes `PAYMENT_STATUS_CHANGED` via `OutboxEvent`.

---

## 5. Webhook Delivery & Merchant Verification
1. `OutboxPoller` (`payment-service`) publishes `PAYMENT_STATUS_CHANGED` / `PAYMENT_APPROVED` to Kafka (`payments.events`).
2. `WebhookKafkaConsumer` (`operations-service`) fetches active targets from `merchant-service`, signs `{ event, payload }` with HMAC-SHA256 (`X-Mantu-Signature`), and queues `WebhookEvent`.
3. `WebhookDeliverySchedular` + `WebhookDeliveryExecutor` POST to the merchant (`POST /api/webhooks/mantu` on Deskwell), retrying up to 7 times via Redis ZSet (`webhook-retry`) before moving to `dlq_event`.

---

## 6. Batch Settlement (`operations-service`)
- `SettlementEngine` runs on a `@Scheduled` interval using `Executors.newVirtualThreadPerTaskExecutor()`.
- Queries `merchant-service` (`/internal/merchants/active-ids` and `/settlement-bank-details`) and `payment-service` (`/internal/payments/unsettled-captured`).
- `SettlementTransactionExecutor` computes gross, fee, GST, and net `Money` amounts, persists `Settlement` + `SettlementPayment`, emits `SETTLEMENT_PROCESSED` outbox event, and marks payments settled in `payment-service`.

---

## 7. Refund Processing (Implementation Status)
- **Status**: **Partially Implemented**. `payment-service` defines `Refund` entity (`refund` table), `RefundStatus` enum, and `RefundRepository`, and `operations-service` subscribes to `refunds.events`, **but no REST controller or service endpoint currently exposes refund initiation**.
