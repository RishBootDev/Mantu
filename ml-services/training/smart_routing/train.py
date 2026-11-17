from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import average_precision_score, brier_score_loss, roc_auc_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from app.modules.smart_routing.features import (  # noqa: E402
    CATEGORICAL_FEATURE_COLUMNS,
    NUMERIC_FEATURE_COLUMNS,
    build_training_features,
)

REQUIRED_COLUMNS = {
    "decision_id",
    "occurred_at",
    "authorization_success",
    "is_eligible",
    "selected_route",
    "data_source",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dataset",
        type=Path,
        default=PROJECT_ROOT / "dataset" / "smart-routing" / "smart_routing_route_outcomes.csv",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=PROJECT_ROOT / "artifacts" / "smart_routing" / "routing_model.joblib",
    )
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


def validate_dataset(frame: pd.DataFrame) -> None:
    missing = REQUIRED_COLUMNS.difference(frame.columns)
    if missing:
        raise ValueError(f"Dataset is missing required columns: {sorted(missing)}")
    if not frame["authorization_success"].isin([0, 1]).all():
        raise ValueError("authorization_success must contain only 0 or 1")
    route_counts = frame.groupby("decision_id").size()
    if route_counts.min() < 1:
        raise ValueError("Every decision must contain at least one route")


def main() -> None:
    args = parse_args()
    if not args.dataset.is_file():
        raise FileNotFoundError(f"Routing dataset not found: {args.dataset}")

    frame = pd.read_csv(args.dataset)
    validate_dataset(frame)
    frame = frame[frame["is_eligible"].astype(bool)].copy()
    frame["occurred_at"] = pd.to_datetime(frame["occurred_at"], utc=True)
    frame.sort_values("occurred_at", inplace=True)

    split_at = frame["occurred_at"].quantile(0.80)
    train_frame = frame[frame["occurred_at"] <= split_at].copy()
    validation_frame = frame[frame["occurred_at"] > split_at].copy()
    x_train = build_training_features(train_frame)
    y_train = train_frame["authorization_success"].astype(int)
    x_validation = build_training_features(validation_frame)
    y_validation = validation_frame["authorization_success"].astype(int)

    preprocessing = ColumnTransformer(
        transformers=[
            ("numeric", "passthrough", list(NUMERIC_FEATURE_COLUMNS)),
            (
                "categorical",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                list(CATEGORICAL_FEATURE_COLUMNS),
            ),
        ],
        verbose_feature_names_out=False,
    )
    model = Pipeline(
        steps=[
            ("preprocessing", preprocessing),
            (
                "classifier",
                HistGradientBoostingClassifier(
                    learning_rate=0.05,
                    max_iter=250,
                    max_leaf_nodes=31,
                    l2_regularization=1.0,
                    early_stopping=True,
                    random_state=args.seed,
                ),
            ),
        ]
    )
    model.fit(x_train, y_train)
    probabilities = model.predict_proba(x_validation)[:, 1]

    ranked_validation = validation_frame.loc[
        :, ["decision_id", "authorization_success", "selected_route"]
    ].copy()
    ranked_validation["predicted_success_probability"] = probabilities
    recommended = (
        ranked_validation.sort_values(
            ["decision_id", "predicted_success_probability"], ascending=[True, False]
        )
        .groupby("decision_id", as_index=False)
        .first()
    )
    originally_selected = ranked_validation[ranked_validation["selected_route"].astype(bool)]
    metrics = {
        "row_roc_auc": round(float(roc_auc_score(y_validation, probabilities)), 6),
        "row_average_precision": round(float(average_precision_score(y_validation, probabilities)), 6),
        "row_brier_score": round(float(brier_score_loss(y_validation, probabilities)), 6),
        "recommended_route_success_rate": round(
            float(recommended["authorization_success"].mean()), 6
        ),
        "original_selected_route_success_rate": round(
            float(originally_selected["authorization_success"].mean()), 6
        ),
        "train_rows": int(len(train_frame)),
        "validation_rows": int(len(validation_frame)),
        "validation_decisions": int(validation_frame["decision_id"].nunique()),
    }
    model_version = f"smart-routing-synthetic-{datetime.now(timezone.utc):%Y%m%d%H%M%S}"
    metadata = {
        "model_version": model_version,
        "trained_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "dataset": args.dataset.name,
        "data_source": sorted(frame["data_source"].dropna().astype(str).unique().tolist()),
        "metrics": metrics,
        "compatibility_warning": (
            "Trained on synthetic route outcomes. Use it for integration and demo routing only; "
            "retrain on observed production route outcomes before production promotion."
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
