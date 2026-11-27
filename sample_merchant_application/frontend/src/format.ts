const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

                                                     
export function formatAmount(units: number, currency = "INR"): string {
  if (currency !== "INR") return `${(units / 100).toFixed(2)} ${currency}`;
  return inr.format(units / 100);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

const PENDING = new Set(["INITIATING", "AUTHORIZING", "AUTHORIZED"]);
const SUCCESS = new Set(["CAPTURED", "SETTLED", "REFUNDED", "PARTIALLY_REFUNDED"]);

export const isPendingStatus = (s: string | undefined | null) => !!s && PENDING.has(s);
export const isSuccessStatus = (s: string | undefined | null) => !!s && SUCCESS.has(s);

export const STATUS_LABEL: Record<string, string> = {
  INITIATING: "Confirming",
  AUTHORIZING: "Confirming",
  AUTHORIZED: "Authorized",
  CAPTURED: "Paid",
  SETTLED: "Paid",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  AUTH_EXPIRED: "Expired",
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Partially refunded",
  PENDING_PAYMENT: "Awaiting payment",
  PAID: "Paid",
  PAYMENT_FAILED: "Payment failed",
};
