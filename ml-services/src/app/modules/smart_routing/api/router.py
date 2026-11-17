from fastapi import APIRouter

from app.modules.smart_routing.schemas import (
    RoutingRecommendationRequest,
    RoutingRecommendationResponse,
)
from app.modules.smart_routing.service import SmartRoutingService

router = APIRouter()
service = SmartRoutingService()


def load_routing_model() -> bool:
    return service.load_model()


@router.post("/recommend", response_model=RoutingRecommendationResponse)
async def recommend_route(
    request: RoutingRecommendationRequest,
) -> RoutingRecommendationResponse:
    return service.recommend(request)
