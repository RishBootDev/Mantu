// ==========================================
// Mantu Payment Gateway - TypeScript API Contracts
// Single Source of Truth
// ==========================================

export type BusinessType =
  | 'INDIVIDUAL'
  | 'PROPRIETORSHIP'
  | 'PARTNERSHIP'
  | 'PRIVATE_LIMITED'
  | 'PUBLIC_LIMITED'
  | 'LLP'
  | 'TRUST'
  | 'SOCIETY';

export type MerchantStatus = 'PENDING_KYC' | 'ACTIVE' | 'SUSPENDED';

export type KycCaseStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'WAITLISTED'
  | 'APPROVED'
  | 'REJECTED';

export type KycDocumentType =
  | 'PAN'
  | 'BUSINESS_REGISTRATION'
  | 'ADDRESS_PROOF'
  | 'BANK_ACCOUNT_PROOF';

export type PaymentMethod = 'CARD' | 'NETBANKING' | 'UPI' | 'WALLET';

export type PaymentStatus =
  | 'CREATED'
  | 'AUTHORIZING'
  | 'AUTHORIZED'
  | 'CAPTURING'
  | 'CAPTURED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'SETTLED'
  | 'AUTH_EXPIRED';

export interface Money {
  amountUnits: number; // e.g. 50000 = ₹500.00
  currency: string;    // "INR"
}

// ==========================================
// Standard Error Response
// ==========================================
export interface BackendErrorResponse {
  errorCode: string;
  errorDescription: string;
  timeStamp?: string;
  fieldErrors?: Array<{
    field: string;
    message: string;
  }>;
}

// ==========================================
// Authentication
// ==========================================
export interface MerchantSignupRequest {
  name: string;
  email: string;
  password: string;
  businessName?: string;
  businessType?: BusinessType;
}

export interface MerchantResponse {
  id: string;
  name: string;
  email: string;
  businessName?: string;
  businessType?: BusinessType;
  status: MerchantStatus;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  accessToken?: string;
  merchantStatus: MerchantStatus;
  kycStatus: KycCaseStatus;
  onboardingComplete: boolean;
}

// ==========================================
// KYC Onboarding
// ==========================================
export interface KycDocumentResponse {
  id: string;
  documentType: KycDocumentType;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
}

export interface KycOnboardingResponse {
  merchantStatus: MerchantStatus;
  kycStatus: KycCaseStatus;
  onboardingComplete: boolean;
  requiredDocuments: KycDocumentType[];
  documents?: KycDocumentResponse[];
  uploadedDocuments: KycDocumentResponse[];
  reviewerNote: string | null;
  submittedAt: string | null;
}

// ==========================================
// Developer API Keys & Webhooks
// ==========================================
export interface CreateApiKeyRequest {
  environment: 'TEST' | 'LIVE';
}

export interface ApiKeyCreateResponse {
  id: string;
  keyId: string;
  rawSecret: string;
  environment: 'TEST' | 'LIVE';
}

export interface ApiKeyResponse {
  id: string;
  keyId: string;
  environment: 'TEST' | 'LIVE';
  enabled: boolean;
  createdAt: string;
  rotatedAt?: string;
}

export interface UpdateWebhookConfigRequest {
  targetUrl: string;
  eventTypes: string[];
}

export interface WebhookConfigResponse {
  id: string;
  targetUrl: string;
  enabled: boolean;
  eventTypes: string[];
  rawSecret?: string;
  createdAt: string;
}

// Outgoing webhook event model
export interface OutgoingWebhookPayload {
  event: string;
  payload: {
    orderId: string;
    paymentId: string;
    merchantId: string;
    paymentStatus: PaymentStatus;
    amountUnits: number;
    amountCurrency: string;
    paymentMethod: PaymentMethod;
    selectedRouteId?: string;
    errorCode?: string | null;
  };
}

// ==========================================
// Orders & Payments (Checkout)
// ==========================================
export interface CreateOrderRequest {
  amount: Money;
  receipt?: string;
  notes?: Record<string, any>;
  expiresAt?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export interface OrderResponse {
  id: string;
  merchantId: string;
  customerId?: string;
  receipt?: string;
  amount: Money;
  status: string;
  attempts: number;
  notes?: Record<string, any>;
  expiresAt?: string;
  createdAt: string;
}

export interface TokenizeCardRequest {
  pan: string;
  cvv: string;
  expiryMonth: number;
  expiryYear: number;
  cardHolderName?: string;
}

export interface TokenizeCardResponse {
  token: string;
  lastFour: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
}

export interface PaymentInitRequest {
  orderId: string;
  method: PaymentMethod;
  methodDetails: Record<string, any>; // e.g. { token: "..." } or { vpa: "..." } or { bank: "..." }
}

export interface PaymentResponse {
  id: string;
  orderId: string;
  merchantId: string;
  amount: Money;
  status: PaymentStatus;
  method: PaymentMethod;
  selectedRouteId?: string;
  methodDetails?: Record<string, any>;
  errorCode?: string | null;
  errorDescription?: string | null;
  capturedAt?: string;
  createdAt: string;
}

// ==========================================
// Operations & Risk / ML Monitoring
// ==========================================
export interface AnomalyAlert {
  id: string;
  merchantId: string;
  windowStart: string;
  windowEnd: string;
  anomalyScore: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  modelVersion: string;
  status: 'OPEN' | 'REVIEWED' | 'DISMISSED';
  explanation: string[];
}

export interface AnomalyAlertsResponse {
  items: AnomalyAlert[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface KycDecisionRequest {
  decision: 'APPROVED' | 'REJECTED' | 'WAITLISTED';
  note?: string;
}
