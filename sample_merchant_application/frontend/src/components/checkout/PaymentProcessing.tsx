interface Props {
  message: string;
}

export function PaymentProcessing({ message }: Props) {
  return (
    <div className="mc-outcome" role="status" aria-live="polite">
      <div className="mc-spinner" aria-hidden="true" />
      <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 6px", color: "#0f172a" }}>
        Processing Payment
      </h3>
      <p style={{ fontSize: "13.5px", color: "#475569", margin: 0 }}>{message}</p>
      <p style={{ fontSize: "12px", color: "#64748b", marginTop: "14px" }}>
        Please do not close or refresh this window.
      </p>
    </div>
  );
}
