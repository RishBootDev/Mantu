# 11 — Intelligent Fraud Detection

---

## 1. Problem Statement
Evaluate incoming payment attempts in real time to estimate fraud probability (`[0, 1]`) and assign a risk tier (`LOW`, `MEDIUM`, `HIGH`), enabling `payment-service` either to audit risk passively (`OBSERVE` mode) or block high-risk transactions before gateway routing (`BLOCK` mode).

---

## 2. Dataset, Feature Engineering & Training (`training/fraud_detection/train.py`)

- **Dataset**: IEEE-CIS Fraud Detection (`dataset/ieee-fraud-detection/train_transaction.csv` ~683 MB, `train_identity.csv` ~26.5 MB).
- **Columns Used**: `TransactionID`, `isFraud`, `TransactionDT`, `TransactionAmt`, `C1`, `D1`, `P_emaildomain`, `addr1`, `card1`, and `DeviceType`.
- **Temporal Split**: 80th percentile of `TransactionDT` (`<=` training, `>` validation), stratified-capped to `250,000` train rows and `100,000` validation rows (`random_state=42`).
- **Engineered Features (`src/app/modules/fraud_detection/features.py`, 10 features)**:
  1. `amount_log` (`log1p(amount)`)
  2. `hour_sin` & `hour_cos` (cyclical encoding of transaction hour)
  3. `velocity_log` (`log1p(transactions_last_10m)`)
  4. `attempts_log` (`log1p(order_attempts)`)
  5. `has_email`, `has_device`, `has_ip_country`, `has_card_token` (binary presence flags)
  6. `country_mismatch` (`1.0` if `ip_country != billing_country` when both present; `0.0` during IEEE training)

---

## 3. Model Architecture & Evaluation (`artifacts/fraud_detection/fraud_model.metrics.json`)

- **Model**: `sklearn.ensemble.HistGradientBoostingClassifier`
- **Hyperparameters**: `learning_rate=0.05`, `max_iter=250`, `max_leaf_nodes=31`, `l2_regularization=1.0`, `early_stopping=True`, `random_state=42`.
- **Validation Metrics (`model_version: "ieee-baseline-20261114145707"`)**:
  - **ROC-AUC**: `0.803152`
  - **Average Precision (PR-AUC)**: `0.332687`
  - **Brier Score**: `0.026818`
  - **Validation Fraud Rate**: `3.441%` (`100,000` rows)
- **Serialization**: Stored via `joblib.dump({"model": model, "metadata": metadata})` in `artifacts/fraud_detection/fraud_model.joblib`.

---

## 4. Inference, Risk Scoring & Explainability (`POST /api/v1/fraud/predict`)

- **Request (`FraudPredictionRequest`, `extra="forbid"`)**: `transaction_id`, `merchant_id`, `amount`, `currency`, `payment_method`, plus optional `customer_id`, `order_attempts`, `occurred_at`, `device_id`, `ip_country`, `billing_country`, `email_domain`, `card_token_id`, `transactions_last_10m`.
- **Risk Thresholds**:
  - `>= 0.65` -> `HIGH`
  - `>= 0.20` -> `MEDIUM`
  - `< 0.20` -> `LOW`
- **Explainability**: Rule-based `FraudDetectionService._explain()` generates human-readable reasons when `transactions_last_10m >= 5`, `order_attempts >= 3`, `country_mismatch == 1`, or `amount >= 10,000` (SHAP is not implemented).

---

## 5. Spring Boot Integration (`payment-service`)

1. `FraudScreeningService.screen()` computes real 10-minute customer velocity via `PaymentRepository.countRecentByCustomer(customerId, LocalDateTime.now().minusMinutes(10))`.
2. Extracts `device_id`, `ip_country`, `billing_country`, and `email_domain` from `payment.getMethodDetails()` (forwarded from Deskwell checkout telemetry).
3. Calls `FraudDetectionClient.predict(...)` (`@FeignClient(name = "ml-services", path = "/api/v1/fraud")`).
4. Persists `fraudProbability`, `fraudRiskLevel`, `fraudModelVersion`, and `fraudPlaceholder` on the `Payment` entity.
5. **Enforcement (`fraud.detection.enforcement-mode`)**:
   - `OBSERVE` (default in `application.yaml`): Logs/persists risk score and allows payment to proceed to Smart Routing.
   - `BLOCK`: Rejects `HIGH` risk payments via `PaymentAuthorizationRecorder.compensateAuthorizationFailure` with `FRAUD_BLOCKED` before calling any payment adapter.

---

## 6. Live Ops Fraud Screening Inspection

![Ops Transaction Audit — Captured with Live ML Fraud Score (2.56% LOW)](<../screenshots/Screenshot%202026-11-27%20122315.png>)
![Ops Transaction Audit — Failed Payment with Fraud Score (11.60% LOW)](<../screenshots/Screenshot%202026-11-27%20122451.png>)
