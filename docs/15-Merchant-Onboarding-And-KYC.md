# 15 — Merchant Onboarding and KYC Lifecycle

> Visual reference: [Merchant Onboarding Sequence Diagram](diagrams/merchant-onboarding-sequence.md)

---

## 1. Registration & Login
- **Signup (`POST /v1/auth/signup`)**: Public route in `api-gateway`. `AuthServiceImpl` validates uniqueness of email, hashes the password with `BCryptPasswordEncoder`, creates `Merchant` (`status = PENDING_KYC`), and creates `AppUser` (`role = OWNER`).
- **Login (`POST /v1/auth/login`)**: Verifies BCrypt password and issues an HMAC-SHA256 JWT (`JwtUtil`, 6000s / 100-minute expiry) containing `subject=email`, `role`, and `merchant_id`. Returns `merchantStatus` and `onboardingComplete` flags so the React UI routes pending merchants to `/onboarding/kyc`.

---

## 2. KYC Document Upload (`POST /v1/merchants/kyc/documents`)
- **Enforcement**: `api-gateway`'s `MerchantOnboardingGate` allows `/v1/merchants/kyc/**` even while `paymentsEnabled == false`, while blocking `/v1/orders/**` and `/v1/payments/**` with `403 KYC_REQUIRED`.
- **Storage (`LocalKycDocumentStorage`)**: Stores up to 4 mandatory documents (`KycDocumentType`: `PAN`, `GST`, `BANK_PROOF`, `INCORPORATION`, max `10MB` per file) as extensionless UUID files under `./data/kyc-documents/{kycCaseId}/{storageKey}`, recording metadata in `merchant_kyc_document`.

---

## 3. KYC Submission & Ops Review (`POST /v1/merchants/kyc/submit` -> `/internal/kyc/review/{token}`)
1. `KycOnboardingServiceImpl.submit()` verifies all 4 document types are present, generates a random reviewer token, stores its SHA-256 hash in `MerchantKycCase.reviewerTokenHash` (7-day TTL), and sets status to `UNDER_REVIEW`.
2. `KycReviewEmailService` emails the review URL (`http://localhost:8080/internal/kyc/review/{token}`) via `JavaMailSender`.
3. Operations Admin opens the review page (`KycReviewController` renders HTML + inline document preview endpoints `/internal/kyc/review/{token}/documents/{documentId}`) or submits a decision via `POST /internal/kyc/review/{token}/decision`.
4. `MerchantKycCaseRepository.findWithLockById` acquires a `PESSIMISTIC_WRITE` lock (backed by `@Version` optimistic locking). On `APPROVED`, `Merchant.status` becomes `ACTIVE`, unlocking `/v1/orders`, `/v1/payments`, and `/dashboard`.
5. **Demo Shortcut**: `POST /v1/merchants/kyc/approve-demo` exists to self-approve a KYC case immediately during local demos/testing.

---

## 4. Verified Merchant KYC Card

![Your KYC is Verified Animated Card](<../screenshots/Screenshot%202026-11-27%20143129.png>)
