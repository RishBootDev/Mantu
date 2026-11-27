from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_app_settings, get_db, get_mantu, get_session_id
from app.clients.mantu import MantuClient
from app.core.config import Settings
from app.schemas import OrderOut
from app.services import checkout_service as svc

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.get("", response_model=list[OrderOut])
def list_orders(db: Session = Depends(get_db), session_id: str = Depends(get_session_id)):
    return [OrderOut.from_model(o) for o in svc.list_orders(db, session_id)]


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: str,
    db: Session = Depends(get_db),
    mantu: MantuClient = Depends(get_mantu),
    settings: Settings = Depends(get_app_settings),
    session_id: str = Depends(get_session_id),
):
    order = svc.get_owned_order(db, session_id, order_id)
    order = await svc.refresh_order_status(db, mantu, settings, order)
    return OrderOut.from_model(order)
