# 17 — Authentication and Security Architecture

---

## 1. Authentication Mechanisms

Mantu supports two external authentication schemes terminated at `api-gateway` (`GatewayAuthFilter`):

1. **JWT Bearer Authentication (Merchant & Ops Dashboard)**:
   - Issued by `merchant-service` (`JwtUtil`, `jjwt` `0.12.6`, HMAC-SHA256 via `${jwt.secret-key}`, 100-minute / 6000s TTL).
   - Claims: `sub` (email), `role` (`OWNER`, `ADMIN`, `TEAM`, `MANTU_OPS_ADMIN`), `merchant_id` (UUID).
   - Verified in `api-gateway` (`JwtAuthHandler` + `JwtVerifier`), which injects `X-Merchant-Id` and `X-User-Role`.
2. **HTTP Basic API Key Authentication (Server-to-Server Merchant Integrations)**:
   - Format: `Authorization: Basic base64(keyId:secret)`.
   - Handled by `ApiKeyAuthHandler`: fetches `ApiKeyCacheEntry` from Redis (or `merchant-service` `/internal/api-keys/{keyId}`), verifies `enabled == true`, checks BCrypt match against `keySecretHash` or `previousKeySecretKeyHash` (during 24h rotation grace period), and caches verified hashes in Redis for 30s.

---

## 2. Authorization & Onboarding Gates

- **Role-Based Access Control**: `/internal/ops/**` routes require `X-User-Role == "MANTU_OPS_ADMIN"` at both `api-gateway` (`GatewayAuthFilter`) and `operations-service` (`RiskDashboardController`).
- **KYC Onboarding Gate (`MerchantOnboardingGate`)**: Blocks `X-Merchant-Id` calls outside `/v1/merchants/kyc/**` with `403 KYC_REQUIRED` until `MerchantOnboardingClient` reports `paymentsEnabled == true`.
- **Deskwell Session Isolation**: Deskwell FastAPI backend isolates customer orders per browser via HTTP-only `mc_session` cookie (`samesite="lax"`).

---

## 3. Cryptography & Sensitive Data Protection

- **Password & API Key Hashing**: `BCryptPasswordEncoder` for `AppUser.passwordHash` and `ApiKey.keySecretHash`.
- **Card Vault Envelope Encryption (`vault-service`)**:
  - Generates a random 32-byte DEK per card.
  - Encrypts PAN with AES-GCM (`AesBytesEncryptor`, 12-byte random IV).
  - Encrypts DEK with `vault.master-key` (`BytesEncryptor` from `common-library` `AesEncryptionConfig`).
  - Zeroes decrypted `panBytes` in a `finally` block during `charge()`.
  - CVV is validated at tokenization time and never stored in `vault_card`.
- **Webhook Secret Encryption & HMAC Signing**:
  - `MerchantWebhookConfig.webhookSecret` is encrypted at rest via `webhookSecretEncryptor` (`AesBytesEncryptor`).
  - Outbound webhooks are signed with HMAC-SHA256 (`SignerUtil`) in `X-Mantu-Signature`; Deskwell verifies signatures using `hmac.compare_digest` on raw request bytes.
- **KYC Reviewer Token Hashing**: `MerchantKycCase` stores only `SHA-256(token)` (`reviewerTokenHash`) with a 7-day TTL.
- **Input Validation & SQL Injection Prevention**: Jakarta Bean Validation (`@Valid`, `@ExpiryYear`, Luhn checks), Pydantic `SecretStr` + `extra="forbid"`, and parameterized JPA/SQLAlchemy queries.

---

## 4. Identified Security Gaps & Observations

1. **No Service-to-Service mTLS or Internal Network Auth**: Downstream services (`merchant-service`, `payment-service`, `vault-service`, `operations-service`) trust `X-Merchant-Id`, `X-Key-Id`, and `X-User-Role` headers via `MerchantContextFilter` without verifying a gateway signature. If ports are exposed directly bypassing `api-gateway`, headers could be spoofed.
2. **Public `/internal/kyc/review/**` Route**: `PublicRouteMatcher` marks `/internal/kyc/review/**` public (protected by high-entropy token + SHA-256 hash), and `OpsReviewPage` in `frontend/` uses `ProtectedRoute` rather than `OpsGuardRoute`.
3. **No CORS Configuration on `api-gateway`**: Currently relies on Vite's dev proxy and server-to-server calls from Deskwell.
4. **Config Server Credentials in YAML**: `config-service/application.yaml` contains a GitHub credential directly in source config (should be injected via environment variables).
5. **Local Disk KYC Storage**: Documents are stored unencrypted on local disk (`./data/kyc-documents`) without malware scanning.
