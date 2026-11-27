from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_app_settings, get_db, get_mantu, get_session_id
from app.clients.mantu import MantuClient
from app.core.config import Settings
from app.models import CatalogProduct
from app.schemas import (
    CreateCheckoutOrderRequest,
    InitiatePaymentRequest,
    OrderOut,
    ProductOut,
    VerifyPaymentRequest,
)
from app.services import checkout_service as svc

router = APIRouter(prefix="/api", tags=["checkout"])


@router.get("/catalog", response_model=list[ProductOut])
def get_catalog(db: Session = Depends(get_db)):
    return list(db.scalars(select(CatalogProduct).where(CatalogProduct.active.is_(True)).order_by(CatalogProduct.name)))


@router.post("/checkout/orders", response_model=OrderOut, status_code=201)
async def create_order(
    body: CreateCheckoutOrderRequest,
    db: Session = Depends(get_db),
    mantu: MantuClient = Depends(get_mantu),
    session_id: str = Depends(get_session_id),
):
    order = await svc.create_checkout_order(db, mantu, session_id, body)
    return OrderOut.from_model(order)


@router.post("/checkout/orders/{order_id}/pay", response_model=OrderOut)
async def pay_order(
    order_id: str,
    body: InitiatePaymentRequest,
    db: Session = Depends(get_db),
    mantu: MantuClient = Depends(get_mantu),
    settings: Settings = Depends(get_app_settings),
    session_id: str = Depends(get_session_id),
):
    order = await svc.initiate_payment(db, mantu, settings, session_id, order_id, body)
    return OrderOut.from_model(order)


@router.post("/checkout/orders/{order_id}/verify", response_model=OrderOut)
async def verify_payment(
    order_id: str,
    body: VerifyPaymentRequest,
    db: Session = Depends(get_db),
    mantu: MantuClient = Depends(get_mantu),
    settings: Settings = Depends(get_app_settings),
    session_id: str = Depends(get_session_id),
):
    order = await svc.verify_payment(db, mantu, settings, session_id, order_id, body)
    return OrderOut.from_model(order)


@router.post("/checkout/payments/{payment_id}/capture", response_model=OrderOut)
async def capture(
    payment_id: str,
    db: Session = Depends(get_db),
    mantu: MantuClient = Depends(get_mantu),
    session_id: str = Depends(get_session_id),
):
    order = await svc.capture_payment(db, mantu, session_id, payment_id)
    return OrderOut.from_model(order)
