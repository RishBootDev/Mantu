from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pandas as pd

from app.core.config import Settings, get_settings
from app.modules.anomaly_detection.features import build_anomaly_features
from app.modules.anomaly_detection.schemas import AnomalyScoreResponse, AnomalyWindowRequest


@dataclass
class LoadedAnomalyModel:
    model: Any
    metadata: dict[str, Any]


class AnomalyDetectionService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._loaded_model: LoadedAnomalyModel | None = None
        self._load_error: str | None = None

    @property
    def is_ready(self) -> bool:
        return self._loaded_model is not None

    def load_model(self) -> bool:
        artifact_path = Path(self.settings.anomaly_model_artifact)
        if not artifact_path.is_file():
            self._load_error = f"Model artifact not found: {artifact_path}"
            return False
        try:
            import joblib

            artifact = joblib.load(artifact_path)
            if not isinstance(artifact, dict) or "model" not in artifact or "metadata" not in artifact:
                raise ValueError("artifact must contain 'model' and 'metadata'")
            self._loaded_model = LoadedAnomalyModel(artifact["model"], dict(artifact["metadata"]))
            self._load_error = None
            return True
        except Exception as exc:
            self._loaded_model = None
            self._load_error = f"Unable to load anomaly model: {exc}"
            return False

    def score_window(self, request: AnomalyWindowRequest) -> AnomalyScoreResponse:
        if self._loaded_model is None:
            self.load_model()
        if self._loaded_model is None:
            return AnomalyScoreResponse(
                merchant_id=request.merchant_id,
                window_start=request.window_start,
                window_end=request.window_end,
                anomaly_score=0.0,
                is_anomaly=False,
                severity="UNAVAILABLE",
                model_version="not-loaded",
                explanation=[self._load_error or "Model artifact is not configured."],
                compatibility_warning=self._load_error,
            )

        features = build_anomaly_features(request.model_dump())
        probability = float(
            self._loaded_model.model.predict_proba(pd.DataFrame([features]))[0][1]
        )
        threshold = float(self._loaded_model.metadata.get("alert_threshold", self.settings.anomaly_alert_threshold))
        is_anomaly = probability >= threshold
        return AnomalyScoreResponse(
            merchant_id=request.merchant_id,
            window_start=request.window_start,
            window_end=request.window_end,
            anomaly_score=round(max(0.0, min(1.0, probability)), 6),
            is_anomaly=is_anomaly,
            severity=self._severity(probability) if is_anomaly else "NORMAL",
            model_version=str(self._loaded_model.metadata.get("model_version", "unknown")),
            explanation=self._explain(request, features),
            is_placeholder=False,
            compatibility_warning=self._loaded_model.metadata.get("compatibility_warning"),
        )

    @staticmethod
    def _severity(score: float) -> str:
        if score >= 0.95:
            return "CRITICAL"
        if score >= 0.80:
            return "HIGH"
        return "MEDIUM"

    @staticmethod
    def _explain(request: AnomalyWindowRequest, features: dict[str, float]) -> list[str]:
        signals: list[str] = []
        if features["transaction_count_vs_baseline"] >= 3:
            signals.append("Transaction volume is at least three times the merchant baseline.")
        if features["failure_rate_delta"] >= 0.25:
            signals.append("Failure rate is materially above the merchant baseline.")
        if features["p95_latency_vs_baseline"] >= 3:
            signals.append("Authorization latency is at least three times the merchant baseline.")
        if features["retry_rate_delta"] >= 0.20:
            signals.append("Retry rate is materially above the merchant baseline.")
        if request.gateway_timeout_count > 0:
            signals.append("Gateway timeout events were observed in this window.")
        return signals or ["Score is based on current merchant activity compared with prior windows."]
