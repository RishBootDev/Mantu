import { useState } from "react";
import { formatAmount } from "../../format";
import { CardNetworkLogo } from "./BrandLogos";
import { detectCardNetwork, maskCardNumber } from "./checkoutUtils";

interface Props {
  amount: number;
  currency: string;
  pan: string;
  onChangePan: (val: string) => void;
  expiry: string;
  onChangeExpiry: (val: string) => void;
  cvv: string;
  onChangeCvv: (val: string) => void;
  holder: string;
  onChangeHolder: (val: string) => void;
  saveCard: boolean;
  onChangeSaveCard: (val: boolean) => void;
  errorMessage: string | null;
  onPay: () => void;
}

export function CardPayment({
  amount,
  currency,
  pan,
  onChangePan,
  expiry,
  onChangeExpiry,
  cvv,
  onChangeCvv,
  holder,
  onChangeHolder,
  saveCard,
  onChangeSaveCard,
  errorMessage,
  onPay,
}: Props) {
  const [showCvv, setShowCvv] = useState(false);
  const network = detectCardNetwork(pan);

  return (
    <div className="mc-panel">
      <div className="mc-panel-body">
        <div>
          <h3 className="mc-panel-heading">Credit / Debit Card</h3>
          <p className="mc-panel-sub">Tokenized securely via Mantu Vault</p>
        </div>

        {errorMessage && (
          <div className="mc-inline-error" role="alert">
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mc-card-preview" aria-hidden="true">
          <div className="mc-card-preview-top">
            <span>MANTU VAULT</span>
            <span className="mc-card-network-tag">{network}</span>
          </div>
          <div className="mc-card-preview-pan">{maskCardNumber(pan)}</div>
          <div className="mc-card-preview-bottom">
            <span style={{ textTransform: "uppercase" }}>{holder.trim() || "CARDHOLDER NAME"}</span>
            <span>{expiry || "MM/YY"}</span>
          </div>
        </div>

        <div className="mc-input-group">
          <div className="mc-label-row">
            <label htmlFor="mc-card-pan" className="mc-label">
              Card Number
            </label>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <CardNetworkLogo network={network} height={16} />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#1d4ed8" }}>{network}</span>
            </span>
          </div>
          <input
            id="mc-card-pan"
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            className="mc-input mono"
            value={pan}
            onChange={(e) => onChangePan(e.target.value)}
            placeholder="4111 1111 1111 1111"
            maxLength={23}
          />
        </div>

        <div className="mc-row-2">
          <div className="mc-input-group">
            <label htmlFor="mc-card-exp" className="mc-label">
              Expiry (MM/YY)
            </label>
            <input
              id="mc-card-exp"
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp"
              className="mc-input"
              value={expiry}
              onChange={(e) => onChangeExpiry(e.target.value)}
              placeholder="MM/YY"
              maxLength={5}
            />
          </div>

          <div className="mc-input-group">
            <div className="mc-label-row">
              <label htmlFor="mc-card-cvv" className="mc-label">
                CVV
              </label>
              <button
                type="button"
                className="mc-copy-btn"
                onClick={() => setShowCvv((v) => !v)}
                aria-label={showCvv ? "Hide CVV" : "Show CVV"}
              >
                {showCvv ? "Hide" : "Show"}
              </button>
            </div>
            <input
              id="mc-card-cvv"
              type={showCvv ? "text" : "password"}
              inputMode="numeric"
              autoComplete="cc-csc"
              className="mc-input"
              value={cvv}
              onChange={(e) => onChangeCvv(e.target.value)}
              placeholder="123"
              maxLength={4}
            />
          </div>
        </div>

        <div className="mc-input-group">
          <label htmlFor="mc-card-holder" className="mc-label">
            Cardholder Name
          </label>
          <input
            id="mc-card-holder"
            type="text"
            autoComplete="cc-name"
            className="mc-input"
            value={holder}
            onChange={(e) => onChangeHolder(e.target.value)}
            placeholder="Name as on card"
          />
        </div>

        <label className="mc-checkbox-row">
          <input
            type="checkbox"
            checked={saveCard}
            onChange={(e) => onChangeSaveCard(e.target.checked)}
          />
          <span>Save card securely for faster checkout (demo only)</span>
        </label>

        <div className="mc-chips">
          <span style={{ fontSize: "11px", color: "#64748b" }}>Test cards:</span>
          <button
            type="button"
            className="mc-chip"
            onClick={() => {
              onChangePan("4111 1111 1111 1111");
              onChangeExpiry("12/28");
            }}
          >
            Visa Success
          </button>
          <button
            type="button"
            className="mc-chip danger"
            onClick={() => {
              onChangePan("4000 0000 0000 0002");
              onChangeExpiry("12/28");
            }}
          >
            Bank Decline
          </button>
        </div>
      </div>

      <div className="mc-pay-footer">
        <button type="button" className="mc-pay-btn" onClick={onPay}>
          Pay Securely {formatAmount(amount, currency)}
        </button>
        <div className="mc-terms">Card details are tokenized in-memory and never stored</div>
      </div>
    </div>
  );
}
