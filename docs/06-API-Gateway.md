# 06 — API Gateway (`api-gateway`)

`api-gateway` (`com.rishbootdev.mantu:api-gateway:0.0.1-SNAPSHOT`, port `8080`) is built on **Spring Cloud Gateway Server WebMVC** (`spring-cloud-starter-gateway-server-webmvc`), using the Servlet stack rather than reactive Netty.

---

## 1. Routing Table (`application.yaml`)

| Route ID | Target URI | Path Predicates |
|---|---|---|
| `merchant-service` | `${MERCHANT_SERVICE_URI:lb://merchant-service}` | `/v1/auth/**`, `/v1/merchants/**`, `/internal/kyc/review/**` |
| `payment-service` | `${PAYMENT_SERVICE_URI:lb://payment-service}` | `/v1/orders/**`, `/v1/payments/**` |
| `vault-service` | `${VAULT_SERVICE_URI:lb://vault-service}` | `/v1/vault/**` |
| `operations-service` | `${OPERATIONS_SERVICE_URI:lb://operations-service}` | `/webhook/**`, `/internal/ops/**` |

---

## 2. Security & Request Filter Pipeline

`api-gateway` sets `app.security.trust-inbound-headers: false` (disabling `common-library`'s `MerchantContextFilter`) and `app.idempotency.enabled: false` (letting downstream services enforce idempotency). Instead, it executes `GatewayAuthFilter` (`OncePerRequestFilter`, `@Order(Ordered.HIGHEST_PRECEDENCE + 1)`):

1. **Public Route Bypass (`PublicRouteMatcher`)**:
   - Skips authentication for `/v1/auth/**`, `/webhook/**`, `/actuator/**`, and `/internal/kyc/review/**`.
2. **Authentication Dispatch**:
   - **`Basic <base64>` (`ApiKeyAuthHandler`)**:
     - Parses `keyId:secret`.
     - Looks up `ApiKeyCacheEntry` in Redis (`ApiKeyCache`) or fetches via Feign `ApiKeyLookupClient` (`GET /internal/api-keys/{keyId}`) and caches it.
     - Validates `entry.enabled()` and checks BCrypt match against `keySecretHash` or `previousKeySecretKeyHash` (if `isInGracePeriod()`), caching successful secret verifications in Redis for 30s (`apikey:secret-verified:{keyId}:{hash}:{sha256}`).
     - Enforces rate limiting (`RateLimiter` with key `apikey:{keyId}`, default `200` requests/minute) and attaches `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers (returning HTTP `429` + `Retry-After` on exhaustion).
     - Injects `X-Merchant-Id`, `X-Environment`, and `X-Key-Id`.
   - **`Bearer <jwt>` (`JwtAuthHandler` + `JwtVerifier`)**:
     - Validates HMAC-SHA signature via `jwt.secret-key`.
     - Extracts `merchant_id` -> `X-Merchant-Id` and `role` -> `X-User-Role`.
   - Missing or unsupported `Authorization` headers return `401 UNAUTHORIZED` JSON (`errorCode`, `errorDescription`).
3. **Ops Authorization Check**:
   - Requests to `/internal/ops/**` require `X-User-Role == "MANTU_OPS_ADMIN"`; otherwise returns `403 OPS_ACCESS_REQUIRED`.
4. **Onboarding / KYC Gate (`MerchantOnboardingGate`)**:
   - If `X-Merchant-Id` is present and the path does not start with `/v1/merchants/kyc`, calls Feign `MerchantOnboardingClient` (`GET /internal/merchants/{merchantId}/onboarding-status`).
   - If `paymentsEnabled == false`, rejects with `403 KYC_REQUIRED`.
5. **Header Propagation**:
   - Wraps the request with `HeaderAugmentingRequestWrapper` so downstream services receive verified `X-Merchant-Id`, `X-Key-Id`, `X-Environment`, and `X-User-Role` headers.

---

## 3. CORS & Gateway Observations

- **CORS**: `api-gateway` does **not** configure CORS in `application.yaml` or Java classes. In local development, the React frontends avoid CORS via Vite's dev proxy (`/v1`, `/internal` -> `localhost:8080`, and Deskwell calls Mantu server-to-server from FastAPI).
- **Important Note on `/internal/anomaly-alerts`**: `api-gateway`'s `application.yaml` defines `/internal/ops/**` under `operations-service`, while `AnomalyAlertController` in `operations-service` is mapped to `/internal/anomaly-alerts`. Unless configured in the remote Config Server repository, `/internal/anomaly-alerts` is not routed by local `api-gateway` `application.yaml`.
