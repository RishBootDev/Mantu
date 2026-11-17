from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AnomalyWindowRequest(BaseModel):

    model_config = ConfigDict(extra="forbid")

    merchant_id: str = Field(min_length=1)
    window_start: datetime
    window_end: datetime
    transaction_count: int = Field(ge=0)
    success_count: int = Field(ge=0)
    failure_count: int = Field(ge=0)
    total_amount: float = Field(ge=0)
    mean_amount: float = Field(ge=0)
    max_amount: float = Field(ge=0)
    amount_stddev: float = Field(default=0, ge=0)
    p95_amount: float = Field(ge=0)
    retry_count: int = Field(default=0, ge=0)
    unique_customers: int = Field(default=0, ge=0)
    unique_routes: int = Field(default=0, ge=0)
    payment_method_entropy: float = Field(default=0, ge=0)
    mean_authorization_latency_ms: float = Field(default=0, ge=0)
    p95_authorization_latency_ms: float = Field(default=0, ge=0)
    gateway_timeout_count: int = Field(default=0, ge=0)
    issuer_decline_count: int = Field(default=0, ge=0)
    average_route_health_score: float = Field(default=0, ge=0, le=1)
    average_route_success_rate_5m: float = Field(default=0, ge=0, le=1)
    average_route_error_rate_5m: float = Field(default=0, ge=0, le=1)
    baseline_transaction_count: float = Field(default=0, ge=0)
    baseline_total_amount: float = Field(default=0, ge=0)
    baseline_failure_rate: float = Field(default=0, ge=0, le=1)
    baseline_p95_latency_ms: float = Field(default=0, ge=0)
    baseline_retry_rate: float = Field(default=0, ge=0, le=1)


class AnomalyScoreResponse(BaseModel):
    merchant_id: str
    window_start: datetime
    window_end: datetime
    anomaly_score: float = Field(ge=0, le=1)
    is_anomaly: bool
    severity: str
    model_version: str
    explanation: list[str] = Field(default_factory=list)
    is_placeholder: bool = True
    compatibility_warning: str | None = None
