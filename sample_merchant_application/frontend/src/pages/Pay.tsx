import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError, getOrder, payOrder, verifyPayment } from "../api/merchantApi";
import OrderSummary from "../components/checkout/OrderSummary";
import { MantuCheckoutModal, type MantuCheckoutOptions } from "../components/checkout/MantuCheckoutModal";
import { formatAmount } from "../format";
import type { MantuCheckoutResponse, Order, PayRequest } from "../types";

export default function Pay() {
  const { orderId = "" } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    getOrder(orderId, ctrl.signal)
      .then((o) => {
        const p = o.latest_payment;
        const active = p && !["FAILED", "CANCELLED", "AUTH_EXPIRED"].includes(p.status);
                                                                                               
        if (o.status === "PAID" || active) {
          navigate(`/orders/${o.id}/result`, { replace: true });
        } else {
          setOrder(o);
                                                                                     
          setIsModalOpen(true);
        }
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") setLoadError(e.message);
      });
    return () => ctrl.abort();
  }, [orderId, navigate]);

  const handlePaymentSuccess = async (response: MantuCheckoutResponse) => {
    if (!order) return;
    setVerifying(true);
    setVerifyError(null);

    try {
                                                                           
      const updated = await verifyPayment(order.id, {
        mantu_payment_id: response.mantu_payment_id,
        mantu_order_id: response.mantu_order_id,
        mantu_signature: response.mantu_signature,
      });
      navigate(`/orders/${updated.id}/result`, { replace: true });
    } catch (e) {
      const err = e as ApiError;
      setVerifyError(err.message || "Payment verification failed. Please try again.");
      setVerifying(false);
    }
  };

  if (loadError)
    return (
      <section className="narrow">
        <p className="notice bad" role="alert">
          {loadError}
        </p>
        <Link to="/" className="btn">
          Back to shop
        </Link>
      </section>
    );

  if (!order) return <p role="status">Loading your order…</p>;

  const retry = order.status === "PAYMENT_FAILED";
  const checkoutKey = order.mantu_key_id || "mantu_test_key";

  const checkoutOptions: MantuCheckoutOptions = {
    key: checkoutKey,
    order_id: order.mantu_order_id || order.id,
    amount: order.amount_units,
    currency: order.currency,
    name: "Deskwell",
    description: `Order ${order.receipt}`,
    order,
    prefill: {
      name: order.customer_name || "Customer",
      email: order.customer_email || "customer@example.com",
      contact: order.customer_phone || "+919876543210",
    },
    onPay: (req: PayRequest) => payOrder(order.id, req),
    onPollOrder: () => getOrder(order.id),
    onComplete: (updated: Order) => {
      navigate(`/orders/${updated.id}/result`, { replace: true });
    },
    handler: handlePaymentSuccess,
    modal: {
      ondismiss: () => {
        setIsModalOpen(false);
      },
    },
  };

  return (
    <section className="split">
      <div className="pay-form" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div>
          <h1>{retry ? "Retry Payment" : "Checkout with Mantu"}</h1>
          <p className="muted" style={{ margin: "0.25rem 0 0" }}>
            The payment page opens securely from Mantu, exactly like Razorpay.
          </p>
        </div>

        {retry && (
          <p className="notice bad">
            {order.latest_payment?.error_description ?? "Your last payment was declined. Please try again."}
          </p>
        )}

        {verifyError && (
          <p className="notice bad" role="alert">
            {verifyError}
          </p>
        )}

        {                                        }
        <div
          style={{
            background: "#f8fafc",
            border: "1.5px solid #e2e8f0",
            borderRadius: "12px",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "#2563eb",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "18px",
                }}
              >
                M
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Mantu Payment Gateway</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  Instant UPI • Credit/Debit Cards • Net Banking
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#16a34a",
                background: "#dcfce7",
                padding: "2px 8px",
                borderRadius: "99px",
              }}
            >
              🔒 256-bit SSL
            </span>
          </div>

          <div
            style={{
              fontSize: "0.85rem",
              color: "#475569",
              background: "#ffffff",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              lineHeight: 1.5,
            }}
          >
            Payments are processed on Mantu's PCI-DSS compliant server. Sensitive card credentials and UPI PINs never
            touch the merchant server.
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
            disabled={verifying}
            style={{
              padding: "0.85rem 1.5rem",
              fontSize: "1.05rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
            }}
          >
            <span>💳</span>
            <span>{verifying ? "Verifying signature…" : `Pay ${formatAmount(order.amount_units)} with Mantu`}</span>
          </button>
        </div>

                                 
        {verifying && (
          <div className="processing" role="status" aria-live="assertive">
            <span className="spinner" aria-hidden="true" />
            <strong>Verifying Payment Signature…</strong>
            <span>Validating HMAC-SHA256 credentials with Mantu Gateway</span>
          </div>
        )}
      </div>

      <OrderSummary order={order} />

                                                                                 
      <MantuCheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        options={checkoutOptions}
      />
    </section>
  );
}
