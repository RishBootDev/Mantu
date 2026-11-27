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
from sklearn.metrics import average_precision_score, brier_score_loss, roc_auc_score

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from app.modules.fraud_detection.features import FEATURE_NAMES              


SOURCE_COLUMNS = [
    "TransactionID",
    "isFraud",
    "TransactionDT",
    "TransactionAmt",
    "C1",
    "D1",
    "P_emaildomain",
    "addr1",
    "card1",
]


def _sample(frame: pd.DataFrame, maximum: int, seed: int) -> pd.DataFrame:

    if len(frame) <= maximum:
        return frame
    positives = frame[frame["isFraud"] == 1]
    negatives = frame[frame["isFraud"] == 0]
    positive_count = min(len(positives), max(1, round(maximum * len(positives) / len(frame))))
    negative_count = maximum - positive_count
    return pd.concat(
        [
            positives.sample(positive_count, random_state=seed),
            negatives.sample(negative_count, random_state=seed),
        ],
        ignore_index=True,
    ).sample(frac=1, random_state=seed, ignore_index=True)


def make_ieee_features(frame: pd.DataFrame, device_transaction_ids: set[int]) -> np.ndarray:

    amount = pd.to_numeric(frame["TransactionAmt"], errors="coerce").fillna(0).clip(lower=0)
    seconds = pd.to_numeric(frame["TransactionDT"], errors="coerce").fillna(0)
    hour = (seconds / 3600.0) % 24
    velocity = pd.to_numeric(frame["C1"], errors="coerce").fillna(0).clip(lower=0)
    attempts = pd.to_numeric(frame["D1"], errors="coerce").fillna(0).clip(lower=0)
    transaction_ids = frame["TransactionID"].astype("int64")

    columns = {
        "amount_log": np.log1p(amount),
        "hour_sin": np.sin(2 * np.pi * hour / 24),
        "hour_cos": np.cos(2 * np.pi * hour / 24),
        "velocity_log": np.log1p(velocity),
        "attempts_log": np.log1p(attempts),
        "has_email": frame["P_emaildomain"].notna().astype(float),
        "has_device": transaction_ids.isin(device_transaction_ids).astype(float),
        "has_ip_country": frame["addr1"].notna().astype(float),
        "has_card_token": frame["card1"].notna().astype(float),
         "country_mismatch": np.zeros(len(frame), dtype=float),
    }
    return np.column_stack([columns[name] for name in FEATURE_NAMES]).astype("float64")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--transactions",
        type=Path,
        default=PROJECT_ROOT / "dataset" / "ieee-fraud-detection" / "train_transaction.csv",
    )
    parser.add_argument(
        "--identity",
        type=Path,
        default=PROJECT_ROOT / "dataset" / "ieee-fraud-detection" / "train_identity.csv",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=PROJECT_ROOT / "artifacts" / "fraud_detection" / "fraud_model.joblib",
    )
    parser.add_argument("--max-train-rows", type=int, default=250_000)
    parser.add_argument("--max-validation-rows", type=int, default=100_000)
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.transactions.is_file() or not args.identity.is_file():
        raise FileNotFoundError("Both IEEE train_transaction.csv and train_identity.csv are required.")

    transactions = pd.read_csv(args.transactions, usecols=SOURCE_COLUMNS)
    identities = pd.read_csv(args.identity, usecols=["TransactionID", "DeviceType"])
    device_transaction_ids = set(
        identities.loc[identities["DeviceType"].notna(), "TransactionID"].astype("int64")
    )

    split_time = transactions["TransactionDT"].quantile(0.80)
    train_frame = transactions[transactions["TransactionDT"] <= split_time]
    validation_frame = transactions[transactions["TransactionDT"] > split_time]
    train_frame = _sample(train_frame, args.max_train_rows, args.seed)
    validation_frame = _sample(validation_frame, args.max_validation_rows, args.seed + 1)

    x_train = make_ieee_features(train_frame, device_transaction_ids)
    y_train = train_frame["isFraud"].astype(int).to_numpy()
    x_validation = make_ieee_features(validation_frame, device_transaction_ids)
    y_validation = validation_frame["isFraud"].astype(int).to_numpy()

    model = HistGradientBoostingClassifier(
        learning_rate=0.05,
        max_iter=250,
        max_leaf_nodes=31,
        l2_regularization=1.0,
        early_stopping=True,
        random_state=args.seed,
    )
    model.fit(x_train, y_train)
    probabilities = model.predict_proba(x_validation)[:, 1]

    trained_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    metrics = {
        "roc_auc": round(float(roc_auc_score(y_validation, probabilities)), 6),
        "average_precision": round(float(average_precision_score(y_validation, probabilities)), 6),
        "brier_score": round(float(brier_score_loss(y_validation, probabilities)), 6),
        "train_rows": int(len(train_frame)),
        "validation_rows": int(len(validation_frame)),
        "validation_fraud_rate": round(float(y_validation.mean()), 6),
    }
    model_version = f"ieee-baseline-{datetime.now(timezone.utc):%Y%m%d%H%M%S}"
    metadata = {
        "model_version": model_version,
        "trained_at": trained_at,
        "dataset": "IEEE-CIS Fraud Detection train_transaction/train_identity",
        "feature_names": list(FEATURE_NAMES),
        "metrics": metrics,
        "compatibility_warning": (
            "IEEE-CIS uses anonymized card and device fields, not Mantu production labels. "
            "Treat this as an integration baseline; recalibrate and retrain on reviewed Mantu outcomes "
            "before using it for payment decisions."
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
