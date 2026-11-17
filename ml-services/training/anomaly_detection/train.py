from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import average_precision_score, precision_recall_curve, roc_auc_score

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from app.modules.anomaly_detection.features import FEATURE_COLUMNS, feature_frame  # noqa: E402

EVENT_COLUMNS = [
    "event_type",
    "occurred_at",
    "merchant_id_hash",
    "customer_id_hash",
    "payment_method",
    "selected_route_id",
    "amount",
    "order_attempts",
    "authorization_latency_ms",
    "result",
    "failure_category",
    "route_health_score",
    "route_success_rate_5m",
    "route_error_rate_5m",
]
TERMINAL_EVENTS = {"PAYMENT_CAPTURED", "PAYMENT_FAILED", "PAYMENT_CANCELLED"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    data_dir = PROJECT_ROOT / "dataset" / "real-time-anomaly-detection"
    parser.add_argument("--events", type=Path, default=data_dir / "payment_transaction_events.csv")
    parser.add_argument("--labels", type=Path, default=data_dir / "anomaly_window_labels.csv")
    parser.add_argument(
        "--output",
        type=Path,
        default=PROJECT_ROOT / "artifacts" / "anomaly_detection" / "anomaly_model.joblib",
    )
    parser.add_argument("--baseline-windows", type=int, default=12)
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


def entropy(values: pd.Series) -> float:
    shares = values.value_counts(normalize=True)
    return float(-(shares * np.log(shares)).sum()) if not shares.empty else 0.0


def p95(values: pd.Series) -> float:
    return float(values.quantile(0.95)) if not values.empty else 0.0


def aggregate_events(events_path: Path) -> pd.DataFrame:
    frame = pd.read_csv(events_path, usecols=EVENT_COLUMNS)
    frame = frame[frame["event_type"].isin(TERMINAL_EVENTS)].copy()
    frame["occurred_at"] = pd.to_datetime(frame["occurred_at"], utc=True)
    frame["window_start"] = frame["occurred_at"].dt.floor("5min")
    frame["amount"] = pd.to_numeric(frame["amount"], errors="coerce").fillna(0)
    frame["authorization_latency_ms"] = pd.to_numeric(
        frame["authorization_latency_ms"], errors="coerce"
    ).fillna(0)
    frame["is_success"] = frame["result"].eq("SUCCESS").astype(int)
    frame["is_failure"] = frame["result"].eq("FAILURE").astype(int)
    frame["is_retry"] = frame["order_attempts"].fillna(0).ge(3).astype(int)
    frame["is_gateway_timeout"] = frame["failure_category"].eq("GATEWAY_TIMEOUT").astype(int)
    frame["is_issuer_decline"] = frame["failure_category"].eq("BANK_DECLINED").astype(int)

    grouped = frame.groupby(["merchant_id_hash", "window_start"], sort=True, observed=True)
    windows = grouped.agg(
        transaction_count=("amount", "size"),
        success_count=("is_success", "sum"),
        failure_count=("is_failure", "sum"),
        total_amount=("amount", "sum"),
        mean_amount=("amount", "mean"),
        max_amount=("amount", "max"),
        amount_stddev=("amount", "std"),
        p95_amount=("amount", p95),
        retry_count=("is_retry", "sum"),
        unique_customers=("customer_id_hash", "nunique"),
        unique_routes=("selected_route_id", "nunique"),
        mean_authorization_latency_ms=("authorization_latency_ms", "mean"),
        p95_authorization_latency_ms=("authorization_latency_ms", p95),
        gateway_timeout_count=("is_gateway_timeout", "sum"),
        issuer_decline_count=("is_issuer_decline", "sum"),
        average_route_health_score=("route_health_score", "mean"),
        average_route_success_rate_5m=("route_success_rate_5m", "mean"),
        average_route_error_rate_5m=("route_error_rate_5m", "mean"),
    ).reset_index()
    method_entropy = grouped["payment_method"].apply(entropy).rename("payment_method_entropy")
    windows = windows.merge(method_entropy, on=["merchant_id_hash", "window_start"], how="left")
    return windows.fillna(0)


def add_prior_baselines(windows: pd.DataFrame, baseline_windows: int) -> pd.DataFrame:
    windows = windows.sort_values(["merchant_id_hash", "window_start"]).copy()
    windows["failure_rate"] = windows["failure_count"] / windows["transaction_count"].clip(lower=1)
    windows["retry_rate"] = windows["retry_count"] / windows["transaction_count"].clip(lower=1)
    source_columns = {
        "baseline_transaction_count": "transaction_count",
        "baseline_total_amount": "total_amount",
        "baseline_failure_rate": "failure_rate",
        "baseline_p95_latency_ms": "p95_authorization_latency_ms",
        "baseline_retry_rate": "retry_rate",
    }
    grouped = windows.groupby("merchant_id_hash", sort=False)
    for baseline_column, source_column in source_columns.items():
        windows[baseline_column] = grouped[source_column].transform(
            lambda series: series.shift(1).rolling(baseline_windows, min_periods=3).mean()
        )
    for column in source_columns:
        windows[column] = windows[column].fillna(0)
    return windows.drop(columns=["failure_rate", "retry_rate"])


def load_labels(labels_path: Path) -> pd.DataFrame:
    labels = pd.read_csv(labels_path, usecols=["window_start", "merchant_id_hash", "is_anomaly"])
    labels["window_start"] = pd.to_datetime(labels["window_start"], utc=True)
    labels["is_anomaly"] = labels["is_anomaly"].astype(int)
    return labels


def alert_threshold(labels: np.ndarray, probabilities: np.ndarray) -> tuple[float, dict[str, float]]:
    precision, recall, thresholds = precision_recall_curve(labels, probabilities)
    f1 = (2 * precision * recall) / np.maximum(precision + recall, 1e-12)
    index = int(np.nanargmax(f1[:-1]))
    threshold = float(thresholds[index])
    return threshold, {
        "precision": round(float(precision[index]), 6),
        "recall": round(float(recall[index]), 6),
        "f1": round(float(f1[index]), 6),
    }


def main() -> None:
    args = parse_args()
    if not args.events.is_file() or not args.labels.is_file():
        raise FileNotFoundError("Both payment_transaction_events.csv and anomaly_window_labels.csv are required.")

    windows = add_prior_baselines(aggregate_events(args.events), args.baseline_windows)
    labels = load_labels(args.labels)
    frame = windows.merge(labels, on=["merchant_id_hash", "window_start"], how="left")
    frame["is_anomaly"] = frame["is_anomaly"].fillna(0).astype(int)
    split_at = frame["window_start"].quantile(0.80)
    train_frame = frame[frame["window_start"] <= split_at].copy()
    validation_frame = frame[frame["window_start"] > split_at].copy()
    x_train = feature_frame(train_frame)
    y_train = train_frame["is_anomaly"].to_numpy()
    x_validation = feature_frame(validation_frame)
    y_validation = validation_frame["is_anomaly"].to_numpy()
    positive_weight = max(1.0, (len(y_train) - y_train.sum()) / max(y_train.sum(), 1))
    sample_weight = np.where(y_train == 1, positive_weight, 1.0)

    model = HistGradientBoostingClassifier(
        learning_rate=0.05,
        max_iter=250,
        max_leaf_nodes=31,
        l2_regularization=2.0,
        early_stopping=True,
        random_state=args.seed,
    )
    model.fit(x_train, y_train, sample_weight=sample_weight)
    probabilities = model.predict_proba(x_validation)[:, 1]
    threshold, threshold_metrics = alert_threshold(y_validation, probabilities)
    metrics = {
        "roc_auc": round(float(roc_auc_score(y_validation, probabilities)), 6),
        "average_precision": round(float(average_precision_score(y_validation, probabilities)), 6),
        "alert_threshold": round(threshold, 6),
        "at_alert_threshold": threshold_metrics,
        "train_windows": int(len(train_frame)),
        "validation_windows": int(len(validation_frame)),
        "validation_anomaly_rate": round(float(y_validation.mean()), 6),
    }
    model_version = f"anomaly-window-synthetic-{datetime.now(timezone.utc):%Y%m%d%H%M%S}"
    metadata = {
        "model_version": model_version,
        "trained_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "feature_columns": list(FEATURE_COLUMNS),
        "dataset": {"events": args.events.name, "labels": args.labels.name},
        "alert_threshold": threshold,
        "metrics": metrics,
        "compatibility_warning": (
            "Trained using synthetic merchant-window labels. Use this for integration and demo alerts only; "
            "retrain and calibrate with reviewed production incidents before operational enforcement."
        ),
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "metadata": metadata}, args.output)
    args.output.with_suffix(".metrics.json").write_text(
        json.dumps(metadata, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps({"artifact": str(args.output), "model_version": model_version, **metrics}, indent=2))


if __name__ == "__main__":
    main()
