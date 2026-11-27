# 13 — Real-Time Transaction Anomaly Detection

---

## 1. Problem Statement
Detect abnormal merchant-level traffic spikes, sudden failure surges, latency degradations, or retry storms over rolling **5-minute tumbling windows** without adding latency to synchronous payment authorization.

---

## 2. Dataset, Windowing & Features (`training/anomaly_detection/train.py`)

- **Dataset**: `dataset/real-time-anomaly-detection/` (`payment_transaction_events.csv` ~262 MB, `anomaly_window_labels.csv` ~33.1 MB; `synthetic_anomaly_v1` covering `2,500` merchants, `394,081` transactions, `382,112` labelled windows, `6,522` anomalous).
- **Windowing & Baselines**:
  - Filters terminal events (`PAYMENT_CAPTURED`, `PAYMENT_FAILED`, `PAYMENT_CANCELLED`).
  - Aggregates per `(merchant_id_hash, 5-min window)` and computes prior rolling baselines via `shift(1).rolling(12, min_periods=3).mean()` (1-hour prior history).
  - 80th-percentile temporal split on `window_start` (`300,950` train windows, `75,237` validation windows, `1.563%` anomaly rate).
- **25 Engineered Features (`src/app/modules/anomaly_detection/features.py`)**:
  - Volume & Amount: `transaction_count_log`, `total_amount_log`, `mean_amount_log`, `max_amount_log`, `amount_stddev_log`, `p95_amount_log`
  - Rates & Diversity: `failure_rate`, `retry_rate`, `unique_customers_log`, `unique_routes`, `payment_method_entropy`
  - Latency & Route Health: `mean_latency_log`, `p95_latency_log`, `gateway_timeout_rate`, `issuer_decline_rate`, `average_route_health_score`, `average_route_success_rate_5m`, `average_route_error_rate_5m`
  - Baseline Deltas: `transaction_count_vs_baseline`, `total_amount_vs_baseline`, `failure_rate_delta`, `p95_latency_vs_baseline`, `retry_rate_delta`
  - Time: `hour_sin`, `hour_cos`

---

## 3. Model, Thresholding & Evaluation (`artifacts/anomaly_detection/anomaly_model.metrics.json`)

- **Model**: `HistGradientBoostingClassifier(learning_rate=0.05, max_iter=250, max_leaf_nodes=31, l2_regularization=2.0, early_stopping=True, random_state=42)` trained with class-imbalance `sample_weight` (`(N - pos) / pos`).
- **Threshold Selection**: Maximizes F1 on the validation Precision-Recall curve -> **`alert_threshold = 0.902627`** (stored in model metadata).
- **Severity Tiers**:
  - `>= 0.95` -> `CRITICAL`
  - `>= 0.80` -> `HIGH`
  - `>= alert_threshold` -> `MEDIUM`
  - Otherwise -> `NORMAL`
- **Validation Metrics (`model_version: "anomaly-window-synthetic-20261116054536"`)**:
  - **ROC-AUC**: `0.908561`
  - **Average Precision**: `0.461096`
  - **At Alert Threshold (`0.902627`)**: Precision `0.455422`, Recall `0.482143`, F1 `0.468401`.

---

## 4. Real-Time Kafka Worker & Ops Dashboard Integration

1. **`AnomalyWorker` (`ml-services/src/app/workers/anomaly_worker.py`)**:
   - Consumes `payment.transaction.created` via `aiokafka` (`group_id="mantu-ml-workers"`, `enable_auto_commit=False`).
   - Buffers terminal events into 300-second `MerchantWindow` buckets and maintains a 12-window baseline deque per merchant in memory.
   - Scores closed windows via `AnomalyDetectionService.score_window()` (also exposed over REST at `POST /api/v1/anomalies/score`).
   - When `is_anomaly=True`, publishes `TRANSACTION_ANOMALY_DETECTED` to `ml.transaction.anomaly.detected`.
2. **`operations-service` (`AnomalyAlertKafkaConsumer`)**:
   - Consumes `ml.transaction.anomaly.detected` and persists `AnomalyAlert` (deduplicated by `source_event_id`).
3. **Ops Risk Dashboard (`/ops/risk`)**:
   - `OpsRiskDashboardPage.tsx` calls `GET /internal/ops/risk-dashboard` (and `/internal/anomaly-alerts`) to display flagged windows, severity, and explanations.
