from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.core.config import Settings, get_settings
from app.modules.fraud_detection.features import build_fraud_features, feature_vector
from app.modules.fraud_detection.schemas import FraudPredictionRequest, FraudPredictionResponse


@dataclass
class LoadedFraudModel:
    model: Any
    metadata: dict[str, Any]


class FraudDetectionService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._loaded_model: LoadedFraudModel | None = None
        self._load_error: str | None = None

    @property
    def is_ready(self) -> bool:
        return self._loaded_model is not None

    def load_model(self) -> bool:

        artifact_path = Path(self.settings.fraud_model_artifact)
        if not artifact_path.is_file():
            self._load_error = f"Model artifact not found: {artifact_path}"
            return False
        try:
            import joblib

            artifact = joblib.load(artifact_path)
            if not isinstance(artifact, dict) or "model" not in artifact or "metadata" not in artifact:
                raise ValueError("artifact must contain 'model' and 'metadata'")
            self._loaded_model = LoadedFraudModel(
                model=artifact["model"], metadata=dict(artifact["metadata"])
            )
            self._load_error = None
            return True
        except Exception as exc:
            self._loaded_model = None
            self._load_error = f"Unable to load fraud model: {exc}"
            return False

    def predict(self, request: FraudPredictionRequest) -> FraudPredictionResponse:
        if self._loaded_model is None:
            self.load_model()
        if self._loaded_model is None:
            return FraudPredictionResponse(
                transaction_id=request.transaction_id,
                fraud_probability=0.0,
                risk_level="UNAVAILABLE",
                model_version="not-loaded",
                explanation=[self._load_error or "Model artifact is not configured."],
                is_placeholder=True,
            )

        features = build_fraud_features(request.model_dump())
        probability = float(self._loaded_model.model.predict_proba([feature_vector(features)])[0][1])
        probability = max(0.0, min(1.0, probability))
        if probability >= self.settings.fraud_high_risk_threshold:
            risk_level = "HIGH"
        elif probability >= self.settings.fraud_review_threshold:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        return FraudPredictionResponse(
            transaction_id=request.transaction_id,
            fraud_probability=round(probability, 6),
            risk_level=risk_level,
            model_version=str(self._loaded_model.metadata.get("model_version", "unknown")),
            explanation=self._explain(request, features),
            is_placeholder=False,
            compatibility_warning=self._loaded_model.metadata.get("compatibility_warning"),
        )

    @staticmethod
    def _explain(request: FraudPredictionRequest, features: dict[str, float]) -> list[str]:
        signals: list[str] = []
        if request.transactions_last_10m >= 5:
            signals.append(f"High recent velocity: {request.transactions_last_10m} attempts in 10 minutes.")
        if request.order_attempts >= 3:
            signals.append(f"Repeated order attempts: {request.order_attempts}.")
        if features["country_mismatch"]:
            signals.append("IP country differs from billing country.")
        if request.amount >= 10_000:
            signals.append("High transaction amount supplied for review.")
        if not signals:
            signals.append("Score is based on amount, time, velocity, retry, and available telemetry signals.")
        return signals
