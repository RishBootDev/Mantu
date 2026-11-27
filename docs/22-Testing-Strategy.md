# 22 — Testing Strategy

---

## 1. Current Test Inventory

| Module | Test Files | Scope & Coverage |
|---|---|---|
| `sample_merchant_application/backend` | `tests/conftest.py`, `tests/test_checkout.py` (9 tests), `tests/test_webhooks.py` (7 tests) | **Strongest automated coverage**: server-side pricing, session isolation, duplicate pay idempotency, method field validation, card redaction in errors, vault tokenization, signature verification, webhook HMAC `401` rejection, replay deduplication, monotonic status `RANK`, amount mismatch checks, retry-after-failure |
| `ml-services` | `tests/test_health.py` (2 tests), `tests/test_ml_routes.py` (2 tests) | FastAPI `TestClient` contract tests for `/health`, `/ready`, `POST /api/v1/fraud/predict`, and `POST /api/v1/routing/recommend` |
| `merchant-service` | `MerchantServiceApplicationTests.java`, `controller/KycReviewControllerTest.java` | Spring Boot context test + KYC review controller unit/MockMvc test |
| `api-gateway`, `config-service`, `eureka-discovery-service`, `payment-service`, `operations-service`, `vault-service` | `*ApplicationTests.java` (1 per service) | Default Spring Boot `contextLoads()` test skeletons |
| `frontend/` & `sample_merchant_application/frontend/` | None | Verified via `npx vite build` and `tsc --noEmit` |

---

## 2. Running Existing Tests

### Sample Merchant Backend (`pytest`)
```powershell
cd D:\Mantu\sample_merchant_application\backend
.venv\Scripts\python.exe -m pytest -v
```

### ML Services (`pytest`)
```powershell
cd D:\Mantu\ml-services
pytest -v
```

### Microservices (`mvnw test`)
```powershell
cd D:\Mantu\microservices\merchant-service
.\mvnw.cmd test
```

---

## 3. Recommended Test Additions

- Add unit/integration tests for `PaymentStateMachine`, `PaymentAuthorizationRecorder` (Saga compensation), and `OutboxPoller` in `payment-service` using Testcontainers (MySQL + Redis + Kafka).
- Add tests for `WebhookDeliveryExecutor` / `WebhookRetryQueue` in `operations-service` and `VaultServiceImpl` envelope encryption in `vault-service`.
- Add `pytest` coverage for `POST /api/v1/anomalies/score` and `AnomalyWorker` windowing in `ml-services`.
- Add Vitest / Playwright E2E coverage for `frontend/` and Deskwell checkout flows.
