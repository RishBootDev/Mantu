# 12 — Smart Payment Routing

---

## 1. Routing Problem & Objective
For each payment attempt, multiple simulated processor routes may be eligible (each with distinct real-time health scores, 5m/1h success rates, error rates, p95 latency, fee basis points, and capacity scores). The **Smart Payment Routing** service predicts the authorization success probability for each candidate route and ranks them so `payment-service` selects the route most likely to succeed.

---

## 2. Dataset, Features & Training (`training/smart_routing/train.py`)

- **Dataset**: `dataset/smart-routing/smart_routing_route_outcomes.csv` (~130 MB, synthetic `synthetic_v1`).
- **Preprocessing**: Filters `is_eligible == True`, sorts by `occurred_at`, and performs an 80th-percentile temporal train/validation split (`538,720` train rows, `134,678` validation rows across `35,976` routing decisions).
- **Features (`src/app/modules/smart_routing/features.py`, 17 total)**:
  - **11 Numeric**: `amount_log`, `order_attempts`, `hour_sin`, `hour_cos`, `health_score`, `route_success_rate_5m`, `route_success_rate_1h`, `route_error_rate_5m`, `route_p95_latency_ms`, `route_fee_bps`, `route_capacity_score`.
  - **6 Categorical**: `payment_method`, `currency`, `route_id`, `gateway`, `issuer_group`, `card_network`.

---

## 3. Model Architecture & Evaluation (`artifacts/smart_routing/routing_model.metrics.json`)

- **Model**: `sklearn.pipeline.Pipeline` combining:
  - `ColumnTransformer` (`"passthrough"` for numeric + `OneHotEncoder(handle_unknown="ignore", sparse_output=False)` for categorical)
  - `HistGradientBoostingClassifier(learning_rate=0.05, max_iter=250, max_leaf_nodes=31, l2_regularization=1.0, early_stopping=True, random_state=42)`
- **Validation Metrics (`model_version: "smart-routing-synthetic-20261114163504"`)**:
  - **Row ROC-AUC**: `0.637463`
  - **Row Average Precision**: `0.902766`
  - **Row Brier Score**: `0.120001`
  - **Policy Lift**: Recommended route expected success rate `88.66%` (`0.886647`) vs. original selected route `86.76%` (`0.867551`).

---

## 4. FastAPI Endpoint & Spring Boot Integration

- **Endpoint**: `POST /api/v1/routing/recommend` (`RoutingRecommendationRequest` -> `RoutingRecommendationResponse`).
  - Scores every `EligibleRoute` in `eligible_routes`, sorts descending by `predicted_success_probability`, and returns `recommended_route_id` + `ranked_routes`.
  - If the model artifact is unavailable (`is_placeholder=true`), sorts routes by `health_score`.
- **Spring Boot (`SmartRoutingService` + `SmartRoutingClient`)**:
  - Called by `PaymentServiceImpl` after fraud screening passes.
  - Persists `selectedRouteId`, `routingModelVersion`, and `routingPlaceholder` on `Payment`.
  - On Feign error/timeout, falls back to the highest `health_score` eligible route locally.

---

## 5. Smart Routing Distribution & Live Decisions

![Ops Risk Command Center — Smart Routing Distribution](<../screenshots/Screenshot%202026-11-27%20121842.png>)
![Ops Transactions — Smart Routing Model Version & Selected Route](<../screenshots/Screenshot%202026-11-27%20121931.png>)
