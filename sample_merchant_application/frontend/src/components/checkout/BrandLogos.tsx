export function UpiAppLogo({ id, size = 26 }: { id: string; size?: number }) {
  switch (id) {
    case "gpay":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
          <path
            d="M23.5 16.2c0-.55-.05-1.08-.14-1.58H16v3h4.22c-.18.98-.74 1.81-1.57 2.37v1.96h2.54c1.49-1.37 2.31-3.39 2.31-5.75z"
            fill="#4285F4"
          />
          <path
            d="M16 23.8c2.11 0 3.88-.7 5.17-1.89l-2.54-1.96c-.7.47-1.6.75-2.63.75-2.02 0-3.74-1.37-4.35-3.2H9.03v2.02A7.8 7.8 0 0 0 16 23.8z"
            fill="#34A853"
          />
          <path
            d="M11.65 17.5a4.68 4.68 0 0 1 0-3V12.48H9.03a7.8 7.8 0 0 0 0 7.04l2.62-2.02z"
            fill="#FBBC05"
          />
          <path
            d="M16 11.3c1.15 0 2.18.4 2.99 1.17l2.24-2.24A7.77 7.77 0 0 0 16 8.2a7.8 7.8 0 0 0-6.97 4.28l2.62 2.02c.61-1.83 2.33-3.2 4.35-3.2z"
            fill="#EA4335"
          />
        </svg>
      );
    case "phonepe":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="#5F259F" />
          <path
            d="M21.2 12.2h-2.1l-2.8-3.4c-.3-.4-.8-.5-1.3-.3l-1.3.5 3.1 3.2H10.5c-.4 0-.7.3-.7.7v1.4c0 .4.3.7.7.7h1.4v4.6c0 2.2 1.2 3.5 3.1 3.5 1.1 0 1.9-.4 2.5-.9v1.2c0 .4.3.7.7.7h1.6c.4 0 .7-.3.7-.7v-8.4h.7c.4 0 .7-.3.7-.7v-1.4c0-.4-.3-.7-.7-.7zm-3.7 7.7c-.5.4-1.1.7-1.7.7-.9 0-1.4-.6-1.4-1.6v-4h3.1v4.9z"
            fill="#ffffff"
          />
        </svg>
      );
    case "paytm":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
          <rect x="4" y="10" width="24" height="12" rx="3" fill="#002970" />
          <text x="10.8" y="18.3" fill="#ffffff" fontSize="6.8" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
            Pay
          </text>
          <text x="21.5" y="18.3" fill="#00BAF2" fontSize="6.8" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
            tm
          </text>
        </svg>
      );
    case "bhim":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
          <polygon points="10,7 19,16 10,25 13.5,25 22.5,16 13.5,7" fill="#F37021" />
          <polygon points="14.5,7 23.5,16 14.5,25 17.5,25 26.5,16 17.5,7" fill="#008C45" />
        </svg>
      );
    default:
      return null;
  }
}

export function WalletLogo({ id, size = 26 }: { id: string; size?: number }) {
  switch (id) {
    case "paytm_w":
      return <UpiAppLogo id="paytm" size={size} />;
    case "phonepe_w":
      return <UpiAppLogo id="phonepe" size={size} />;
    case "amazon_pay":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="#232F3E" />
          <text x="16" y="16" fill="#ffffff" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
            a
          </text>
          <path d="M8 20.5c4.5 3 11.5 3 16 0" fill="none" stroke="#FF9900" strokeWidth="2.2" strokeLinecap="round" />
          <polygon points="23.5,19 26,20.5 23,22.5" fill="#FF9900" />
        </svg>
      );
    case "mobikwik":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="#0070BA" />
          <path d="M7 22V10l5.5 7L18 10v12" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="24" cy="19" r="2.5" fill="#00D09C" />
        </svg>
      );
    case "freecharge":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="#E3714D" />
          <path d="M18 7l-7 10h5l-2 8 7-10h-5l2-8z" fill="#ffffff" />
        </svg>
      );
    case "bajaj":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="#0072BC" />
          <text x="16" y="19.5" fill="#ffffff" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
            BF
          </text>
        </svg>
      );
    default:
      return null;
  }
}

