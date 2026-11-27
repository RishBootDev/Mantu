# 01 — Technology Stack

Every technology documented below was verified directly from `pom.xml`, `pyproject.toml`, `package.json`, `requirements.txt`, and source files.

---

## A. Frontend Stack

### 1. Mantu Merchant & Ops Dashboard (`frontend/`)

| Technology | Version | Purpose in Mantu | Where Used | Why Selected / Problem Solved |
|---|---|---|---|---|
| **React** | `^18.3.1` | Component-based SPA UI | `frontend/src/` | Declarative UI rendering for multi-role dashboards (Merchant & Ops Admin) |
| **TypeScript** | `^5.7.3` | Static typing for API DTOs and state | `frontend/src/types/api.ts`, `*.tsx` | Prevents contract drift between Java/Python DTOs and UI components |
| **Vite** | `^6.1.0` | Dev server (port `3000`) and bundler | `frontend/vite.config.ts` | Fast HMR and built-in `/v1` & `/internal` proxy to `localhost:8080` |
| **React Router DOM** | `^6.28.0` | Client-side routing & route guards | `AppRoutes.tsx`, `ProtectedRoute.tsx`, `KycGuardRoute.tsx`, `OpsGuardRoute.tsx` | Enforces auth, KYC completion, and `MANTU_OPS_ADMIN` role isolation in the UI |
| **Tailwind CSS** | `^3.4.17` | Utility-first styling | `frontend/src/**/*.tsx`, `index.css` | Rapid, consistent enterprise UI styling with custom `mantu-*` tokens |
| **Axios** | `^1.7.9` | HTTP client with interceptors | `frontend/src/api/client.ts` | Centralizes JWT `Authorization` injection, automatic `X-Idempotency-Key` generation, and `401`/`KYC_REQUIRED` redirects |
| **Lucide React** | `^0.475.0` | Iconography | Pages & `Sidebar.tsx` | Lightweight tree-shakeable SVG icons |
| **uuid** | `^11.0.5` | Client-side idempotency key generation | `frontend/src/api/client.ts` | Generates UUIDv4 `X-Idempotency-Key` headers for `POST /orders` and `/payments` |

### 2. Deskwell Sample Storefront (`sample_merchant_application/frontend/`)

| Technology | Version | Purpose | Where Used |
|---|---|---|---|
| **React / ReactDOM** | `^18.3.1` | Storefront & checkout modal UI | `sample_merchant_application/frontend/src/` |
| **React Router DOM** | `^6.26.0` | Storefront, cart, checkout, order result routing | `src/App.tsx` |
| **TypeScript** | `^5.5.4` | Typed storefront & checkout state | `src/types.ts`, `src/components/checkout/checkoutTypes.ts` |
| **Vite** | `^5.4.0` | Dev server (port `5173`) with `/api` proxy to `:8000` | `vite.config.ts` |
| **Fetch API** | Native | Cookie-authenticated (`credentials: "include"`) HTTP calls | `src/api/merchantApi.ts` |

---

## B. Backend Stack (Spring Boot Microservices)

| Technology | Version | Purpose in Mantu | Where Used | Why Selected / Problem Solved |
|---|---|---|---|---|
| **Java** | `21` | Primary backend runtime | All 8 Maven modules | LTS release providing records, sealed interfaces (`PaymentProcessorResponse`), and **Virtual Threads** (`Executors.newVirtualThreadPerTaskExecutor()`) |
| **Spring Boot** | `4.1.1` (infra) / `4.1.0` (services & common-lib) | Application runtime & auto-configuration | All 8 Maven modules | Rapid microservice bootstrap, Actuator health checks, JPA/Kafka/Redis integration |
| **Spring Cloud** | `2025.1.2` / `2025.1.3` | Distributed cloud primitives | Gateway, Config, Eureka, Core services | Service discovery, centralized config, declarative HTTP clients |
| **Spring Cloud Gateway WebMVC** | `2025.1.3` | Servlet-based API Gateway | `api-gateway` | Unified edge routing without reactive WebFlux complexity, matching the Servlet stack of `common-library` |
| **Spring Cloud Netflix Eureka** | `2025.1.2` | Service registration & client discovery | `eureka-discovery-service`, all services | Eliminates hardcoded service URLs (`lb://merchant-service`, `lb://payment-service`, etc.) |
| **Spring Cloud Config** | `2025.1.2` | Centralized Git-backed configuration | `config-service`, all services | Externalizes DB URLs, Kafka topic mappings, and shared secrets |
| **Spring Cloud OpenFeign** | `2025.1.2` / `2025.1.3` | Declarative REST client (with `feign-hc5` in `payment-service`) | `api-gateway`, `payment-service`, `operations-service` | Clean interface-driven inter-service calls integrated with Eureka load balancing |
| **Spring Data JPA / Hibernate** | Boot-managed | ORM & repository abstraction | `merchant-service`, `payment-service`, `operations-service`, `vault-service` | Entities, optimistic locking (`@Version`), pessimistic locks (`@Lock`), auditing (`BaseEntity`) |
| **Spring Security Crypto** | Boot-managed | `BCryptPasswordEncoder` & `AesBytesEncryptor` | `common-library`, `merchant-service`, `vault-service` | Password/API secret hashing and AES-GCM encryption without needing full `SecurityFilterChain` |
| **JJWT (`io.jsonwebtoken`)** | `0.12.6` | JWT signing & verification | `merchant-service`, `api-gateway` | Stateless HMAC-SHA256 authentication tokens for merchant & ops dashboard users |
| **Resilience4j** | Boot/Cloud starter | `@CircuitBreaker`, `@Retry`, `@Bulkhead` | `payment-service`, `operations-service`, `vault-service` | Isolates downstream failures and protects vault card charging with thread-pool bulkheads |
| **ShedLock** | `6.9.0` | Distributed scheduler lock (`shedlock-provider-redis-spring`) | `payment-service`, `operations-service` | Prevents duplicate outbox polling and settlement runs across multiple instances |
| **MapStruct** | `1.6.3` | Compile-time DTO mapping | `merchant-service`, `payment-service` | Zero-reflection mapping between JPA entities and API DTOs |
| **Lombok** | Boot-managed | Boilerplate reduction (`@RequiredArgsConstructor`, `@Builder`, `@Slf4j`) | `common-library`, `api-gateway`, core services | Concise immutable/builder-driven Java code |
| **Jakarta Validation** | Boot-managed | Request DTO validation (`@Valid`, `@NotBlank`, `@ExpiryYear`) | `api-gateway`, core services | Early rejection of malformed payloads via `GlobalExceptionHandler` |

