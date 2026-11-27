import type { CheckoutNavMethod } from "./checkoutTypes";

interface NavItem {
  id: CheckoutNavMethod;
  label: string;
  sub: string;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "RECOMMENDED", label: "Recommended", sub: "Fastest options" },
  { id: "UPI", label: "UPI", sub: "GPay, PhonePe, QR" },
  { id: "CARD", label: "Cards", sub: "Visa, Mastercard, RuPay" },
  { id: "NETBANKING", label: "Net Banking", sub: "All Indian banks" },
  { id: "WALLET", label: "Wallets", sub: "PhonePe, Paytm, Amazon Pay" },
  { id: "EMI", label: "EMI", sub: "Card & Cardless EMI" },
];

function NavIcon({ id }: { id: CheckoutNavMethod }) {
  switch (id) {
    case "RECOMMENDED":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case "UPI":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case "CARD":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      );
    case "NETBANKING":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M3 21h18" />
          <path d="M3 10h18" />
          <path d="M5 6l7-3 7 3" />
          <path d="M4 10v11" />
          <path d="M12 10v11" />
          <path d="M20 10v11" />
        </svg>
      );
    case "WALLET":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
          <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
          <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
        </svg>
      );
    case "EMI":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
  }
}

interface Props {
  active: CheckoutNavMethod;
  onSelect: (method: CheckoutNavMethod) => void;
}

export function PaymentMethodNavigation({ active, onSelect }: Props) {
  return (
    <nav className="mc-nav" aria-label="Payment methods">
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`mc-nav-item ${isActive ? "active" : ""} ${item.disabled ? "disabled-method" : ""}`}
            onClick={() => onSelect(item.id)}
            aria-current={isActive ? "page" : undefined}
          >
            <NavIcon id={item.id} />
            <span className="mc-nav-label">
              <span>{item.label}</span>
              <span className="mc-nav-sub">{item.sub}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
