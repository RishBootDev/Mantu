import asyncio
import logging
import random
import uuid
from typing import Any, Literal

import httpx
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.core.config import Settings
from app.core.context import request_id_var

logger = logging.getLogger("mantu.client")

RetryPolicy = Literal["none", "connect_only", "full"]
ErrorKind = Literal["config", "rate_limited", "client_error", "server_error", "network"]


class MantuError(Exception):
    def __init__(
        self,
        kind: ErrorKind,
        *,
        status_code: int | None = None,
        retry_after: int | None = None,
        ambiguous: bool = False,
        detail: str = "",
    ) -> None:
        super().__init__(f"{kind} ({status_code}) {detail}".strip())
        self.kind = kind
        self.status_code = status_code
        self.retry_after = retry_after
                                                                                          
        self.ambiguous = ambiguous
        self.detail = detail


                                                                             
class MantuAmount(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)
    amount_units: int = Field(alias="amountUnits")
    currency: str


class MantuOrder(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)
    id: str
    status: str | None = None


class MantuPayment(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)
    id: str
    order_id: str | None = Field(default=None, alias="orderId")
    status: str
    method: str | None = None
    amount: MantuAmount | None = None
    selected_route_id: str | None = Field(default=None, alias="selectedRouteId")
    error_code: str | None = Field(default=None, alias="errorCode")
    error_description: str | None = Field(default=None, alias="errorDescription")


class _TokenizeResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    token: str


_CONNECT_ERRORS = (httpx.ConnectError, httpx.ConnectTimeout, httpx.PoolTimeout)


