# 16 — Checkout Architecture (Deskwell Sample Merchant)

Deskwell (`D:\Mantu\sample_merchant_application`) demonstrates a realistic **server-to-server merchant integration** with Mantu, avoiding exposure of Mantu API secrets (`MANTU_KEY_SECRET`) or raw PAN/CVV persistence in the merchant database.

---

## 1. Architecture Components
1. **Deskwell Storefront (`sample_merchant_application/frontend/`, Port `5173`)**:
   - Cart & catalog UI (`Storefront.tsx`, `Cart.tsx`), customer details form (`Checkout.tsx`), and unified `MantuCheckoutModal.tsx` (`Pay.tsx`).
   - Supports `RECOMMENDED`, `UPI` (QR + VPA), `CARD`, `NETBANKING`, `WALLET` (routed as `UPI`), and `EMI` (routed as `NETBANKING`).
   - Collects browser telemetry (`mantu_device_id` in `localStorage`, `ip_country`, `billing_country`).
2. **Deskwell FastAPI Backend (`sample_merchant_application/backend/`, Port `8000`)**:
   - **Session Isolation**: Issues an HTTP-only `mc_session` cookie (`deps.py`) so each browser session sees only its own orders.
   - **Server-Side Pricing (`checkout_service.py`)**: Never trusts client-submitted totals; computes `amount_units` exclusively from `CatalogProduct` rows.
   - **Mantu HTTP Client (`app/clients/mantu.py`)**: Uses `httpx.AsyncClient` with `BasicAuth(mantu_key_id, mantu_key_secret)`, forwarding `X-Request-ID` and `X-Idempotency-Key`, with exponential backoff + jitter on `429/502/503/504` for idempotent (`full` policy) calls.
   - **Single Active Attempt Constraint**: `PaymentAttempt` enforces `uq_one_active_attempt_per_order` (`(merchant_order_id, active_slot)`), preventing concurrent double-charges on the same order.

---

## 2. Payment & Signature Verification Flow
1. `POST /api/checkout/orders` -> creates local `MerchantOrder` + Mantu `/v1/orders`.
2. `POST /api/checkout/orders/{order_id}/pay` -> validates method fields (`SecretStr` for `pan`/`cvv`), tokenizes cards via `/v1/vault/tokenize`, calls Mantu `/v1/payments`, and auto-captures `AUTHORIZED` payments.
3. `POST /api/checkout/orders/{order_id}/verify` -> verifies `mantu_order_id` match and HMAC-SHA256(`"{mantu_order_id}|{payment_id}"`, `MANTU_KEY_SECRET`).
4. `POST /api/webhooks/mantu` -> verifies `X-Mantu-Signature` against `MANTU_WEBHOOK_SECRET`, deduplicates by `SHA-256(raw_body)` in `ProcessedWebhookEvent`, and applies monotonic state transitions (`RANK` in `payment_state.py`).

---

## 3. Deskwell & Mantu Checkout Visual Walkthrough

### Storefront, Cart & Customer Details
![Deskwell Storefront](<../screenshots/Screenshot%202026-11-27%20115758.png>)
![Deskwell Cart](<../screenshots/Screenshot%202026-11-27%20145719.png>)
![Deskwell Checkout Customer Form](<../screenshots/Screenshot%202026-11-27%20145836.png>)

### Mantu Checkout Modal (Recommended, Net Banking, Wallets, EMI, Processing, Success)
![Mantu Checkout — Recommended Methods](<../screenshots/Screenshot%202026-11-27%20145900.png>)
![Mantu Checkout — Net Banking with Bank Logos](<../screenshots/Screenshot%202026-11-27%20145955.png>)
![Mantu Checkout — Wallets](<../screenshots/Screenshot%202026-11-27%20150008.png>)
![Mantu Checkout — EMI Options](<../screenshots/Screenshot%202026-11-27%20150020.png>)
![Mantu Checkout — Processing Payment](<../screenshots/Screenshot%202026-11-27%20150054.png>)
![Mantu Checkout — Payment Successful](<../screenshots/Screenshot%202026-11-27%20150756.png>)

### Order Results & History
![Order Result — Paid](<../screenshots/Screenshot%202026-11-27%20150918.png>)
![Order Result — Simulated Bank Declined](<../screenshots/Screenshot%202026-11-27%20121458.png>)
![Deskwell Order History](<../screenshots/Screenshot%202026-11-27%20150208.png>)

### Deskwell FastAPI Backend Runtime
![Deskwell FastAPI Backend Running on Port 8000](<../screenshots/Screenshot%202026-11-27%20143608.png>)
