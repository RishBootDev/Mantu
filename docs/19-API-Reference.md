# 19 — API Reference

All external merchant & ops requests enter through `api-gateway` (`http://localhost:8080`) unless calling `ml-services` (`8100`) or Deskwell (`8000`) directly.

---

## 1. `merchant-service` Endpoints

| Method | Path | Auth | Request / Params | Response (`Status`) |
|---|---|---|---|---|
| `POST` | `/v1/auth/signup` | Public | `MerchantSignupRequest` | `MerchantResponse` (`201`) |
| `POST` | `/v1/auth/login` | Public | `LoginRequest` | `LoginResponse` (`200`) |
| `POST` | `/v1/merchants/api-keys` | JWT (`X-Merchant-Id`) | `CreateApiKeyRequest` | `ApiKeyCreateResponse` (`201`) |
| `GET` | `/v1/merchants/api-keys` | JWT | — | `List<ApiKeyResponse>` (`200`) |
| `POST` | `/v1/merchants/api-keys/{keyId}/rotate` | JWT | Path `keyId` | `ApiKeyCreateResponse` (`200`) |
| `DELETE` | `/v1/merchants/api-keys/{keyId}` | JWT | Path `keyId` | `204 No Content` |
| `GET` | `/v1/merchants/kyc` | JWT | — | `KycOnboardingResponse` (`200`) |
| `POST` | `/v1/merchants/kyc/documents` | JWT | Query `type`, Multipart `document` | `KycOnboardingResponse` (`200`) |
| `POST` | `/v1/merchants/kyc/submit` | JWT | — | `KycOnboardingResponse` (`202`) |
| `POST` | `/v1/merchants/kyc/approve-demo` | JWT | — | `KycOnboardingResponse` (`200`) |
| `POST` | `/v1/merchants/webhooks` | JWT | `UpdateWebhookConfigRequest` | `WebhookConfigResponse` (`200`) |
| `GET` | `/v1/merchants/webhooks` | JWT | — | `List<WebhookConfigResponse>` (`200`) |
| `GET` | `/v1/merchants/webhooks/{id}` | JWT | Path `id` | `WebhookConfigResponse` (`200`) |
| `PUT` | `/v1/merchants/webhooks/{id}` | JWT | Path `id`, `UpdateWebhookConfigRequest` | `WebhookConfigResponse` (`200`) |
| `DELETE` | `/v1/merchants/webhooks/{id}` | JWT | Path `id` | `204 No Content` |
| `GET` | `/internal/kyc/review/{token}` | Token | Path `token` | HTML (`200`) |
| `POST` | `/internal/kyc/review/{token}/decision` | Token | Query `decision`, `note` | HTML (`200`) |
| `GET` | `/internal/kyc/review/{token}/documents/{documentId}` | Token | Path `token`, `documentId` | `Resource` (`200`) |
| `GET` | `/internal/api-keys/{keyId}` | Internal | Path `keyId` | `ApiKeyCacheEntry` (`200`) |
| `POST` | `/internal/customers/find-or-create` | Internal | `FindOrCreateCustomerRequest` | `UUID` (`200`) |
| `GET` | `/internal/merchants/{merchantId}/onboarding-status` | Internal | Path `merchantId` | `MerchantOnboardingStatusResponse` (`200`) |
| `GET` | `/internal/merchants/{merchantId}/webhook-targets` | Internal | Query `eventType` | `List<WebhookTarget>` (`200`) |
| `GET` | `/internal/merchants/active-ids` | Internal | — | `List<UUID>` (`200`) |
| `GET` | `/internal/merchants/{merchantId}/settlement-bank-details` | Internal | Path `merchantId` | `SettlementBankDetails` (`200`) |

---

## 2. `payment-service` Endpoints

| Method | Path | Auth | Request / Headers | Response (`Status`) |
|---|---|---|---|---|
| `POST` | `/v1/orders` | JWT or Basic (`ACTIVE` KYC) | `CreateOrderRequest`, optional `X-Idempotency-Key` | `OrderResponse` (`201`) |
| `GET` | `/v1/payments` | JWT or Basic (`ACTIVE` KYC) | — | `List<PaymentResponse>` (`200`) |
| `POST` | `/v1/payments` | JWT or Basic (`ACTIVE` KYC) | `PaymentInitRequest`, optional `X-Idempotency-Key` | `PaymentResponse` (`201`) |
| `GET` | `/v1/payments/{paymentId}` | JWT or Basic (`ACTIVE` KYC) | Path `paymentId` | `PaymentResponse` (`200`) |
| `POST` | `/v1/payments/{paymentId}/capture` | JWT or Basic (`ACTIVE` KYC) | Path `paymentId` | `PaymentResponse` (`200`) |
| `GET` | `/internal/payments/unsettled-captured` | Internal | Query `merchantId` | `List<PaymentSettlementView>` (`200`) |
| `POST` | `/internal/payments/mark-settled` | Internal | `List<UUID>` | `200 OK` |
| `GET` | `/internal/payments/risk-summary` | Internal | Query `hours` (default `0`) | `RiskSummary` (`200`) |
| `GET` | `/internal/payments/ops-transactions` | Internal | Query `limit` (default `200`) | `List<OpsTransactionView>` (`200`) |

