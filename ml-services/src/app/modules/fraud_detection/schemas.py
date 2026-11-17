from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class FraudPredictionRequest(BaseModel):

    model_config = ConfigDict(extra="forbid")

    transaction_id: str
    merchant_id: str
    amount: float = Field(gt=0)
    currency: str = Field(min_length=3, max_length=3)
    payment_method: str
    customer_id: str | None = None
    order_attempts: int = Field(default=0, ge=0)
    occurred_at: datetime | None = None
    device_id: str | None = None
    ip_country: str | None = None
    billing_country: str | None = None
    email_domain: str | None = Field(default=None, max_length=255)
    card_token_id: str | None = Field(default=None, max_length=255)
    transactions_last_10m: int = Field(default=0, ge=0)

    @field_validator("currency", "payment_method", "ip_country", "billing_country", mode="before")
    @classmethod
    def normalize_uppercase(cls, value: str | None) -> str | None:
        return value.strip().upper() if isinstance(value, str) else value

    @field_validator("transaction_id", "merchant_id")
    @classmethod
    def reject_empty_identifiers(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value


class FraudPredictionResponse(BaseModel):
    transaction_id: str
    fraud_probability: float = Field(ge=0, le=1)
    risk_level: str
    model_version: str
    explanation: list[str] = Field(default_factory=list)
    is_placeholder: bool = True
    compatibility_warning: str | None = None