export function BankLogo({ code, size = 26 }: { code: string; size?: number }) {
  switch (code) {
    case "HDFC":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="#ED232A" />
          <rect x="6" y="6" width="20" height="20" fill="#ffffff" />
          <rect x="10" y="10" width="12" height="12" fill="#ED232A" />
          <rect x="14" y="4" width="4" height="24" fill="#ffffff" />
          <rect x="4" y="14" width="24" height="4" fill="#ffffff" />
          <rect x="12.5" y="12.5" width="7" height="7" fill="#004C8F" />
        </svg>
      );
    case "SBIN":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="#00A9E0" />
          <circle cx="16" cy="16" r="9.5" fill="#ffffff" />
          <circle cx="16" cy="14" r="3" fill="#280071" />
          <rect x="14.7" y="15.5" width="2.6" height="10" fill="#280071" />
        </svg>
      );
    case "ICIC":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="#F37021" />
          <path d="M16 6c5.5 0 9.5 4 9.5 9.5S21.5 26 16 26s-9.5-4.5-9.5-10.5S10.5 6 16 6z" fill="#B02A30" />
          <path d="M16 9.5a6 6 0 0 1 6 6c0 3.6-2.7 6.5-6 6.5s-6-2.9-6-6.5a6 6 0 0 1 6-6z" fill="#ffffff" />
          <circle cx="16" cy="15.5" r="2.6" fill="#F37021" />
        </svg>
      );
    case "UTIB":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="#97144D" />
          <polygon points="16,6 25,24 20.5,24 16,14.5 11.5,24 7,24" fill="#ffffff" />
          <polygon points="16,17.5 18.8,24 13.2,24" fill="#ffffff" />
        </svg>
      );
    case "KKBK":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="#ED1C24" />
          <circle cx="11.5" cy="16" r="5" fill="none" stroke="#ffffff" strokeWidth="2.6" />
          <circle cx="20.5" cy="16" r="5" fill="none" stroke="#003874" strokeWidth="2.6" />
        </svg>
      );
    case "PUNB":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="#A20A3A" />
          <rect x="6" y="6" width="20" height="20" rx="4" fill="none" stroke="#F5A623" strokeWidth="2" />
          <text x="16" y="19.5" fill="#F5A623" fontSize="9.5" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
            PNB
          </text>
        </svg>
      );
    case "BARB_R":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="#F26522" />
          <path d="M9 10h8.5a4 4 0 0 1 0 8H9V10zm0 8h9a4 4 0 0 1 0 8H9v-8z" fill="none" stroke="#ffffff" strokeWidth="2.4" />
          <line x1="12" y1="8" x2="12" y2="24" stroke="#ffffff" strokeWidth="2.2" />
        </svg>
      );
    case "CNRB":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="#0072BC" />
          <polygon points="16,6 26,23 6,23" fill="#FFD200" />
          <polygon points="16,12 21,21 11,21" fill="#0072BC" />
        </svg>
      );
    case "UBIN":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="#E31E24" />
          <path d="M9 9v9a7 7 0 0 0 14 0V9h-3.5v9a3.5 3.5 0 0 1-7 0V9H9z" fill="#ffffff" />
          <rect x="13" y="7" width="6" height="4" rx="1" fill="#003366" />
        </svg>
      );
    case "INDB":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="#881B21" />
          <circle cx="16" cy="16" r="8" fill="none" stroke="#F5A623" strokeWidth="2.2" />
          <circle cx="16" cy="16" r="3" fill="#ffffff" />
        </svg>
      );
    case "YESB":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="#005BAA" />
          <path d="M8 10l8 7 8-7" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="16" y1="17" x2="16" y2="25" stroke="#ED1C24" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "IDFB":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="#9C1D26" />
          <rect x="7" y="7" width="8" height="8" rx="1.5" fill="#ffffff" />
          <rect x="17" y="7" width="8" height="8" rx="1.5" fill="#ffffff" opacity="0.7" />
          <rect x="7" y="17" width="8" height="8" rx="1.5" fill="#ffffff" opacity="0.7" />
          <rect x="17" y="17" width="8" height="8" rx="1.5" fill="#ffffff" />
        </svg>
      );
    case "FDRL":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="#004B87" />
          <rect x="7" y="9" width="18" height="3.5" rx="1.5" fill="#FDB913" />
          <rect x="7" y="14.5" width="14" height="3.5" rx="1.5" fill="#ffffff" />
          <rect x="7" y="20" width="10" height="3.5" rx="1.5" fill="#FDB913" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="#1e293b" />
          <text x="16" y="19" fill="#ffffff" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">
            {code.slice(0, 3)}
          </text>
        </svg>
      );
  }
}

export function CardNetworkLogo({ network, height = 18 }: { network: string; height?: number }) {
  const width = Math.round(height * 1.6);
  switch (network.toUpperCase()) {
    case "VISA":
      return (
        <svg width={width} height={height} viewBox="0 0 40 24" aria-label="Visa">
          <rect width="40" height="24" rx="4" fill="#1A1F71" />
          <text x="20" y="16" fill="#ffffff" fontSize="11" fontWeight="800" fontStyle="italic" textAnchor="middle" fontFamily="sans-serif">
            VISA
          </text>
        </svg>
      );
    case "MASTERCARD":
      return (
        <svg width={width} height={height} viewBox="0 0 40 24" aria-label="Mastercard">
          <rect width="40" height="24" rx="4" fill="#1e293b" />
          <circle cx="15.5" cy="12" r="6.5" fill="#EB001B" />
          <circle cx="24.5" cy="12" r="6.5" fill="#F79E1B" fillOpacity="0.9" />
        </svg>
      );
    case "RUPAY":
      return (
        <svg width={width} height={height} viewBox="0 0 40 24" aria-label="RuPay">
          <rect width="40" height="24" rx="4" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
          <text x="17" y="15.5" fill="#094C8D" fontSize="8.5" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
            RuPay
          </text>
          <polygon points="31,7 36,12 31,17" fill="#F37021" />
        </svg>
      );
    case "AMEX":
      return (
        <svg width={width} height={height} viewBox="0 0 40 24" aria-label="Amex">
          <rect width="40" height="24" rx="4" fill="#006FCF" />
          <text x="20" y="15.5" fill="#ffffff" fontSize="8.5" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
            AMEX
          </text>
        </svg>
      );
    default:
      return null;
  }
}
