from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pandas as pd

from app.core.config import Settings, get_settings
from app.modules.smart_routing.features import build_route_feature_row
from app.modules.smart_routing.schemas import (
    RouteScore,
    RoutingRecommendationRequest,
    RoutingRecommendationResponse,
)


@dataclass
class LoadedRoutingModel:
    model: Any
    metadata: dict[str, Any]


class SmartRoutingService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._loaded_model: LoadedRoutingModel | None = None
        self._load_error: str | None = None

    @property
    def is_ready(self) -> bool:
        return self._loaded_model is not None

    def load_model(self) -> bool:
        artifact_path = Path(self.settings.routing_model_artifact)
        if not artifact_path.is_file():
            self._load_error = f"Model artifact not found: {artifact_path}"
            return False
        try:
            import joblib

            artifact = joblib.load(artifact_path)
            if not isinstance(artifact, dict) or "model" not in artifact or "metadata" not in artifact:
                raise ValueError("artifact must contain 'model' and 'metadata'")
            self._loaded_model = LoadedRoutingModel(artifact["model"], dict(artifact["metadata"]))
            self._load_error = None
            return True
        except Exception as exc:
            self._loaded_model = None
            self._load_error = f"Unable to load routing model: {exc}"
            return False

    def recommend(
        self, request: RoutingRecommendationRequest
    ) -> RoutingRecommendationResponse:
        if self._loaded_model is None:
            self.load_model()
        if self._loaded_model is None:
            return self._health_score_fallback(request)

        transaction = request.model_dump(exclude={"eligible_routes"})
        feature_rows = [
            build_route_feature_row(transaction, route.model_dump()) for route in request.eligible_routes
        ]
        probabilities = self._loaded_model.model.predict_proba(pd.DataFrame(feature_rows))[:, 1]
        scores = [
            RouteScore(
                route_id=route.route_id,
                gateway=route.gateway,
                predicted_success_probability=round(float(probability), 6),
            )
            for route, probability in zip(request.eligible_routes, probabilities, strict=True)
        ]
        scores.sort(key=lambda route: route.predicted_success_probability, reverse=True)
        return RoutingRecommendationResponse(
            transaction_id=request.transaction_id,
            recommended_route_id=scores[0].route_id,
            ranked_routes=scores,
            model_version=str(self._loaded_model.metadata.get("model_version", "unknown")),
            is_placeholder=False,
            compatibility_warning=self._loaded_model.metadata.get("compatibility_warning"),
        )

    def _health_score_fallback(
        self, request: RoutingRecommendationRequest
    ) -> RoutingRecommendationResponse:
        ranked = sorted(
            request.eligible_routes,
            key=lambda route: route.health_score,
            reverse=True,
        )
        scores = [
            RouteScore(
                route_id=route.route_id,
                gateway=route.gateway,
                predicted_success_probability=route.health_score,
            )
            for route in ranked
        ]
        return RoutingRecommendationResponse(
            transaction_id=request.transaction_id,
            recommended_route_id=scores[0].route_id if scores else None,
            ranked_routes=scores,
            model_version="placeholder-health-score",
            is_placeholder=True,
            compatibility_warning=self._load_error,
        )
