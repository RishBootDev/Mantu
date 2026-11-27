# 08 — Database Architecture

> Visual reference: [Database ER Diagram](diagrams/database-er-diagram.md)

---

## 1. Database-per-Service Ownership

Mantu enforces strict **Database-per-Service** isolation across its four stateful Spring Boot microservices (all backed by MySQL via `mysql-connector-j` and Spring Data JPA/Hibernate), plus an independent SQLite/SQLAlchemy database for the Deskwell sample merchant application:

| Owner Service | Backing Store | Tables / Entities |
|---|---|---|
| `merchant-service` | MySQL | `merchant`, `app_user`, `api_key`, `customer`, `merchant_webhook_config`, `merchant_kyc_case`, `merchant_kyc_document` |
| `payment-service` | MySQL | `order_record`, `payment`, `payment_transition_log`, `refund`, `outbox_event` |
| `vault-service` | MySQL | `vault_card`, `card_token` |
| `operations-service` | MySQL | `settlement`, `settlement_payment`, `webhook_event`, `dlq_event`, `outbox_event`, `anomaly_alert` |
| `sample_merchant_application/backend` | SQLite (`app.db` / SQLAlchemy) | `catalog_product`, `merchant_order`, `payment_attempt`, `processed_webhook_event` |
| `ml-services` | None (Stateless / In-memory windows) | Uses `.joblib` model files and in-memory `deque`/window dictionaries |

---

## 2. Shared Entity Conventions (`common-library`)

- **`BaseEntity` (`@MappedSuperclass`)**: Inherited by all domain entities (except `SettlementPayment` where `SettlementPaymentId` extends `BaseEntity`). Provides JPA-audited `createdAt`, `updatedAt`, `createdBy`, `updatedBy` via `AuditingEntityListener` and `AuditorAwareImpl`.
- **`Money` (`@Embeddable`)**: Stores integer minor units (`amountUnits` in paise) and `currency` (3-char ISO code) to prevent floating-point rounding errors.

---

## 3. Schema Details by Service

### A. `merchant-service`
- **`merchant`**: PK `id` (`UUID`). Unique `email`. `status` (`MerchantStatus`: `PENDING_KYC`, `ACTIVE`, `SUSPENDED`), `businessType`, `gst`, `panId`, settlement bank columns (`settlementBankAccount`, `settlementBankIfsc`, `settlementAccountHolderName`). Index: `idx_merchant_status`.
- **`app_user`**: PK `id` (`UUID`), FK `merchant_id` -> `merchant` (nullable for `MANTU_OPS_ADMIN`), unique `email`, `passwordHash` (BCrypt), `role` (`UserRole`). Index: `idx_app_user_merchant_id`.
- **`api_key`**: PK `id` (`UUID`), FK `merchant_id` -> `merchant`, unique `keyId`, `keySecretHash`, `previousKeySecretHash`, `gracePeriodExpiresAt`, `environment`, `enabled`. Index: `idx_api_key_merchant_env (merchant_id, environment, enabled)`.
- **`customer`**: PK `id` (`UUID`), FK `merchant_id` -> `merchant`, `name`, `email`, `phone`, `gst_id`, `deletedAt`. Indexes: `idx_customer_merchant_id`, `idx_customer_email`.
- **`merchant_webhook_config`**: PK `id` (`UUID`), FK `merchant_id` -> `merchant`, `targetUrl`, `eventTypes`, `enabled`, `webhookSecret` (AES-GCM encrypted). Index: `idx_webhook_merchant_id (merchant_id, enabled)`.
- **`merchant_kyc_case`**: PK `id` (`UUID`), unique 1:1 FK `merchant_id` -> `merchant`, `status` (`KycCaseStatus`), `reviewerTokenHash` (SHA-256), `reviewerTokenExpiresAt`, optimistic lock `@Version long version`.
- **`merchant_kyc_document`**: PK `id` (`UUID`), FK `kyc_case_id` -> `merchant_kyc_case`, `documentType`, `originalFilename`, unique `storageKey`, `contentType`, `sizeBytes`. Index: `idx_kyc_document_case`.

