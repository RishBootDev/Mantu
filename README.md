# Mantu — Distributed Intelligent Payment Gateway

Mantu is an enterprise **Distributed Intelligent Payment Gateway** engineering simulation built with **Java 21 / Spring Boot 4.1.x**, **Spring Cloud**, **Apache Kafka**, **Redis**, **MySQL**, **React 18 + TypeScript**, and **Python FastAPI ML Services**.

> **Disclaimer:** Mantu is an engineering simulation for distributed systems, payment orchestration, and ML integration. It does not process real financial transactions.

---

## Key Capabilities

- **Centralized Edge & Security (`api-gateway`)**: Spring Cloud Gateway (WebMVC) with JWT Bearer & Basic API Key authentication, Redis rate limiting, and KYC onboarding enforcement.
- **Merchant Onboarding & KYC (`merchant-service`)**: Merchant signup/login, 4-document KYC upload & email-link review, API key rotation with 24-hour grace periods, and AES-GCM encrypted webhook configs.
- **PCI-Style Card Vault (`vault-service`)**: Envelope encryption (per-card 32-byte AES-GCM DEK wrapped by master key) and Resilience4j thread-pool `@Bulkhead` card charging.
- **Payment Orchestration (`payment-service`)**: Order management, `PaymentStateMachine`, Saga compensation (`PaymentAuthorizationRecorder`), Transactional Outbox + ShedLock, and synchronous ML screening.
- **Operations & Settlements (`operations-service`)**: Kafka webhook delivery with Redis ZSet exponential backoff + DLQ, Java 21 Virtual Thread batch settlements, and Ops risk/anomaly monitoring.
- **Three ML Capabilities (`ml-services`)**:
  1. **Intelligent Fraud Detection** (`HistGradientBoostingClassifier` trained on IEEE-CIS)
  2. **Smart Payment Routing** (`Pipeline` + `HistGradientBoostingClassifier` for route success ranking)
  3. **Real-Time Transaction Anomaly Detection** (`aiokafka` 5-minute tumbling window worker + `HistGradientBoostingClassifier`)
- **Deskwell Sample Merchant (`sample_merchant_application`)**: Full e-commerce storefront + FastAPI backend integrating with Mantu APIs and HMAC-SHA256 webhooks.

---

## Technology Stack Summary

For detailed rationale, versions, and module mappings, see [01 — Technology Stack](docs/01-Technology-Stack.md).

| Layer | Technologies |
|---|---|
| **Mantu Dashboard (`frontend/`)** | React `18.3.1`, TypeScript `5.7.3`, Vite `6.1.0`, Tailwind CSS `3.4.17`, React Router `6.28.0`, Axios `1.7.9`, Lucide React |
| **Deskwell Storefront (`sample_merchant_application/frontend/`)** | React `18.3.1`, TypeScript `5.5.4`, Vite `5.4.0`, React Router `6.26.0`, Native Fetch (`mc_session` cookie) |
| **Deskwell Backend (`sample_merchant_application/backend/`)** | Python, FastAPI `>=0.115`, SQLAlchemy `>=2.0.30`, HTTPX `>=0.27`, Pydantic `>=2.7`, Pytest `>=8.0` |
| **Java Microservices (`microservices/`)** | Java `21` (Virtual Threads), Spring Boot `4.1.0`/`4.1.1`, Spring Cloud `2025.1.2`/`2025.1.3`, Spring Cloud Gateway WebMVC, Netflix Eureka, Spring Cloud Config, OpenFeign, Spring Data JPA, MapStruct `1.6.3`, Resilience4j, ShedLock `6.9.0`, JJWT `0.12.6`, Lombok |
| **Machine Learning (`ml-services/`)** | Python `>=3.11`, FastAPI, Uvicorn, `scikit-learn` (`HistGradientBoostingClassifier`), `pandas`, `numpy`, `joblib`, `aiokafka`, `py-eureka-client`, `structlog` |
| **Data & Infrastructure** | MySQL (`mysql-connector-j`), Redis, Apache Kafka, Zipkin (`9411`), Micrometer Prometheus, Jib Maven Plugin `3.5.2` |

---

## Visual Showcase

### Mantu Merchant Dashboard
![Mantu Merchant Dashboard](screenshots/Screenshot%202026-11-27%20142847.png)

### Deskwell Checkout powered by Mantu Payment Gateway
![Mantu Checkout Modal on Deskwell](screenshots/Screenshot%202026-11-27%20145900.png)

### Mantu Operations Risk Command Center
![Mantu Operations Risk Command Center](screenshots/Screenshot%202026-11-27%20121842.png)

---

## Architecture Diagrams (`docs/diagrams/`)

- [High-Level System Architecture](docs/diagrams/system-architecture.md)
- [Microservices Architecture](docs/diagrams/microservices-architecture.md)
- [Payment Processing Sequence](docs/diagrams/payment-sequence.md)
- [Merchant Onboarding & KYC Sequence](docs/diagrams/merchant-onboarding-sequence.md)
- [ML Integration Architecture](docs/diagrams/ml-integration.md)
- [Database ER Diagrams](docs/diagrams/database-er-diagram.md)
- [Deployment Architecture](docs/diagrams/deployment-architecture.md)

---

## Detailed Documentation (`docs/`)

- [00 — Project Overview](docs/00-Project-Overview.md)
- [01 — Technology Stack](docs/01-Technology-Stack.md)
- [02 — System Architecture](docs/02-System-Architecture.md)
- [03 — Microservices Architecture](docs/03-Microservices-Architecture.md)
- [04 — Frontend Architecture](docs/04-Frontend-Architecture.md)
- [05 — Backend Implementation](docs/05-Backend-Implementation.md)
- [06 — API Gateway](docs/06-API-Gateway.md)
- [07 — Service Discovery & Configuration](docs/07-Service-Discovery-And-Configuration.md)
- [08 — Database Architecture](docs/08-Database-Architecture.md)
- [09 — Event-Driven Architecture](docs/09-Event-Driven-Architecture.md)
- [10 — ML Architecture](docs/10-ML-Architecture.md)
- [11 — Fraud Detection](docs/11-Fraud-Detection.md)
- [12 — Smart Payment Routing](docs/12-Smart-Payment-Routing.md)
- [13 — Transaction Anomaly Detection](docs/13-Transaction-Anomaly-Detection.md)
- [14 — Payment Lifecycle](docs/14-Payment-Lifecycle.md)
- [15 — Merchant Onboarding & KYC](docs/15-Merchant-Onboarding-And-KYC.md)
- [16 — Checkout Architecture](docs/16-Checkout-Architecture.md)
- [17 — Authentication & Security](docs/17-Authentication-And-Security.md)
- [18 — Design Patterns](docs/18-Design-Patterns.md)
- [19 — API Reference](docs/19-API-Reference.md)
- [20 — Deployment & Execution](docs/20-Deployment-And-Execution.md)
- [21 — Performance & Scalability](docs/21-Performance-And-Scalability.md)
- [22 — Testing Strategy](docs/22-Testing-Strategy.md)
- [23 — Engineering Decisions & Tradeoffs](docs/23-Engineering-Decisions-And-Tradeoffs.md)
- [24 — Known Limitations & Future Roadmap](docs/24-Known-Limitations-And-Future-Roadmap.md)
