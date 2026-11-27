# 04 — Frontend Architecture

Mantu includes two separate React 18 + TypeScript + Vite single-page applications:

1. **Mantu Merchant & Operations Dashboard** (`D:\Mantu\frontend`, dev port `3000`).
2. **Deskwell Sample Merchant Storefront** (`D:\Mantu\sample_merchant_application\frontend`, dev port `5173`).

---

## 1. Mantu Merchant & Operations Dashboard (`frontend/`)

### Architecture & Providers (`src/App.tsx`)
The root component composes `<BrowserRouter>` -> `<AuthProvider>` -> `<ToastProvider>` -> `<AppRoutes />`.
- **Vite Proxy (`vite.config.ts`)**: Proxies `/v1` and `/internal` to `http://localhost:8080` (`api-gateway`).
- **Auth State (`src/context/AuthContext.tsx`)**: Persists `mantu_auth_token`, `mantu_merchant_status`, `mantu_kyc_status`, `mantu_onboarding_complete`, `mantu_user_email`, `mantu_user_role` (`OWNER | ADMIN | TEAM | MANTU_OPS_ADMIN`), and `mantu_business_name` in `localStorage`. On mount/token change for non-ops users, it calls `kycApi.getStatus()` to synchronize live KYC status.

### HTTP Client & Interceptors (`src/api/client.ts`)
- **Base Client**: `axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '', timeout: 10000 })`.
- **Request Interceptor**:
  - Injects `Authorization: Bearer <mantu_auth_token>`.
  - Automatically generates a UUIDv4 `X-Idempotency-Key` header on `POST` requests targeting `/payments` or `/orders` if not already set.
- **Response Interceptor**:
  - On HTTP `401`: clears `mantu_auth_token` and redirects to `/login`.
  - On `errorCode === 'KYC_REQUIRED'`: redirects to `/onboarding/kyc`.
- **Offline Mock Fallbacks**: API modules (`auth.ts`, `kyc.ts`, `apiKeys.ts`, `webhooks.ts`, `orders.ts`, `payments.ts`) include `localStorage`-backed mock fallbacks when `!error.response` (network unreachable), allowing UI demos even when backend services are offline.

### Routing & Access Guards (`src/routes/`)
| Route | Component | Guard | Purpose |
|---|---|---|---|
| `/` | `LandingPage` | Public | Product landing page with video background |
| `/login`, `/signup` | `LoginPage`, `SignupPage` | Public | Merchant & Ops authentication |
| `/app` | `HomeRedirect` | `ProtectedRoute` | Routes Ops Admin -> `/ops/risk`, active merchant -> `/dashboard`, pending -> `/onboarding/kyc` |
| `/onboarding/kyc` | `KycOnboardingPage` | `ProtectedRoute` | 4-document KYC upload & submission |
| `/dashboard` | `OverviewPage` | `ProtectedRoute` + `KycGuardRoute` + `AppShell` | KPI cards, SVG `VolumeBarChart` (24h/7d/30d), channel distribution, recent transactions |
| `/transactions` | `TransactionsPage` | `KycGuardRoute` + `AppShell` | Searchable/filterable merchant transactions & JSON inspector modal |
| `/developers/api-keys` | `ApiKeysPage` | `KycGuardRoute` + `AppShell` | Create, rotate (with 24h grace), and revoke API keys |
| `/developers/webhooks` | `WebhooksPage` | `KycGuardRoute` + `AppShell` | Register webhook endpoints + multi-language HMAC verification guide (Node.js, Python, Spring Boot, Go, PHP) |
| `/kyc-verified` | `KycVerifiedPage` | `KycGuardRoute` + `AppShell` | Animated KYC verification confirmation card |
| `/ops/risk` | `OpsRiskDashboardPage` | `OpsGuardRoute` | Operations risk KPIs, timeframe selector (`All time` default, 24h, 7d, 30d), anomaly alerts |
| `/ops/transactions` | `OpsTransactionsPage` | `OpsGuardRoute` | Ops transaction table with ML fraud probability, risk level, selected route, and inspection modal |
| `/ops/kyc-review` | `OpsReviewPage` | `ProtectedRoute` | Operations KYC review interface (note: guarded by `ProtectedRoute`, not `OpsGuardRoute`) |

> **Layout Notes (`AppShell.tsx`, `Sidebar.tsx`):** `AppShell` renders a fixed background video (`/background_merchant.mp4`) in the right-hand workspace that plays once per route navigation (`useEffect` on `location.pathname`). `Sidebar` locks merchant navigation items until `onboardingComplete && merchantStatus === 'ACTIVE'`. `src/pages/risk/AnomalyAlertsPage.tsx` exists on disk as an unrouted component.

### Mantu Dashboard & Operations Screenshots

| View | Screenshot |
|---|---|
| **Merchant Dashboard (`/dashboard`)** | ![Merchant Dashboard](<../screenshots/Screenshot%202026-11-27%20142847.png>) |
| **Recent Transactions Section** | ![Recent Transactions](<../screenshots/Screenshot%202026-11-27%20143154.png>) |
| **Transactions & Orders (`/transactions`)** | ![Transactions Page](<../screenshots/Screenshot%202026-11-27%20142930.png>) |
| **API Keys Management (`/developers/api-keys`)** | ![API Keys](<../screenshots/Screenshot%202026-11-27%20143008.png>) |
| **Generate New API Key Modal** | ![Generate API Key Modal](<../screenshots/Screenshot%202026-11-27%20143023.png>) |
| **Webhooks Configuration (`/developers/webhooks`)** | ![Webhooks Configuration](<../screenshots/Screenshot%202026-11-27%20143112.png>) |
| **Register Webhook Modal** | ![Register Webhook Modal](<../screenshots/Screenshot%202026-11-27%20143049.png>) |
| **KYC Verified Card (`/kyc-verified`)** | ![KYC Verified](<../screenshots/Screenshot%202026-11-27%20143129.png>) |
| **Ops Risk Command Center (`/ops/risk`)** | ![Ops Risk Dashboard](<../screenshots/Screenshot%202026-11-27%20121842.png>) |
| **Ops Transactions Ledger (`/ops/transactions`)** | ![Ops Transactions](<../screenshots/Screenshot%202026-11-27%20121931.png>) |

---

## 2. Deskwell Storefront (`sample_merchant_application/frontend/`)

- **Proxy (`vite.config.ts`)**: Proxies `/api` to `http://localhost:8000` (Deskwell FastAPI backend).
- **Cart State (`CartContext.tsx`)**: Loads product catalog from `/api/catalog` and persists cart items (`deskwell.cart.v1`) in `localStorage` (max 10 units per product).
- **API Client (`src/api/merchantApi.ts`)**: Uses `fetch` with `credentials: "include"` so the browser sends the `mc_session` HTTP-only session cookie.
- **Checkout Modal (`src/components/checkout/`)**:
  - `MantuCheckoutModal.tsx` + `useCheckoutFlow.ts` implement a unified multi-method checkout modal supporting `RECOMMENDED`, `UPI` (25×25 QR SVG + VPA), `CARD` (with network detection & Luhn/expiry checks), `NETBANKING`, `WALLET` (mapped to `UPI` on backend), and `EMI` (mapped to `NETBANKING` on backend).
  - Generates and persists `mantu_device_id` in `localStorage` and attaches `device_id`, `ip_country`, and `billing_country` telemetry to payment requests.