---

## C. Sample Merchant Backend (`sample_merchant_application/backend/`)

| Technology | Version | Purpose |
|---|---|---|
| **Python + FastAPI** | `>=0.115,<1.0` | Merchant checkout proxy, server-side order pricing, and webhook receiver (Port `8000`) |
| **Uvicorn** | `>=0.30` | ASGI server |
| **SQLAlchemy** | `>=2.0.30,<2.1` | ORM (`CatalogProduct`, `MerchantOrder`, `PaymentAttempt`, `ProcessedWebhookEvent`) |
| **HTTPX** | `>=0.27,<1.0` | Async client calling Mantu Gateway with HTTP Basic auth and exponential backoff |
| **Pydantic** | `>=2.7,<3.0` | Request/response schemas with `SecretStr` for PAN/CVV redaction |
| **Pytest** | `>=8.0` | Automated tests (`test_checkout.py`, `test_webhooks.py`) |

---

## D. Infrastructure & Data Stack

| Technology | Purpose in Mantu | Where Used | Notes |
|---|---|---|---|
| **MySQL** | Relational persistence (`mysql-connector-j`) | `merchant-service`, `payment-service`, `operations-service`, `vault-service` | Database-per-service; connection URLs managed via Config Server |
| **Redis** | API key cache, `IdempotencyFilter` store, `FixedWindowRateLimiter`, ShedLock, `WebhookRetryQueue` ZSet | `common-library`, `api-gateway`, `merchant-service`, `payment-service`, `operations-service` | Core low-latency coordination layer |
| **Apache Kafka** | Asynchronous event backbone | `payment-service` (producer), `operations-service` (consumer/producer), `ml-services` (`aiokafka` consumer/producer) | Connects outbox events to webhook delivery and real-time anomaly detection |
| **Zipkin & Micrometer Prometheus** | Distributed tracing & metrics export | `common-library` (`spring-boot-starter-zipkin`, `micrometer-registry-prometheus`), `config-service` (`localhost:9411`) | `1.0` tracing sampling configured in `config-service` |
| **Jib Maven Plugin** | `3.5.2` container image builder | `config-service`, `api-gateway` | Builds OCI images without requiring a local `Dockerfile` |

---

## E. Machine Learning Stack (`ml-services/`)

| Technology | Version Constraint | Purpose in Mantu | Status |
|---|---|---|---|
| **Python** | `>=3.11` | ML runtime & async worker | Active |
| **FastAPI + Uvicorn** | `>=0.115`, `>=0.30` | Inference REST API (Port `8100`) | Active |
| **Pydantic / pydantic-settings** | `>=2.8`, `>=2.4` | Strict request/response validation (`extra="forbid"`) & env settings | Active |
| **scikit-learn** | `>=1.5` | `HistGradientBoostingClassifier`, `ColumnTransformer`, `OneHotEncoder`, `Pipeline` | Active (used by all 3 models) |
| **pandas / numpy** | `>=2.2`, `>=1.26` | Feature engineering, temporal splits, rolling 5-min window aggregations | Active |
| **joblib** | `>=1.4` | Model + metadata serialization (`.joblib` artifacts) | Active |
| **aiokafka** | `>=0.11` | Async Kafka consumer/producer in `anomaly_worker.py` | Active |
| **py-eureka-client** | `>=0.13,<1.0` | Registers `ml-services` with Netflix Eureka (`http://localhost:8761/eureka/`) | Active |
| **structlog** | `>=24.4` | Structured JSON logging | Active |
| **xgboost, lightgbm, shap** | `>=2.1`, `>=4.5`, `>=0.46` | Listed under `[project.optional-dependencies] ml` in `pyproject.toml` | **Not used** in current training/inference code |
| **opencv-python-headless, rapidfuzz, paddleocr, paddlepaddle** | Optional `[kyc]` group | Intended for `merchant_kyc` OCR/classification | **Scaffold only** (no mounted API route) |
