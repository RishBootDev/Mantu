from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_BASE_DIR = Path(__file__).resolve().parents[3]
_ROOT_DIR = Path(__file__).resolve().parents[4]


class Settings(BaseSettings):

    app_name: str = "Mantu ML Services"
    app_env: str = "local"
    log_level: str = "INFO"
    api_v1_prefix: str = "/api/v1"
    service_port: int = 8100

    eureka_enabled: bool = True
    eureka_server_url: str = "http://localhost:8761/eureka/"
    eureka_app_name: str = "ml-services"
    eureka_instance_host: str | None = None

    kafka_bootstrap_servers: str = "localhost:19092"
    kafka_consumer_group: str = "mantu-ml-workers"
    kafka_anomaly_topic: str = "payment.transaction.created"
    kafka_anomaly_result_topic: str = "ml.transaction.anomaly.detected"
    kafka_kyc_topic: str = "merchant.kyc.document.uploaded"
    anomaly_window_seconds: int = 300
    anomaly_baseline_windows: int = 12

    minio_endpoint: str = "localhost:9000"
    minio_bucket: str = "merchant-kyc-documents"

    model_artifacts_dir: str = "artifacts"
    fraud_model_artifact: str = "artifacts/fraud_detection/fraud_model.joblib"
    fraud_review_threshold: float = 0.20
    fraud_high_risk_threshold: float = 0.65
    routing_model_artifact: str = "artifacts/smart_routing/routing_model.joblib"
    anomaly_model_artifact: str = "artifacts/anomaly_detection/anomaly_model.joblib"
    anomaly_alert_threshold: float = 0.50

    model_config = SettingsConfigDict(
        env_file=(
            _BASE_DIR / ".env",
            _ROOT_DIR / ".env",
            ".env",
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
