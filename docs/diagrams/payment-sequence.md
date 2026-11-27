# End-to-End Payment Processing Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer (Deskwell UI)
    participant DeskwellBE as Deskwell Backend (FastAPI :8000)
    participant GW as api-gateway (:8080)
    participant PS as payment-service
    participant MS as merchant-service
    participant VS as vault-service
    participant ML as ml-services (:8100)
    participant Kafka as Apache Kafka
    participant OS as operations-service

    Customer->>DeskwellBE: POST /api/checkout/orders (cart items + customer info)
    DeskwellBE->>GW: POST /v1/orders (Basic Auth + X-Idempotency-Key)
    GW->>GW: ApiKeyAuthHandler + RateLimiter + MerchantOnboardingGate
    GW->>PS: Forward POST /v1/orders (X-Merchant-Id)
    PS->>MS: Feign POST /internal/customers/find-or-create
    MS-->>PS: customerId (UUID)
    PS->>PS: Persist OrderRecord (CREATED) + OutboxEvent (ORDER_CREATED)
    PS-->>DeskwellBE: OrderResponse (mantu_order_id)
    DeskwellBE-->>Customer: Checkout Order Created

    opt Payment Method == CARD
        Customer->>DeskwellBE: POST /api/checkout/orders/{id}/pay (PAN, CVV, expiry, telemetry)
        DeskwellBE->>GW: POST /v1/vault/tokenize (PAN, CVV, expiry)
        GW->>VS: Forward POST /v1/vault/tokenize
        VS->>VS: Generate 32-byte DEK, AES-GCM encrypt PAN, encrypt DEK with master key
        VS-->>DeskwellBE: TokenizeResponse (tok_xxx)
    end

    DeskwellBE->>GW: POST /v1/payments (orderId, method, methodDetails + telemetry, X-Idempotency-Key)
    GW->>PS: Forward POST /v1/payments
    PS->>PS: PaymentAuthorizationRecorder.recordPayment() -> Payment (INITIATING)

    PS->>ML: Feign POST /api/v1/fraud/predict (amount, velocity, telemetry)
    ML-->>PS: FraudPredictionResponse (fraud_probability, risk_level, model_version)
    Note over PS: In OBSERVE mode, risk score is recorded;<br/>in BLOCK mode, HIGH risk aborts before routing.

    PS->>ML: Feign POST /api/v1/routing/recommend (eligible_routes, amount, method)
    ML-->>PS: RoutingRecommendationResponse (recommended_route_id, ranked_routes)

    alt CARD Payment
        PS->>VS: Feign POST /internal/vault/charge (token, amount)
        VS->>VS: Decrypt DEK + PAN in memory, @Bulkhead CardPaymentProcessor, zero PAN bytes
        VS-->>PS: PaymentProcessorResponse (Success / Pending / Failure)
    else UPI or NETBANKING Payment
        PS->>PS: UpiPaymentAdapter / NetBankingAdapter -> PaymentProcessorRouter
    end

    PS->>PS: PaymentAuthorizationRecorder.applyGatewayResult() -> AUTHORIZED / FAILED
    PS->>PS: Save OutboxEvent (PAYMENT_APPROVED or PAYMENT_STATUS_CHANGED)
    PS-->>DeskwellBE: PaymentResponse

    opt Status == AUTHORIZED and auto-capture enabled
        DeskwellBE->>GW: POST /v1/payments/{id}/capture
        GW->>PS: Forward capture -> CAPTURED + OutboxEvent (PAYMENT_STATUS_CHANGED)
    end

    PS->>Kafka: OutboxPoller publishes to payments.events
    Kafka->>OS: WebhookKafkaConsumer receives event
    OS->>MS: Feign GET /internal/merchants/{id}/webhook-targets
    OS->>OS: Sign payload with HMAC-SHA256 -> WebhookEvent (PENDING)
    OS->>DeskwellBE: POST /api/webhooks/mantu (X-Mantu-Signature)
    DeskwellBE->>DeskwellBE: Verify HMAC-SHA256, deduplicate SHA-256(body), apply_payment_state()
    DeskwellBE-->>OS: 204 No Content

    Kafka->>ML: AnomalyWorker consumes payment.transaction.created
    ML->>ML: Aggregate 5-min window -> AnomalyDetectionService
    opt Anomaly Detected
        ML->>Kafka: Publish TRANSACTION_ANOMALY_DETECTED to ml.transaction.anomaly.detected
        Kafka->>OS: AnomalyAlertKafkaConsumer persists AnomalyAlert
    end
```
