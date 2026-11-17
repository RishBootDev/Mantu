from fastapi import APIRouter, status

from app.modules.fraud_detection.schemas import FraudPredictionRequest, FraudPredictionResponse
from app.modules.fraud_detection.service import FraudDetectionService

router = APIRouter()
service = FraudDetectionService()


def load_fraud_model() -> bool:
    return service.load_model()


@router.post(
    "/predict",
    response_model=FraudPredictionResponse,
    status_code=status.HTTP_200_OK,
)
async def predict_fraud(
    request: FraudPredictionRequest,
) -> FraudPredictionResponse:
    return service.predict(request)
