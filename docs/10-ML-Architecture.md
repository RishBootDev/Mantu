# 10 — Machine Learning Architecture

> Visual reference: [ML Integration Diagram](diagrams/ml-integration.md)

---

## 1. Overview of ML Platform (`D:\Mantu\ml-services`)

`ml-services` is a standalone Python (`>=3.11`) FastAPI service running on port `8100` (`uvicorn app.main:app --port 8100`). During FastAPI `lifespan` startup (`src/app/main.py`):
1. Configures structured JSON logging (`structlog`).
2. Loads all 3 serialized `scikit-learn` `.joblib` models into memory (`load_fraud_model()`, `load_routing_model()`, `load_anomaly_model()`).
3. Registers `ml-services` with Netflix Eureka (`http://localhost:8761/eureka/`) via `py-eureka-client`.

Operational probes:
- `GET /health` -> `{"status": "ok"}`
- `GET /ready` -> `{"status": "ready" | "degraded"}` (verifies all 3 models are loaded and Eureka registration is active if enabled).

---

## 2. Synchronous vs. Asynchronous ML Execution

A critical architectural distinction in Mantu is that **not all three ML models run synchronously in the payment request path**:

| ML Capability | Execution Mode | Trigger | Caller / Consumer | Impact on Payment Latency |
|---|---|---|---|---|
| **1. Fraud Detection** | **Synchronous REST** (`POST /api/v1/fraud/predict`) | Every payment initiation (`PaymentServiceImpl.initiate`) | `payment-service` (`FraudScreeningService` -> `FraudDetectionClient`) | Direct (`OBSERVE` logs score; `BLOCK` can abort `HIGH` risk) |
| **2. Smart Payment Routing** | **Synchronous REST** (`POST /api/v1/routing/recommend`) | Every payment initiation after fraud screening | `payment-service` (`SmartRoutingService` -> `SmartRoutingClient`) | Direct (selects `recommended_route_id` or falls back to health score) |
| **3. Anomaly Detection** | **Asynchronous Kafka Worker** (`AnomalyWorker`, plus REST `POST /api/v1/anomalies/score`) | Terminal payment events on `payment.transaction.created` | `ml-services` `AnomalyWorker` -> Kafka `ml.transaction.anomaly.detected` -> `operations-service` | **Zero** impact on payment checkout latency |

---

## 3. Graceful Degradation & Placeholder Mode

Every ML module in `ml-services` and its Java caller in `payment-service` implements two layers of fallback:
1. **Service-level placeholder (`ml-services`)**: If a `.joblib` artifact is missing on disk, the FastAPI service returns `is_placeholder: true` with deterministic heuristic fallbacks (e.g., `risk_level="UNAVAILABLE"` or sorting routes by `health_score`).
2. **Caller-level fallback (`payment-service`)**: `FraudScreeningService` and `SmartRoutingService` wrap Feign calls in `try/catch` blocks so if `ml-services` is unreachable or times out, payments still proceed using deterministic defaults rather than failing checkout.

---

## 4. Unused / Scaffolded ML Components

- `pyproject.toml` lists `xgboost`, `lightgbm`, and `shap` under `[project.optional-dependencies] ml`, and `opencv-python-headless`, `rapidfuzz`, `paddleocr`, `paddlepaddle` under `[kyc]`.
- In the actual codebase:
  - All 3 trained models use `sklearn.ensemble.HistGradientBoostingClassifier` (neither XGBoost nor LightGBM is used).
  - Explanations are deterministic rule-based checks on feature values (SHAP is not invoked).
  - `src/app/modules/merchant_kyc/` and `src/app/workers/kyc_worker.py` are scaffolds without mounted HTTP routes.

---

## 5. ML Service Artifacts & Runtime Screenshots

![ML Services Directory & Artifacts](<../screenshots/Screenshot%202026-11-27%20151513.png>)
![ML Services Uvicorn Startup & Eureka Registration](<../screenshots/Screenshot%202026-11-27%20143831.png>)
