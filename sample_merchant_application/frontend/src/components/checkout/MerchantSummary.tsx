import { useState } from "react";
import { formatAmount } from "../../format";
import type { MantuCheckoutOptions } from "./checkoutTypes";
import { getInitials } from "./checkoutUtils";

interface MerchantSummaryProps {
  options: MantuCheckoutOptions;
  onCopyOrderId: (orderId: string) => void;
}

export function MerchantSummary({ options, onCopyOrderId }: MerchantSummaryProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const merchantName = options.name || "Deskwell";
  const currency = options.currency || "INR";
  const items = options.order?.items ?? [];
  const subtotalUnits =
    items.length > 0
      ? items.reduce((sum, item) => sum + item.unit_amount_units * item.quantity, 0)
      : options.amount;
  const taxAndDiscountDelta = options.amount - subtotalUnits;
  const email = options.order?.customer_email || options.prefill?.email;
  const phone = options.order?.customer_phone || options.prefill?.contact;
  const address = options.order?.customer_address;

  return (
    <aside className="mc-left" aria-label="Order and merchant summary">
      <div>
        <div className="mc-mantu-brand">
          <div className="mc-mantu-wordmark-wrap">
            <span className="mc-mantu-wordmark">Mantu</span>
            <span className="mc-mantu-sub">Payment&nbsp;Gateway</span>
          </div>
          <span className="mc-test-pill">Test Mode</span>
        </div>

        <div className="mc-merchant-card">
          <div className="mc-merchant-avatar" aria-hidden="true">
            {getInitials(merchantName)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="mc-merchant-name">{merchantName}</div>
            <div className="mc-merchant-desc">
              {options.description || `Order #${options.order_id.slice(-8)}`}
            </div>
          </div>
        </div>

        <div className="mc-amount-block">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <div>
              <div className="mc-amount-label">Total Payable</div>
              <div className="mc-amount-value">{formatAmount(options.amount, currency)}</div>
            </div>
            <button
              type="button"
              className="mc-mobile-summary-toggle"
              onClick={() => setMobileExpanded((v) => !v)}
              aria-expanded={mobileExpanded}
            >
              {mobileExpanded ? "Hide details" : "Order details"}
            </button>
          </div>

          <div className="mc-order-meta">
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Order: <code style={{ fontSize: "11px" }}>{options.order_id}</code>
            </span>
            <button
              type="button"
              className="mc-copy-btn"
              onClick={() => onCopyOrderId(options.order_id)}
              aria-label="Copy Order ID"
            >
              Copy
            </button>
          </div>
        </div>

        <div className={`mc-left-collapsible ${mobileExpanded ? "" : "collapsed"}`}>
          {items.length > 0 && (
            <div>
              <div className="mc-section-title">Order Summary</div>
              <ul className="mc-items-list">
                {items.map((item) => (
                  <li key={item.product_id} className="mc-item-row">
                    <span>
                      {item.name} <span className="mc-item-qty">× {item.quantity}</span>
                    </span>
                    <span className="num">
                      {formatAmount(item.unit_amount_units * item.quantity, currency)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mc-breakdown">
                <div className="mc-breakdown-row">
                  <span>Subtotal</span>
                  <span className="num">{formatAmount(subtotalUnits, currency)}</span>
                </div>
                <div className="mc-breakdown-row">
                  <span>Taxes &amp; Charges</span>
                  <span className="num">
                    {taxAndDiscountDelta > 0
                      ? formatAmount(taxAndDiscountDelta, currency)
                      : "Included"}
                  </span>
                </div>
                {taxAndDiscountDelta < 0 && (
                  <div className="mc-breakdown-row" style={{ color: "#15803d" }}>
                    <span>Discount</span>
                    <span className="num">-{formatAmount(Math.abs(taxAndDiscountDelta), currency)}</span>
                  </div>
                )}
                <div className="mc-breakdown-row total">
                  <span>Total</span>
                  <span className="num">{formatAmount(options.amount, currency)}</span>
                </div>
              </div>
            </div>
          )}

          {(email || phone || address) && (
            <div className="mc-customer-box" aria-label="Customer contact details">
              {email && (
                <div className="mc-customer-row" title={email}>
                  <span aria-hidden="true">✉</span>
                  <span>{email}</span>
                </div>
              )}
              {phone && (
                <div className="mc-customer-row">
                  <span aria-hidden="true">☎</span>
                  <span>{phone}</span>
                </div>
              )}
              {address && (
                <div className="mc-customer-row" title={address}>
                  <span aria-hidden="true">📍</span>
                  <span>{address}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mc-left-footer">
        <div className="mc-secure-row">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>256-bit SSL Encrypted • PCI-DSS</span>
        </div>
        <div>Powered by Mantu Payment Gateway</div>
      </div>
    </aside>
  );
}
