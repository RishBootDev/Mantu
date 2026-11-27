import { formatAmount } from "../../format";
import { BankLogo } from "./BrandLogos";
import { ALL_BANKS, POPULAR_BANKS } from "./checkoutConstants";

interface Props {
  amount: number;
  currency: string;
  selectedBank: string;
  onSelectBank: (code: string) => void;
  bankSearch: string;
  onChangeSearch: (q: string) => void;
  errorMessage: string | null;
  onPay: () => void;
}

export function NetBankingPayment({
  amount,
  currency,
  selectedBank,
  onSelectBank,
  bankSearch,
  onChangeSearch,
  errorMessage,
  onPay,
}: Props) {
  const query = bankSearch.trim().toLowerCase();
  const filteredBanks = query
    ? ALL_BANKS.filter(
        (b) => b.name.toLowerCase().includes(query) || b.code.toLowerCase().includes(query),
      )
    : ALL_BANKS;

  const currentBankName = ALL_BANKS.find((b) => b.code === selectedBank)?.name || selectedBank;

  return (
    <div className="mc-panel">
      <div className="mc-panel-body">
        <div>
          <h3 className="mc-panel-heading">Net Banking</h3>
          <p className="mc-panel-sub">Select your bank to authorize payment</p>
        </div>

        {errorMessage && (
          <div className="mc-inline-error" role="alert">
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mc-input-group">
          <label htmlFor="mc-bank-search" className="mc-label">
            Search Bank
          </label>
          <input
            id="mc-bank-search"
            type="search"
            className="mc-input"
            value={bankSearch}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder="Search HDFC, SBI, ICICI, Axis…"
          />
        </div>

        {!query && (
          <div>
            <div className="mc-label" style={{ marginBottom: "8px" }}>
              Popular Banks
            </div>
            <div className="mc-bank-grid">
              {POPULAR_BANKS.map((bank) => (
                <button
                  key={bank.code}
                  type="button"
                  className={`mc-bank-tile ${selectedBank === bank.code ? "active" : ""}`}
                  onClick={() => onSelectBank(bank.code)}
                >
                  <div className="mc-bank-badge">
                    <BankLogo code={bank.code} size={28} />
                  </div>
                  <div className="mc-bank-name">{bank.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="mc-label" style={{ marginBottom: "6px" }}>
            {query ? "Matching Banks" : "All Supported Banks"}
          </div>
          <div className="mc-bank-list" role="listbox" aria-label="Banks list">
            {filteredBanks.length === 0 ? (
              <div style={{ padding: "12px", fontSize: "12px", color: "#64748b", textAlign: "center" }}>
                No banks matched "{bankSearch}"
              </div>
            ) : (
              filteredBanks.map((bank) => (
                <button
                  key={bank.code}
                  type="button"
                  role="option"
                  aria-selected={selectedBank === bank.code}
                  className={`mc-bank-list-item ${selectedBank === bank.code ? "active" : ""}`}
                  onClick={() => onSelectBank(bank.code)}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                    <BankLogo code={bank.code} size={20} />
                    <span>{bank.name}</span>
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: bank.color }}>{bank.badge}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mc-pay-footer">
        <button type="button" className="mc-pay-btn" onClick={onPay}>
          Continue with {currentBankName} • {formatAmount(amount, currency)}
        </button>
        <div className="mc-terms">You will be redirected to simulated bank authorization</div>
      </div>
    </div>
  );
}
