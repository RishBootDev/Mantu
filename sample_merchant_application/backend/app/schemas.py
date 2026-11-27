import re
from datetime import datetime, timezone
from typing import Annotated, Literal

from pydantic import BaseModel, BeforeValidator, ConfigDict, EmailStr, Field, SecretStr

from app.models import MerchantOrder, PaymentAttempt


def _as_utc(value: object) -> object:
                                                                 
    if isinstance(value, datetime) and value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


UtcDatetime = Annotated[datetime, BeforeValidator(_as_utc)]

PHONE_RE = re.compile(r"^\+?[0-9]{8,15}$")
VPA_RE = re.compile(r"^[A-Za-z0-9._\-]{2,256}@[A-Za-z][A-Za-z0-9]{1,63}$")
BANK_RE = re.compile(r"^[A-Za-z0-9_]{2,32}$")
PAN_RE = re.compile(r"^[0-9]{12,19}$")
CVV_RE = re.compile(r"^[0-9]{3,4}$")


                                                                           
class CheckoutItem(BaseModel):
                                                                               
    product_id: str = Field(min_length=1, max_length=40)
    quantity: int = Field(gt=0, le=10)


class CreateCheckoutOrderRequest(BaseModel):
    items: list[CheckoutItem] = Field(min_length=1, max_length=20)
    customer_name: str | None = Field(default=None, max_length=200)
    customer_email: EmailStr | None = None
    customer_phone: str | None = Field(default=None, max_length=20)
    customer_address: str | None = Field(default=None, max_length=400)
    customer_country: str | None = Field(default=None, max_length=3)

    def field_problems(self) -> list[dict[str, str]]:
        problems: list[dict[str, str]] = []
        if self.customer_phone and not PHONE_RE.match(self.customer_phone):
            problems.append({"field": "customer_phone", "message": "Enter a valid phone number, e.g. +919876543210."})
        return problems


class InitiatePaymentRequest(BaseModel):
    method: Literal["CARD", "UPI", "NETBANKING"]
    vpa: str | None = Field(default=None, max_length=320)
    bank: str | None = Field(default=None, max_length=32)
                                                                                                
    pan: SecretStr | None = None
    cvv: SecretStr | None = None
    expiry_month: int | None = None
    expiry_year: int | None = None
    card_holder_name: str | None = Field(default=None, max_length=200)
    device_id: str | None = Field(default=None, max_length=128)
    ip_country: str | None = Field(default=None, max_length=3)
    billing_country: str | None = Field(default=None, max_length=3)

    def field_problems(self) -> list[dict[str, str]]:
        p: list[dict[str, str]] = []

        def need(field: str, ok: bool, msg: str) -> None:
            if not ok:
                p.append({"field": field, "message": msg})

        def forbid(*fields: str) -> None:
            for f in fields:
                if getattr(self, f) is not None:
                    p.append({"field": f, "message": f"Not accepted for {self.method} payments."})

        card_fields = ("pan", "cvv", "expiry_month", "expiry_year", "card_holder_name")
        if self.method == "UPI":
            need("vpa", bool(self.vpa and VPA_RE.match(self.vpa.strip())), "Enter a valid UPI ID, e.g. name@bank.")
            forbid("bank", *card_fields)
        elif self.method == "NETBANKING":
            need("bank", bool(self.bank and BANK_RE.match(self.bank)), "Select your bank.")
            forbid("vpa", *card_fields)
        else:
            forbid("vpa", "bank")
            pan = self.pan.get_secret_value().replace(" ", "").replace("-", "") if self.pan else ""
            cvv = self.cvv.get_secret_value() if self.cvv else ""
            need("pan", bool(PAN_RE.match(pan)), "Enter a valid card number.")
            need("cvv", bool(CVV_RE.match(cvv)), "Enter the 3 or 4 digit security code.")
            need("expiry_month", self.expiry_month is not None and 1 <= self.expiry_month <= 12, "Enter a month from 1 to 12.")
            now = datetime.now(timezone.utc)
            year_ok = self.expiry_year is not None and now.year <= self.expiry_year <= now.year + 25
            need("expiry_year", year_ok, "Enter a valid expiry year.")
            if year_ok and self.expiry_month and 1 <= self.expiry_month <= 12:
                need(
                    "expiry_month",
                    (self.expiry_year, self.expiry_month) >= (now.year, now.month),
                    "This card has expired.",
                )
            need("card_holder_name", bool(self.card_holder_name and self.card_holder_name.strip()), "Enter the name on the card.")
        return p


                                                                           
class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    price_amount_units: int
    currency: str
    image_url: str


class OrderItemOut(BaseModel):
    product_id: str
    name: str
    quantity: int
    unit_amount_units: int


class PaymentOut(BaseModel):
    id: str
    mantu_payment_id: str | None
    method: str
    status: str
    selected_route_id: str | None
    error_description: str | None
    created_at: UtcDatetime
    updated_at: UtcDatetime

    @classmethod
    def from_model(cls, a: PaymentAttempt) -> "PaymentOut":
        return cls(
            id=a.id,
            mantu_payment_id=a.mantu_payment_id,
            method=a.method,
            status=a.status,
            selected_route_id=a.selected_route_id,
            error_description=a.error_description,
            created_at=a.created_at,
            updated_at=a.updated_at,
        )


class VerifyPaymentRequest(BaseModel):
    mantu_payment_id: str | None = None
    mantu_order_id: str | None = None
    mantu_signature: str | None = None
                                             
    razorpay_payment_id: str | None = None
    razorpay_order_id: str | None = None
    razorpay_signature: str | None = None

    @property
    def payment_id(self) -> str:
        return (self.mantu_payment_id or self.razorpay_payment_id or "").strip()

    @property
    def order_id(self) -> str:
        return (self.mantu_order_id or self.razorpay_order_id or "").strip()

    @property
    def signature(self) -> str:
        return (self.mantu_signature or self.razorpay_signature or "").strip()


class OrderOut(BaseModel):
    id: str
    receipt: str
    mantu_order_id: str | None
    mantu_key_id: str | None = None
    amount_units: int
    currency: str
    status: str
    refund_state: str | None
    items: list[OrderItemOut]
    customer_name: str | None
    customer_email: str | None
    customer_phone: str | None
    customer_address: str | None = None
    customer_country: str | None = None
    created_at: UtcDatetime
    updated_at: UtcDatetime
    latest_payment: PaymentOut | None

    @classmethod
    def from_model(cls, o: MerchantOrder, mantu_key_id: str | None = None) -> "OrderOut":
        from app.core.config import get_settings
        key_id = mantu_key_id or (get_settings().mantu_key_id if get_settings().mantu_configured else None)
        latest = o.latest_attempt
        return cls(
            id=o.id,
            receipt=o.receipt,
            mantu_order_id=o.mantu_order_id,
            mantu_key_id=key_id,
            amount_units=o.amount_units,
            currency=o.currency,
            status=o.status,
            refund_state=o.refund_state,
            items=[OrderItemOut(**i) for i in (o.items_json or [])],
            customer_name=o.customer_name,
            customer_email=o.customer_email,
            customer_phone=o.customer_phone,
            customer_address=o.customer_address,
            customer_country=o.customer_country,
            created_at=o.created_at,
            updated_at=o.updated_at,
            latest_payment=PaymentOut.from_model(latest) if latest else None,
        )