---

## 3. `vault-service` Endpoints

| Method | Path | Auth | Request | Response (`Status`) |
|---|---|---|---|---|
| `POST` | `/v1/vault/tokenize` | JWT or Basic (`ACTIVE` KYC) | `@Valid TokenizeRequest` | `TokenizeResponse` (`201`) |
| `POST` | `/internal/vault/charge` | Internal | `VaultChargeRequest` | `PaymentProcessorResponse` (`200`) |

---

## 4. `operations-service` Endpoints

| Method | Path | Auth | Request / Params | Response (`Status`) |
|---|---|---|---|---|
| `GET` | `/internal/ops/risk-dashboard` | JWT (`MANTU_OPS_ADMIN`) | Query `hours` (default `0`) | `DashboardView` (`200`) |
| `GET` | `/internal/ops/risk-dashboard/transactions` | JWT (`MANTU_OPS_ADMIN`) | Query `limit` (default `200`) | `List<OpsTransactionView>` (`200`) |
| `GET` | `/internal/anomaly-alerts` | Internal | Query `page=0`, `size=50` | `AlertPage` (`200`) |
| `POST` | `/webhook/success` | Public | `Map<String, Object>` | `204 No Content` |

---

## 5. `ml-services` Endpoints (Port `8100`)

| Method | Path | Request | Response (`Status`) |
|---|---|---|---|
| `GET` | `/health` | — | `{"status": "ok"}` (`200`) |
| `GET` | `/ready` | — | `{"status": "ready" | "degraded"}` (`200`) |
| `POST` | `/api/v1/fraud/predict` | `FraudPredictionRequest` | `FraudPredictionResponse` (`200`) |
| `POST` | `/api/v1/routing/recommend` | `RoutingRecommendationRequest` | `RoutingRecommendationResponse` (`200`) |
| `POST` | `/api/v1/anomalies/score` | `AnomalyWindowRequest` | `AnomalyScoreResponse` (`200`) |

---

## 6. Deskwell Sample Merchant Backend Endpoints (Port `8000`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Health check (`{"status": "ok"}`) |
| `GET` | `/api/catalog` | Public | Lists active `CatalogProduct` items |
| `POST` | `/api/checkout/orders` | `mc_session` cookie | Creates local order + Mantu `/v1/orders` (`201`) |
| `POST` | `/api/checkout/orders/{order_id}/pay` | `mc_session` cookie | Tokenizes card (if `CARD`), calls Mantu `/v1/payments`, auto-captures |
| `POST` | `/api/checkout/orders/{order_id}/verify` | `mc_session` cookie | Verifies HMAC-SHA256 checkout signature |
| `POST` | `/api/checkout/payments/{payment_id}/capture` | `mc_session` cookie | Captures an `AUTHORIZED` payment |
| `GET` | `/api/orders` & `/api/orders/{order_id}` | `mc_session` cookie | Lists/polls session orders |
| `POST` | `/api/webhooks/mantu` | `X-Mantu-Signature` | Verifies HMAC, deduplicates, applies monotonic state (`204`) |

---

## 7. Standard Error Envelope (`GlobalExceptionHandler`)

Spring Boot services return `ErrorResponse`:
```json
{
  "errorCode": "BUSINESS_RULE_VIOLATION",
  "errorDescription": "Human-readable message",
  "timeStamp": "2026-11-27T10:00:00",
  "fieldErrors": [{ "field": "pan", "message": "Invalid card number" }]
}
```
Common HTTP status codes: `400` (validation/rule violation), `401` (invalid/missing auth), `403` (`KYC_REQUIRED` or `OPS_ACCESS_REQUIRED`), `404` (`ResourceNotFoundException`), `409` (`DuplicateResourceException` / `IdempotencyConflictException`), `429` (`RateLimitException` + `Retry-After`).
