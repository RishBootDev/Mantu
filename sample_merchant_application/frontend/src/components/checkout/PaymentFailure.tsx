import { formatAmount } from "../../format";

interface Props {
  amount: number;
  currency: string;
  orderId: string;
  reason: string | null;
  onRetry: () => void;
  onSwitchMethod: () => void;
}

export function PaymentFailure({
  amount,
  currency,
  orderId,
  reason,
  onRetry,
  onSwitchMethod,
}: Props) {
  return (
    <div className="mc-outcome" role="alert">
      <img src="/payment_error.gif" alt="Payment failed" className="mc-outcome-gif" />
      <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#b91c1c", margin: "4px 0 6px" }}>
        Payment Failed
      </h3>
      <p style={{ fontSize: "13.5px", color: "#475569", margin: "0 0 14px", maxWidth: "360px", lineHeight: 1.5 }}>
        {reason || "The transaction could not be completed. Please try again or use another payment method."}
      </p>

      <div className="mc-receipt-box">
        <div className="mc-receipt-row">
          <span>Order ID</span>
          <span className="mono">{orderId}</span>
        </div>
        <div className="mc-receipt-row">
          <span>Amount</span>
          <span>{formatAmount(amount, currency)}</span>
        </div>
      </div>

      <div className="mc-outcome-actions">
        <button type="button" className="mc-pay-btn" style={{ width: "auto" }} onClick={onRetry}>
          Retry Payment
        </button>
        <button type="button" className="mc-secondary-btn" onClick={onSwitchMethod}>
          Switch Payment Method
        </button>
      </div>
    </div>
  );
}
