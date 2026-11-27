import { WALLET_PREVIEW_OPTIONS } from "./checkoutConstants";
import type { CheckoutNavMethod } from "./checkoutTypes";

interface Props {
  method: "WALLET" | "EMI";
  onSwitchMethod: (method: CheckoutNavMethod) => void;
}

export function UnavailableMethod({ method, onSwitchMethod }: Props) {
  const isWallet = method === "WALLET";
  return (
    <div className="mc-panel">
      <div className="mc-panel-body">
        <div>
          <h3 className="mc-panel-heading">{isWallet ? "Wallets" : "EMI Options"}</h3>
          <p className="mc-panel-sub">
            {isWallet
              ? "Digital wallets are not enabled for this merchant account."
              : "EMI installments are not supported by the current gateway configuration."}
          </p>
        </div>

        <div
          style={{
            border: "1px dashed #cbd5e1",
            borderRadius: "10px",
            padding: "16px",
            background: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
            {isWallet ? "Wallet providers (currently disabled)" : "EMI plans unavailable"}
          </div>

          {isWallet ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", opacity: 0.6 }}>
              {WALLET_PREVIEW_OPTIONS.map((w) => (
                <div
                  key={w.id}
                  style={{
                    padding: "9px 10px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    fontSize: "12px",
                    color: "#64748b",
                  }}
                >
                  {w.name}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: "12.5px", color: "#64748b", lineHeight: 1.5 }}>
              Use UPI, Credit/Debit Card, or Net Banking to complete this order immediately.
            </div>
          )}
        </div>
      </div>

      <div className="mc-pay-footer" style={{ display: "flex", gap: "8px" }}>
        <button type="button" className="mc-pay-btn" onClick={() => onSwitchMethod("UPI")}>
          Pay with UPI instead
        </button>
        <button type="button" className="mc-secondary-btn" onClick={() => onSwitchMethod("CARD")}>
          Use Card
        </button>
      </div>
    </div>
  );
}
