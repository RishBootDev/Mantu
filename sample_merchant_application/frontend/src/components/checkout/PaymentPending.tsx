interface Props {
  paymentId: string;
  orderId: string;
  onCheckStatus: () => void;
  onViewOrder: () => void;
}

export function PaymentPending({ paymentId, orderId, onCheckStatus, onViewOrder }: Props) {
  return (
    <div className="mc-outcome" role="status" aria-live="polite">
      <div className="mc-spinner" aria-hidden="true" />
      <h3 style={{ fontSize: "19px", fontWeight: 800, color: "#92400e", margin: "0 0 6px" }}>
        Payment Pending Confirmation
      </h3>
      <p style={{ fontSize: "13px", color: "#475569", margin: "0 0 14px", maxWidth: "360px", lineHeight: 1.5 }}>
        We are waiting for final confirmation from the bank. You can check status now or view your order page.
      </p>

      <div className="mc-receipt-box">
        <div className="mc-receipt-row">
          <span>Transaction Reference</span>
          <span className="mono">{paymentId || "—"}</span>
        </div>
        <div className="mc-receipt-row">
          <span>Order ID</span>
          <span className="mono">{orderId}</span>
        </div>
        <div className="mc-receipt-row">
          <span>Status</span>
          <span style={{ color: "#92400e" }}>PENDING</span>
        </div>
      </div>

      <div className="mc-outcome-actions">
        <button type="button" className="mc-pay-btn" style={{ width: "auto" }} onClick={onCheckStatus}>
          Check Payment Status
        </button>
        <button type="button" className="mc-secondary-btn" onClick={onViewOrder}>
          View Order Status
        </button>
      </div>
    </div>
  );
}
