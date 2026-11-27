# 00 — Project Overview

## 1. Executive Summary

**Mantu** is an enterprise **Distributed Intelligent Payment Gateway** engineering simulation. It models a modern fintech payment platform combining:

- **Spring Boot 4.1.x / Java 21 Microservices** for merchant onboarding, KYC verification, API key management, PCI-style card vaulting, payment orchestration, settlements, and webhook delivery.
- **Centralized Edge & Platform Infrastructure** using Spring Cloud Gateway (WebMVC), Netflix Eureka, Spring Cloud Config Server, Redis, MySQL, and Apache Kafka.
- **Python 3.11+ / FastAPI ML Services** providing three machine learning capabilities: **Intelligent Fraud Detection**, **Smart Payment Routing**, and **Real-Time Transaction Anomaly Detection**.
- **Two React 18 + TypeScript + Vite Frontends**:
  1. **Mantu Merchant & Operations Dashboard** (`frontend/`, port `3000`) for merchant onboarding, analytics, API keys, webhooks, and internal Ops risk monitoring.
  2. **Deskwell** (`sample_merchant_application/`, frontend port `5173`, FastAPI backend port `8000`) — a realistic sample e-commerce storefront and server-side checkout integration demonstrating how an external merchant integrates with Mantu.

> **Simulation Disclaimer:** Mantu is an engineering simulation designed to demonstrate distributed systems architecture, resilient payment state machines, and ML integration. It does not connect to live card networks, UPI switches, or banking rails.

---

## 2. Repository Structure

| Path | Role | Technology |
|---|---|---|
| `microservices/common-library` | Shared DTOs, enums, exceptions, Redis idempotency, rate limiting, crypto, JPA base entities | Java 21, Spring Boot 4.1.0 |
| `microservices/eureka-discovery-service` | Service registry & discovery server (Port `8761`) | Spring Cloud Netflix Eureka Server |
| `microservices/config-service` | Centralized Git-backed configuration server (Port `8888`) | Spring Cloud Config Server |
| `microservices/api-gateway` | Edge router, JWT/API-key auth, rate limiter, KYC gate (Port `8080`) | Spring Cloud Gateway WebMVC |
| `microservices/merchant-service` | Merchant signup/login, JWT issuance, API keys, KYC workflow, webhook configs, customer directory | Spring Boot 4.1.0, MySQL, Redis |
| `microservices/payment-service` | Orders, payment state machine, Saga recorder, ML fraud/routing calls, transactional outbox | Spring Boot 4.1.0, MySQL, Kafka, ShedLock |
| `microservices/vault-service` | Card tokenization & envelope encryption (AES-GCM DEK + master key), bulkhead card charging | Spring Boot 4.1.0, MySQL, Resilience4j |
| `microservices/operations-service` | Kafka webhook consumer, Redis ZSet retry queue, DLQ, virtual-thread settlements, Ops risk & anomaly alerts | Spring Boot 4.1.0, MySQL, Kafka, Redis |
| `ml-services/` | Fraud prediction, smart routing recommendation, and Kafka anomaly detection worker (Port `8100`) | Python, FastAPI, scikit-learn, aiokafka |
| `frontend/` | Mantu Merchant Portal & Ops Risk Dashboard (Port `3000`) | React 18, TypeScript, Vite, Tailwind CSS |
| `sample_merchant_application/` | Deskwell e-commerce storefront (Port `5173`) & FastAPI backend (Port `8000`) | React 18, Vite, FastAPI, SQLAlchemy |
| `data/kyc-documents/` | Local filesystem storage for uploaded merchant KYC documents | Local disk (`./data/kyc-documents`) |

![IntelliJ Project Structure — Spring Boot Microservices](<../screenshots/Screenshot%202026-11-27%20151408.png>)
![ML Services Directory Structure](<../screenshots/Screenshot%202026-11-27%20151513.png>)

---

## 3. Implementation Status Matrix

To avoid ambiguity between implemented features and scaffolding/planned components, the table below summarizes the verified implementation state across the repository:

| Component / Capability | Status | Evidence in Repository |
|---|---|---|
| Merchant Auth (Signup, Login, JWT) | **Implemented** | `merchant-service` (`AuthController`, `JwtUtil`) |
| API Key Generation, Rotation (24h grace), BCrypt + Redis Cache | **Implemented** | `merchant-service` (`ApiKeyServiceImpl`), `api-gateway` (`ApiKeyAuthHandler`) |
| KYC Document Upload, Local Disk Storage, Email Review Link & Ops Decision | **Implemented** | `merchant-service` (`MerchantKycController`, `KycReviewController`, `LocalKycDocumentStorage`) |
| API Gateway Routing, Auth Filter, Rate Limiting, KYC Gate | **Implemented** | `api-gateway` (`GatewayAuthFilter`, `MerchantOnboardingGate`) |
| Card Tokenization & Envelope Encryption | **Implemented** | `vault-service` (`VaultServiceImpl`, `VaultEncryptionConfig`) |
| Order Creation, Payment State Machine, Saga, Transactional Outbox | **Implemented** | `payment-service` (`OrderServiceImpl`, `PaymentServiceImpl`, `PaymentAuthorizationRecorder`, `OutboxPoller`) |
| ML Fraud Detection (`HistGradientBoostingClassifier`) | **Implemented** | `ml-services` (`fraud_detection/`), `payment-service` (`FraudScreeningService`) |
| ML Smart Payment Routing (`Pipeline` + `HistGradientBoostingClassifier`) | **Implemented** | `ml-services` (`smart_routing/`), `payment-service` (`SmartRoutingService`) |
| ML Anomaly Detection (`HistGradientBoostingClassifier` + `aiokafka` Worker) | **Implemented** | `ml-services` (`anomaly_detection/`, `anomaly_worker.py`), `operations-service` (`AnomalyAlertKafkaConsumer`) |
| Webhook Delivery, HMAC Signing, Redis ZSet Backoff & DLQ | **Implemented** | `operations-service` (`WebhookKafkaConsumer`, `WebhookDeliverySchedular`, `WebhookRetryQueue`, `WebhookDlqRecorder`) |
| Batch Settlement Engine (Virtual Threads) | **Implemented** | `operations-service` (`SettlementEngine`, `SettlementTransactionExecutor`) |
| Refund Entity & Enum Definitions | **Partially Implemented** | `payment-service` defines `Refund` entity and `RefundRepository`, but exposes no refund creation/processing controller endpoint |
| ML-based KYC Document OCR/Classification | **Scaffold / Unused** | `ml-services/src/app/modules/merchant_kyc/` and `kyc_worker.py` exist as scaffolds; no HTTP router is mounted |
| Advanced Rate Limiters (Sliding Window, Lua, Token Bucket) | **Scaffold / Alias** | Classes exist in `common-library`, but `SharedResilienceAutoConfiguration` currently instantiates `FixedWindowRateLimiter` for all 4 methods |
| Anomaly Alerts Dedicated Frontend Route | **Unrouted** | `frontend/src/pages/risk/AnomalyAlertsPage.tsx` exists on disk but is not mounted in `AppRoutes.tsx` (anomaly alerts are surfaced via `/ops/risk`) |
| Dockerfiles / Docker Compose | **Not Present** | No `Dockerfile` or `docker-compose.yml` in repo; `jib-maven-plugin` is configured in `config-service` and `api-gateway` |
