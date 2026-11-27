import type { BankOption, UpiAppOption } from "./checkoutTypes";

export const UPI_APPS: UpiAppOption[] = [
  { id: "gpay", name: "Google Pay", short: "GPay", accent: "#1a73e8", bg: "#eef4ff" },
  { id: "phonepe", name: "PhonePe", short: "Pe", accent: "#5f259f", bg: "#f4ecff" },
  { id: "paytm", name: "Paytm", short: "Paytm", accent: "#00baf2", bg: "#e8f8ff" },
  { id: "bhim", name: "BHIM", short: "BHIM", accent: "#f37021", bg: "#fff3eb" },
];

export const ALL_BANKS: BankOption[] = [
  { code: "HDFC", name: "HDFC Bank", badge: "HDFC", color: "#004c8f", popular: true },
  { code: "SBIN", name: "State Bank of India", badge: "SBI", color: "#280071", popular: true },
  { code: "ICIC", name: "ICICI Bank", badge: "ICICI", color: "#b02a30", popular: true },
  { code: "UTIB", name: "Axis Bank", badge: "AXIS", color: "#97144d", popular: true },
  { code: "KKBK", name: "Kotak Mahindra Bank", badge: "KOTAK", color: "#ed1c24", popular: true },
  { code: "PUNB", name: "Punjab National Bank", badge: "PNB", color: "#a20a3a", popular: true },
  { code: "BARB_R", name: "Bank of Baroda", badge: "BOB", color: "#f26522" },
  { code: "CNRB", name: "Canara Bank", badge: "CAN", color: "#0072bc" },
  { code: "UBIN", name: "Union Bank of India", badge: "UBI", color: "#e31e24" },
  { code: "INDB", name: "IndusInd Bank", badge: "IND", color: "#881b21" },
  { code: "YESB", name: "Yes Bank", badge: "YES", color: "#005baa" },
  { code: "IDFB", name: "IDFC FIRST Bank", badge: "IDFC", color: "#9c1d26" },
  { code: "FDRL", name: "Federal Bank", badge: "FED", color: "#004b87" },
];

export const POPULAR_BANKS = ALL_BANKS.filter((b) => b.popular);

export const WALLET_PREVIEW_OPTIONS = [
  { id: "paytm_w", name: "Paytm Wallet" },
  { id: "amazon_pay", name: "Amazon Pay" },
  { id: "mobikwik", name: "MobiKwik" },
  { id: "freecharge", name: "Freecharge" },
];
