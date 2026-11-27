import { useState } from "react";
import { formatAmount } from "../../format";
import { BankLogo, WalletLogo } from "./BrandLogos";

const CARD_EMI_BANKS = [
  { code: "HDFC", name: "HDFC Bank Credit Card EMI", rate: 15 },
  { code: "ICIC", name: "ICICI Bank Credit Card EMI", rate: 15 },
  { code: "SBIN", name: "SBI Card EMI", rate: 14 },
  { code: "UTIB", name: "Axis Bank Credit Card EMI", rate: 15.5 },
  { code: "KKBK", name: "Kotak Mahindra Bank EMI", rate: 16 },
];

const CARDLESS_EMI_PROVIDERS = [
  { code: "bajaj", name: "Bajaj Finserv EMI", rate: 0 },
  { code: "HDFC", name: "HDFC FlexiPay Cardless", rate: 14 },
  { code: "ICIC", name: "ICICI PayLater EMI", rate: 14 },
];

const TENURES = [3, 6, 9, 12];

interface Props {
  amount: number;
  currency: string;
  selectedProvider: string;
  onSelectProvider: (code: string) => void;
  selectedTenure: number;
  onSelectTenure: (months: number) => void;
  errorMessage: string | null;
  onPay: () => void;
}

export function EmiPayment({
  amount,
  currency,
  selectedProvider,
  onSelectProvider,
  selectedTenure,
  onSelectTenure,
  errorMessage,
  onPay,
}: Props) {
  const [emiTab, setEmiTab] = useState<"CARD_EMI" | "CARDLESS">("CARD_EMI");

  const providers = emiTab === "CARD_EMI" ? CARD_EMI_BANKS : CARDLESS_EMI_PROVIDERS;
  const activeProvider = providers.find((p) => p.code === selectedProvider) || providers[0];
  const monthlyUnits = Math.round(
    (amount * (1 + (activeProvider.rate / 100) * (selectedTenure / 12))) / selectedTenure,
  );

  return (
    <div className="mc-panel">
      <div className="mc-panel-body">
        <div>
          <h3 className="mc-panel-heading">EMI</h3>
          <p className="mc-panel-sub">Pay in easy monthly installments</p>
        </div>

        {errorMessage && (
          <div className="mc-inline-error" role="alert">
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mc-seg" role="tablist" aria-label="EMI type">
          <button
            type="button"
            role="tab"
            aria-selected={emiTab === "CARD_EMI"}
            className={`mc-seg-btn ${emiTab === "CARD_EMI" ? "active" : ""}`}
            onClick={() => {
              setEmiTab("CARD_EMI");
              onSelectProvider(CARD_EMI_BANKS[0].code);
            }}
          >
            Credit Card EMI
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={emiTab === "CARDLESS"}
            className={`mc-seg-btn ${emiTab === "CARDLESS" ? "active" : ""}`}
            onClick={() => {
              setEmiTab("CARDLESS");
              onSelectProvider(CARDLESS_EMI_PROVIDERS[0].code);
            }}
          >
            Cardless &amp; PayLater
          </button>
        </div>

        <div className="mc-bank-list" role="listbox" aria-label="EMI providers" style={{ maxHeight: "155px" }}>
          {providers.map((provider) => {
            const active = activeProvider.code === provider.code;
            return (
              <button
                key={provider.code}
                type="button"
                role="option"
                aria-selected={active}
                className={`mc-bank-list-item ${active ? "active" : ""}`}
                onClick={() => onSelectProvider(provider.code)}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                  {provider.code === "bajaj" ? (
                    <WalletLogo id="bajaj" size={22} />
                  ) : (
                    <BankLogo code={provider.code} size={22} />
                  )}
                  <span>{provider.name}</span>
                </span>
                <span style={{ fontSize: "11px", fontWeight: 600, color: provider.rate === 0 ? "#15803d" : "#64748b" }}>
                  {provider.rate === 0 ? "No Cost EMI" : `${provider.rate}% p.a.`}
                </span>
              </button>
            );
          })}
        </div>

        <div>
          <div className="mc-label" style={{ marginBottom: "6px" }}>
            Select Tenure
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px" }}>
            {TENURES.map((months) => {
              const planMonthly = Math.round(
                (amount * (1 + (activeProvider.rate / 100) * (months / 12))) / months,
              );
              const active = selectedTenure === months;
              return (
                <button
                  key={months}
                  type="button"
                  onClick={() => onSelectTenure(months)}
                  style={{
                    textAlign: "left",
                    padding: "9px 10px",
                    borderRadius: "8px",
                    border: active ? "1.5px solid #1d4ed8" : "1px solid #e2e8f0",
                    background: active ? "#eff6ff" : "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#0f172a" }}>
                    {formatAmount(planMonthly, currency)}/mo
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>
                    for {months} months
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mc-pay-footer">
        <button type="button" className="mc-pay-btn" onClick={onPay}>
          Continue • {formatAmount(monthlyUnits, currency)}/mo × {selectedTenure}m
        </button>
        <div className="mc-terms">
          Total payable {formatAmount(monthlyUnits * selectedTenure, currency)} via {activeProvider.name}
        </div>
      </div>
    </div>
  );
}