class MantuClient:
    def __init__(self, settings: Settings, transport: httpx.AsyncBaseTransport | None = None) -> None:
        self._settings = settings
        self._http = httpx.AsyncClient(
            base_url=settings.mantu_base_url.rstrip("/"),
            auth=httpx.BasicAuth(settings.mantu_key_id, settings.mantu_key_secret.get_secret_value()),
            timeout=httpx.Timeout(
                connect=settings.mantu_connect_timeout,
                read=settings.mantu_read_timeout,
                write=10.0,
                pool=5.0,
            ),
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            transport=transport,
        )

    async def aclose(self) -> None:
        await self._http.aclose()

                                                                             
    async def create_order(
        self,
        *,
        amount_units: int,
        currency: str,
        receipt: str,
        customer: dict[str, str] | None,
        idempotency_key: str,
    ) -> MantuOrder:
        body: dict[str, Any] = {
            "amount": {"amountUnits": amount_units, "currency": currency},
            "receipt": receipt,
            "notes": {"source": "sample-merchant-app"},
        }
        if customer:
            body["customer"] = customer
        data = await self._request("POST", "/v1/orders", body, idempotency_key=idempotency_key, policy="full")
        return self._parse(MantuOrder, data)

    async def tokenize_card(
        self, *, pan: str, cvv: str, expiry_month: int, expiry_year: int, card_holder_name: str
    ) -> str:
        body = {
            "pan": pan,
            "cvv": cvv,
            "expiryMonth": expiry_month,
            "expiryYear": expiry_year,
            "cardHolderName": card_holder_name,
        }
                                                                                             
        data = await self._request("POST", "/v1/vault/tokenize", body, policy="connect_only", sensitive=True)
        return self._parse(_TokenizeResult, data).token

    async def create_payment(
        self, *, order_id: str, method: str, method_details: dict[str, Any], idempotency_key: str
    ) -> MantuPayment:
        body = {"orderId": order_id, "method": method, "methodDetails": method_details}
        data = await self._request("POST", "/v1/payments", body, idempotency_key=idempotency_key, policy="full")
        return self._parse(MantuPayment, data)

    async def get_payment(self, payment_id: str) -> MantuPayment:
        data = await self._request(
            "GET", f"/v1/payments/{payment_id}", None, policy="connect_only", resource=payment_id
        )
        return self._parse(MantuPayment, data)

    async def capture_payment(self, payment_id: str) -> MantuPayment:
        data = await self._request(
            "POST", f"/v1/payments/{payment_id}/capture", None, policy="connect_only", resource=payment_id
        )
        return self._parse(MantuPayment, data)

                                                                               
    @staticmethod
    def _parse(model: type[BaseModel], data: Any):
        try:
            return model.model_validate(data)
        except ValidationError as exc:
            raise MantuError("server_error", ambiguous=True, detail=f"unexpected response shape: {model.__name__}") from exc

    async def _request(
        self,
        method: str,
        path: str,
        body: dict[str, Any] | None,
        *,
        idempotency_key: str | None = None,
        policy: RetryPolicy = "none",
        resource: str | None = None,
        sensitive: bool = False,
    ) -> Any:
        if not self._settings.mantu_configured:
            raise MantuError("config", detail="Mantu credentials are not configured")

        headers = {"X-Request-ID": request_id_var.get() or str(uuid.uuid4())}
        if idempotency_key:
            headers["X-Idempotency-Key"] = idempotency_key

        max_attempts = self._settings.mantu_max_attempts if policy != "none" else 1
        last: MantuError | None = None

        for attempt in range(1, max_attempts + 1):
            delay = 0.3 * (2 ** (attempt - 1)) + random.uniform(0, 0.2)
            try:
                resp = await self._http.request(method, path, json=body, headers=headers)
            except _CONNECT_ERRORS as exc:
                                                                   
                last = MantuError("network", ambiguous=False, detail=type(exc).__name__)
            except httpx.TransportError as exc:
                                                  
                last = MantuError("network", ambiguous=True, detail=type(exc).__name__)
                if policy != "full":
                    self._log(method, path, "transport-error", headers, resource, idempotency_key, last.detail)
                    raise last from exc
            else:
                self._log(method, path, resp.status_code, headers, resource, idempotency_key)
                if 200 <= resp.status_code < 300:
                    try:
                        return resp.json()
                    except ValueError as exc:
                        raise MantuError("server_error", status_code=resp.status_code, ambiguous=True, detail="non-JSON body") from exc
                last = self._map_error(resp, sensitive=sensitive)
                retryable = policy == "full" and resp.status_code in (429, 502, 503, 504)
                if not retryable:
                    raise last
                if last.retry_after:
                    delay = min(float(last.retry_after), 5.0)

            if attempt < max_attempts:
                await asyncio.sleep(delay)

        assert last is not None
        raise last

    @staticmethod
    def _map_error(resp: httpx.Response, *, sensitive: bool) -> MantuError:
        status = resp.status_code
                                                                                                         
        detail = ""
        if not sensitive:
            try:
                payload = resp.json()
                if isinstance(payload, dict):
                    detail = str(
                        payload.get("errorCode")
                        or payload.get("code")
                        or payload.get("error")
                        or payload.get("errorDescription")
                        or ""
                    )[:120]
            except ValueError:
                pass
        if status == 401:
            return MantuError("config", status_code=status, detail="401 invalid or revoked API key")
        if status == 403:
            return MantuError("config", status_code=status, detail="403 forbidden / KYC not active")
        if status == 429:
            retry_after: int | None = None
            raw = resp.headers.get("Retry-After")
            if raw and raw.isdigit():
                retry_after = int(raw)
            return MantuError("rate_limited", status_code=status, retry_after=retry_after, detail=detail)
        if status >= 500:
            return MantuError("server_error", status_code=status, ambiguous=status != 503, detail=detail)
        return MantuError("client_error", status_code=status, detail=detail)

    @staticmethod
    def _log(method: str, path: str, status: object, headers: dict[str, str], resource: str | None,
             idem: str | None, note: str = "") -> None:
        logger.info(
            "mantu %s %s -> %s req=%s resource=%s idem=%s %s",
            method, path, status, headers.get("X-Request-ID"), resource, idem, note,
        )