### B. `payment-service`
- **`order_record`**: PK `id` (`UUID`), `merchant_id`, `customer_id` (cross-service UUID reference, no SQL FK), embedded `Money`, `receipt`, `orderStatus`, `attempts`, `notes` (`json`), `expiresAt`. Indexes: `idx_order_id_merchant_id`, `idx_order_merchant_id`, unique `idx_order_merchant_receipt (merchant_id, receipt)`.
- **`payment`**: PK `id` (`UUID`), FK `order_id` -> `order_record`, `merchantId`, `idempotencyKey`, embedded `Money`, `status`, `method`, `method_details` (`json`), `bankReference`, `processorReference`, `selectedRouteId`, `routingModelVersion`, `routingPlaceholder`, `fraudProbability`, `fraudRiskLevel`, `fraudModelVersion`, `fraudPlaceholder`, `errorCode`, `errorDescription`, lifecycle timestamps (`authorizedAt`, `capturedAt`, `failedAt`, `refundedAt`, `settledAt`). Indexes: `idx_payment_order_id`, `idx_payment_merchant_id`, unique `idx_payment_merchant_idempotency (merchant_id, idempotency_key)`.
- **`payment_transition_log`**: PK `id` (`UUID`), FK `payment_id` -> `payment`, `from_status`, `to_status`, `event`, `actor`, `occurred_at`. Index: `idx_payment_transition_log_payment_id`.
- **`refund`**: PK `id` (`UUID`), FK `payment_id` -> `payment`, `merchant_Id`, embedded `Money`, `status` (`RefundStatus`), `bankReference`, `notes` (`json`), `processedAt`. *(Note: Entity and repository exist, but no controller exposes refund creation yet.)*
- **`outbox_event`**: PK `id` (`UUID`), `aggregateType`, `aggregateId`, `eventType`, `payload` (`json`), `status` (`OutboxStatus`), `attempts`, `lastError`, `publishedAt`.

### C. `vault-service`
- **`vault_card`**: PK `id` (`UUID`), `encryptedPan` (`byte[]`), `encryptedDek` (`byte[]`), `lastFour`, `brand` (`CardBrand`), `bin`, `expiryMonth`, `expiryYear`, `cardHolderName`, `deletedAt`.
- **`card_token`**: PK `id` (`UUID`), FK `vault_card_id` -> `vault_card`, unique `token`, `customer` (`UUID`), `merchant` (`UUID`), `revokedAt`.

### D. `operations-service`
- **`settlement`**: PK `id` (`UUID`), `merchantId`, 5 embedded `Money` groups (`gross_amount_*`, `refund_amount_*`, `fee_amount_*`, `gst_amount_*`, `net_amount_*`), `status`, `bankReference`, `processedAt`, `failureReason`.
- **`settlement_payment`**: Composite `@EmbeddedId` (`settlementId`, `paymentId`), FK `settlement_id` -> `settlement`.
- **`webhook_event`**: PK `id` (`UUID`), `merchantId`, `eventType`, `payload` (`json`), `targetUrl`, `signature`, `status`, `attempts`, `lastResponseCode`, `lastResponseBody`, `nextRetryAt`, `lastAttemptAt`, `deleveredAt`.
- **`dlq_event`**: PK `id` (`UUID`), nullable 1:1 FK `webhook_event_id` -> `webhook_event`, `merchantId`, `finalError`, `payload` (`json`), `movedAt`, `replayedAt`.
- **`outbox_event`**: Same outbox structure as `payment-service`.
- **`anomaly_alert`**: PK `id` (`UUID`), unique `source_event_id`, `merchant_id`, `window_start`, `window_end`, `anomalyScore`, `severity`, `modelVersion`, `status` (default `"OPEN"`), `payload` (`json`). Indexes: `idx_anomaly_alert_merchant_window`, `idx_anomaly_alert_status`.

---

## 4. Cross-Service Data Exchange Without Shared DB

Services never join across schemas:
- `OrderServiceImpl` (`payment-service`) resolves `customerId` via `CustomerServiceClient` (`POST /internal/customers/find-or-create`).
- `SettlementEngine` (`operations-service`) fetches unsettled captured payments via `PaymentServiceClient` (`/internal/payments/unsettled-captured`), fetches bank details via `MerchantServiceClient`, and marks payments settled via `POST /internal/payments/mark-settled`.
- `RiskDashboardController` (`operations-service`) aggregates live metrics from `PaymentServiceClient` (`/internal/payments/risk-summary`, `/internal/payments/ops-transactions`) alongside local `AnomalyAlertRepository` records.
