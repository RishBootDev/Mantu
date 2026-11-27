import { formatAmount } from "../../format";
import { BankLogo, CardNetworkLogo, UpiAppLogo } from "./BrandLogos";
import { UPI_APPS } from "./checkoutConstants";
import type { CheckoutNavMethod, OperationalMethod } from "./checkoutTypes";

interface Props {
  amount: number;
  currency: string;
  onPayQuickQr: () => void;
  onSelectMethod: (method: CheckoutNavMethod) => void;
  onPayCardPreset: (method: OperationalMethod) => void;
}

export function RecommendedPayment({
  amount,
  currency,
  onPayQuickQr,
  onSelectMethod,
}: Props) {
  return (
    <div className="mc-panel">
      <div className="mc-panel-body">
        <div>
          <h3 className="mc-panel-heading">Recommended for you</h3>
          <p className="mc-panel-sub">Fastest checkout options with high success rates</p>
        </div>

        <div
          style={{
            border: "1.5px solid #bfdbfe",
            background: "#eff6ff",
            borderRadius: "10px",
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a" }}>
                UPI QR &amp; Instant Apps
              </div>
              <div style={{ fontSize: "12px", color: "#475569" }}>
                Pay directly with Google Pay, PhonePe, Paytm, or BHIM
              </div>
            </div>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#15803d",
                background: "#dcfce7",
                padding: "3px 8px",
                borderRadius: "99px",
              }}
            >
              Instant
            </span>
          </div>

          <div className="mc-upi-apps">
            {UPI_APPS.map((app) => (
              <button
                key={app.id}
                type="button"
                className="mc-upi-app-btn"
                onClick={() => onSelectMethod("UPI")}
              >
                <UpiAppLogo id={app.id} size={26} />
                <span>{app.name}</span>
              </button>
            ))}
          </div>

          <button type="button" className="mc-pay-btn" onClick={onPayQuickQr}>
            Pay {formatAmount(amount, currency)} with UPI QR
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button
            type="button"
            className="mc-bank-list-item"
            style={{ border: "1px solid #e2e8f0", borderRadius: "9px", padding: "12px 14px" }}
            onClick={() => onSelectMethod("CARD")}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: "13px", color: "#0f172a" }}>Credit / Debit Card</div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "3px" }}>
                <CardNetworkLogo network="VISA" height={15} />
                <CardNetworkLogo network="MASTERCARD" height={15} />
                <CardNetworkLogo network="RUPAY" height={15} />
                <CardNetworkLogo network="AMEX" height={15} />
              </div>
            </div>
            <span aria-hidden="true" style={{ color: "#64748b", fontWeight: 700 }}>→</span>
          </button>

          <button
            type="button"
            className="mc-bank-list-item"
            style={{ border: "1px solid #e2e8f0", borderRadius: "9px", padding: "12px 14px" }}
            onClick={() => onSelectMethod("NETBANKING")}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: "13px", color: "#0f172a" }}>Net Banking</div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "3px" }}>
                <BankLogo code="HDFC" size={16} />
                <BankLogo code="SBIN" size={16} />
                <BankLogo code="ICIC" size={16} />
                <BankLogo code="UTIB" size={16} />
                <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "2px" }}>&amp; 9 more banks</span>
              </div>
            </div>
            <span aria-hidden="true" style={{ color: "#64748b", fontWeight: 700 }}>→</span>
          </button>
        </div>
      </div>

      <div className="mc-pay-footer">
        <div className="mc-terms">
          By continuing, you authorize payment processing via Mantu Gateway.
        </div>
      </div>
    </div>
  );
}
