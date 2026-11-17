from fastapi import APIRouter

from app.modules.anomaly_detection.api.router import router as anomaly_router
from app.modules.fraud_detection.api.router import router as fraud_router
from app.modules.smart_routing.api.router import router as routing_router

api_router = APIRouter()
api_router.include_router(fraud_router, prefix="/fraud", tags=["fraud-detection"])
api_router.include_router(routing_router, prefix="/routing", tags=["smart-routing"])
api_router.include_router(anomaly_router, prefix="/anomalies", tags=["anomaly-detection"])
