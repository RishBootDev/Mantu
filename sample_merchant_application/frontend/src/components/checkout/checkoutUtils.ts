export type CardNetwork = "VISA" | "MASTERCARD" | "RUPAY" | "AMEX" | "CARD";

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function maskCardNumber(pan: string): string {
  const digits = pan.replace(/\D/g, "");
  if (!digits) return "••••  ••••  ••••  ••••";
  const last4 = digits.length >= 4 ? digits.slice(-4) : digits.padEnd(4, "•");
  return `••••  ••••  ••••  ${last4}`;
}

export function formatExpiryInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

export function detectCardNetwork(pan: string): CardNetwork {
  const clean = pan.replace(/\s/g, "");
  if (clean.startsWith("4")) return "VISA";
  if (/^(5[1-5]|2[2-7])/.test(clean)) return "MASTERCARD";
  if (/^(60|652|81|82|508)/.test(clean)) return "RUPAY";
  if (/^3[47]/.test(clean)) return "AMEX";
  return "CARD";
}

export function validateUpiVpa(vpa: string): string | null {
  const trimmed = vpa.trim();
  if (!trimmed) return "Enter your UPI ID, e.g. name@okicici.";
  if (!/^[A-Za-z0-9._\-]{2,256}@[A-Za-z][A-Za-z0-9]{1,63}$/.test(trimmed)) {
    return "Enter a valid UPI ID (e.g. name@okaxis or mobile@ybl).";
  }
  return null;
}

export function validateCardForm(
  pan: string,
  expiry: string,
  cvv: string,
  holder: string,
): string | null {
  const cleanPan = pan.replace(/\s/g, "");
  if (!/^\d{13,19}$/.test(cleanPan)) {
    return "Enter a valid 13 to 19 digit card number.";
  }
  if (!/^\d{2}\/\d{2}$/.test(expiry)) {
    return "Enter expiry date in MM/YY format.";
  }
  const [mmStr, yyStr] = expiry.split("/");
  const mm = Number(mmStr);
  const yyyy = 2000 + Number(yyStr);
  if (mm < 1 || mm > 12) {
    return "Enter a valid expiry month between 01 and 12.";
  }
  const now = new Date();
  if (yyyy < now.getFullYear() || (yyyy === now.getFullYear() && mm < now.getMonth() + 1)) {
    return "This card has expired. Please use another card.";
  }
  if (!/^\d{3,4}$/.test(cvv)) {
    return "Enter the 3 or 4 digit CVV on the back of your card.";
  }
  if (!holder.trim()) {
    return "Enter the cardholder name as printed on the card.";
  }
  return null;
}

export function generateDemoSignature(orderId: string, paymentId: string): string {
  let hash = 0;
  const str = `${orderId}|${paymentId}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return `mantu_sig_${hex}${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`.padEnd(
    64,
    "0",
  );
}

export function downloadReceiptFile(params: {
  merchantName: string;
  orderId: string;
  paymentId: string;
  amountFormatted: string;
  methodLabel: string;
  timestamp: string;
  statusLabel: string;
}): void {
  const lines = [
    "========================================",
    "         MANTU PAYMENT RECEIPT          ",
    "========================================",
    `Merchant       : ${params.merchantName}`,
    `Status         : ${params.statusLabel}`,
    `Amount Paid    : ${params.amountFormatted}`,
    `Transaction ID : ${params.paymentId}`,
    `Order ID       : ${params.orderId}`,
    `Payment Method : ${params.methodLabel}`,
    `Timestamp      : ${params.timestamp}`,
    "----------------------------------------",
    "Secured by Mantu Payment Gateway",
    "========================================",
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mantu-receipt-${params.paymentId || params.orderId}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "M";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
