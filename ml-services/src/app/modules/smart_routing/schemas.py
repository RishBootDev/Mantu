from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class EligibleRoute(BaseModel):
    route_id: str
    gateway: str
    health_score: float = Field(ge=0, le=1)
    route_success_rate_5m: float = Field(default=0.85, ge=0, le=1)
    route_success_rate_1h: float = Field(default=0.85, ge=0, le=1)
    route_error_rate_5m: float = Field(default=0.02, ge=0, le=1)
    route_p95_latency_ms: int = Field(default=1000, ge=0)
    route_fee_bps: int = Field(default=200, ge=0)
    route_capacity_score: float = Field(default=0.9, ge=0, le=1)


class RoutingRecommendationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    transaction_id: str
    merchant_id: str | None = None
    amount: float = Field(gt=0)
    currency: str = Field(min_length=3, max_length=3)
    payment_method: str
    order_attempts: int = Field(default=0, ge=0)
    occurred_at: datetime | None = None
    issuer_group: str | None = None
    card_network: str | None = None
    eligible_routes: list[EligibleRoute] = Field(min_length=1)

    @field_validator("currency", "payment_method", "issuer_group", "card_network", mode="before")
    @classmethod
    def normalize_uppercase(cls, value: str | None) -> str | None:
        return value.strip().upper() if isinstance(value, str) else value


class RouteScore(BaseModel):
    route_id: str
    gateway: str
    predicted_success_probability: float = Field(ge=0, le=1)


class RoutingRecommendationResponse(BaseModel):
    transaction_id: str
    recommended_route_id: str | None
    ranked_routes: list[RouteScore]
    model_version: str
    is_placeholder: bool = True
    compatibility_warning: str | None = None
