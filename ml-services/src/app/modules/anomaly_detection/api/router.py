from fastapi import APIRouter

from app.modules.anomaly_detection.schemas import AnomalyScoreResponse, AnomalyWindowRequest
from app.modules.anomaly_detection.service import AnomalyDetectionService

router = APIRouter()
service = AnomalyDetectionService()


def load_anomaly_model() -> bool:
    return service.load_model()


@router.post("/score", response_model=AnomalyScoreResponse)
async def score_anomaly_window(request: AnomalyWindowRequest) -> AnomalyScoreResponse:
    """Score a closed merchant activity window; it is an investigation signal only."""
    return service.score_window(request)
