import { formatAmount } from "../../format";
import { downloadReceiptFile } from "./checkoutUtils";

interface Props {
  merchantName: string;
  amount: number;
  currency: string;
  paymentId: string;
  orderId: string;
  methodLabel: string;
  timestamp: string;
  onReturnToMerchant: () => void;
}

export function PaymentSuccess({
  merchantName,
  amount,
  currency,
  paymentId,
  orderId,
  methodLabel,
  timestamp,
  onReturnToMerchant,
}: Props) {
  const formattedAmount = formatAmount(amount, currency);

  return (
    <div className="mc-outcome" role="status" aria-live="polite">
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
        <img
          src="/payment_successful.gif"
          alt="Payment successful"
          className="mc-outcome-gif"
          style={{ marginBottom: 0 }}
        />
        <div className="mc-check-circle" aria-hidden="true" style={{ marginBottom: 0 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>

      <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#15803d", margin: "4px 0 4px" }}>
        Payment Successful
      </h3>
      <p style={{ fontSize: "13.5px", color: "#475569", margin: 0 }}>
        Paid <strong style={{ color: "#0f172a" }}>{formattedAmount}</strong> to {merchantName}
      </p>

      <div className="mc-receipt-box">
        <div className="mc-receipt-row">
          <span>Transaction ID</span>
          <span className="mono">{paymentId || "—"}</span>
        </div>
        <div className="mc-receipt-row">
          <span>Order ID</span>
          <span className="mono">{orderId}</span>
        </div>
        <div className="mc-receipt-row">
          <span>Payment Method</span>
          <span>{methodLabel}</span>
        </div>
        <div className="mc-receipt-row">
          <span>Timestamp</span>
          <span>{timestamp}</span>
        </div>
      </div>

      <div className="mc-outcome-actions">
        <button
          type="button"
          className="mc-secondary-btn"
          onClick={() =>
            downloadReceiptFile({
              merchantName,
              orderId,
              paymentId,
              amountFormatted: formattedAmount,
              methodLabel,
              timestamp,
              statusLabel: "SUCCESS",
            })
          }
        >
          Download Receipt
        </button>
        <button type="button" className="mc-pay-btn" style={{ width: "auto" }} onClick={onReturnToMerchant}>
          Return to Merchant
        </button>
      </div>
    </div>
  );
}
