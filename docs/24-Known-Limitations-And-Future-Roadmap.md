# 24 — Known Limitations and Future Roadmap

## 1. Known Limitations (Verified in Codebase)

1. **Simulation Only**: `CardPaymentProcessor`, `UpiPaymentProcessor`, and `NetBankingPaymentProcessor` simulate processor responses rather than calling external acquiring banks or NPCI switches.
2. **Refunds Not Exposed**: `Refund` entity and `RefundRepository` exist in `payment-service`, and `operations-service` listens to `refunds.events`, but no refund REST endpoint or service workflow is implemented.
3. **Rate Limiter Variants**: `SharedResilienceAutoConfiguration` maps `fixed`, `sliding`, `sliding-lua`, and `bucket` all to `FixedWindowRateLimiter`.
4. **No Container Orchestration**: No `Dockerfile` or `docker-compose.yml` exists in the repository (only `jib-maven-plugin` in `config-service` and `api-gateway`).
5. **Internal Header Trust**: Downstream services trust `X-Merchant-Id` and `X-User-Role` headers without service-to-service mTLS or HMAC header signing.
6. **Anomaly Worker State**: `AnomalyWorker` keeps 5-minute window aggregations and baselines in process memory rather than Redis.
7. **Unrouted UI & Scaffolded KYC ML**: `frontend/src/pages/risk/AnomalyAlertsPage.tsx` is unrouted; `ml-services` `merchant_kyc` and `kyc_worker.py` are scaffolds without mounted routes; `config-service` `application.yaml` contains a second YAML document that disables Eureka when active.
8. **Pre-existing Frontend TS Diagnostics**: `frontend/src/api/client.ts` (`ImportMeta.env`) and `sample_merchant_application/frontend/vite.config.ts` (`process.env`) report minor `tsc --noEmit` warnings while `vite build` succeeds cleanly.

---

## 2. Recommended Future Roadmap

1. **Complete Refund API & Webhook Flow**: Expose `POST /v1/payments/{paymentId}/refunds` in `payment-service` and emit `REFUND_PROCESSED` outbox events.
2. **Containerization (`docker-compose.yml`)**: Provide a single-command compose stack for MySQL, Redis, Kafka, Zipkin, Eureka, Config, all 4 core services, Gateway, ML, and Frontends.
3. **Internal Service Security**: Add mTLS or a gateway-signed internal JWT between `api-gateway` and downstream microservices.
4. **Object Storage for KYC**: Add an S3/MinIO implementation of `KycDocumentStorage` in `merchant-service`.
5. **Wire `SharedResilienceAutoConfiguration` Rate Limiters**: Connect `SlidingWindowLuaLimiter` and `TokenBucketRateLimiter` to their respective config keys.
6. **Automated Integration Test Suite**: Expand `*ApplicationTests.java` with Testcontainers and add Playwright E2E tests for Deskwell -> Mantu -> Ops flows.
