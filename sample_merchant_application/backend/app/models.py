import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, SmallInteger, String, Text, UniqueConstraint
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


UTCDateTime = DateTime(timezone=True).with_variant(mysql.DATETIME(fsp=6), "mysql")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid.uuid4())


PENDING_PAYMENT = "PENDING_PAYMENT"
PAID = "PAID"
PAYMENT_FAILED = "PAYMENT_FAILED"
CANCELLED = "CANCELLED"

FAILED_STATES = ("FAILED", "CANCELLED", "AUTH_EXPIRED")


class CatalogProduct(Base):
    __tablename__ = "catalog_product"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(String(300))
    price_amount_units: Mapped[int] = mapped_column(Integer)                       
    currency: Mapped[str] = mapped_column(String(3), default="INR")
    image_url: Mapped[str] = mapped_column(String(300))
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class MerchantOrder(Base):
    __tablename__ = "merchant_order"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
                                                                                               
    session_id: Mapped[str] = mapped_column(String(64), index=True)
    receipt: Mapped[str] = mapped_column(String(64), unique=True)
    mantu_order_id: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
    order_idempotency_key: Mapped[str] = mapped_column(String(64), unique=True, default=new_id)
    amount_units: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(3), default="INR")
    status: Mapped[str] = mapped_column(String(20), default=PENDING_PAYMENT)
    refund_state: Mapped[str | None] = mapped_column(String(24), nullable=True)
    items_json: Mapped[list] = mapped_column(JSON, default=list)
    customer_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    customer_email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    customer_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    customer_address: Mapped[str | None] = mapped_column(String(400), nullable=True)
    customer_country: Mapped[str | None] = mapped_column(String(3), nullable=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, onupdate=utcnow)

    attempts: Mapped[list["PaymentAttempt"]] = relationship(
        back_populates="order", order_by="PaymentAttempt.created_at", cascade="all, delete-orphan"
    )

    @property
    def latest_attempt(self) -> "PaymentAttempt | None":
        return self.attempts[-1] if self.attempts else None


class PaymentAttempt(Base):
    __tablename__ = "payment_attempt"
    __table_args__ = (
                                                                                       
                                                                                                  
                                                                                                 
        UniqueConstraint("merchant_order_id", "active_slot", name="uq_one_active_attempt_per_order"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    merchant_order_id: Mapped[str] = mapped_column(ForeignKey("merchant_order.id"), index=True)
    mantu_payment_id: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
    idempotency_key: Mapped[str] = mapped_column(String(64), unique=True, default=new_id)
    method: Mapped[str] = mapped_column(String(16))
                                                                                     
    status: Mapped[str] = mapped_column(String(24), default="INITIATING")
    selected_route_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    error_description: Mapped[str | None] = mapped_column(String(200), nullable=True)             
    active_slot: Mapped[int | None] = mapped_column(SmallInteger, nullable=True, default=1)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, onupdate=utcnow)

    order: Mapped[MerchantOrder] = relationship(back_populates="attempts")


class ProcessedWebhookEvent(Base):
    __tablename__ = "processed_webhook_event"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[str] = mapped_column(String(64), unique=True)
    event_type: Mapped[str] = mapped_column(String(100))
    payload_hash: Mapped[str] = mapped_column(String(64))
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    received_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
