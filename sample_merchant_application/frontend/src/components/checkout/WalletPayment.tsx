import { formatAmount } from "../../format";
import { WalletLogo } from "./BrandLogos";

const WALLETS = [
  { id: "paytm_w", name: "Paytm Wallet", sub: "Paytm Postpaid & Wallet" },
  { id: "amazon_pay", name: "Amazon Pay", sub: "Amazon Pay Balance" },
  { id: "phonepe_w", name: "PhonePe Wallet", sub: "PhonePe Wallet & Gift Card" },
  { id: "mobikwik", name: "MobiKwik", sub: "MobiKwik ZIP & Wallet" },
  { id: "freecharge", name: "Freecharge", sub: "Freecharge Wallet" },
];

interface Props {
  amount: number;
  currency: string;
  selectedWallet: string;
  onSelectWallet: (id: string) => void;
  errorMessage: string | null;
  onPay: () => void;
}

export function WalletPayment({
  amount,
  currency,
  selectedWallet,
  onSelectWallet,
  errorMessage,
  onPay,
}: Props) {
  const current = WALLETS.find((w) => w.id === selectedWallet) || WALLETS[0];

  return (
    <div className="mc-panel">
      <div className="mc-panel-body">
        <div>
          <h3 className="mc-panel-heading">Wallets</h3>
          <p className="mc-panel-sub">Select a digital wallet to complete payment</p>
        </div>

        {errorMessage && (
          <div className="mc-inline-error" role="alert">
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mc-bank-list" role="listbox" aria-label="Wallets list" style={{ maxHeight: "260px" }}>
          {WALLETS.map((wallet) => {
            const active = selectedWallet === wallet.id;
            return (
              <button
                key={wallet.id}
                type="button"
                role="option"
                aria-selected={active}
                className={`mc-bank-list-item ${active ? "active" : ""}`}
                onClick={() => onSelectWallet(wallet.id)}
                style={{ padding: "11px 12px" }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                  <WalletLogo id={wallet.id} size={26} />
                  <span style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 600, fontSize: "13px", color: "#0f172a" }}>{wallet.name}</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>{wallet.sub}</div>
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "99px",
                    border: active ? "5px solid #1d4ed8" : "1.5px solid #cbd5e1",
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mc-pay-footer">
        <button type="button" className="mc-pay-btn" onClick={onPay}>
          Pay {formatAmount(amount, currency)} with {current.name}
        </button>
        <div className="mc-terms">Instant wallet authorization via Mantu Gateway</div>
      </div>
    </div>
  );
}
