import type { MantuCheckoutResponse, Order, PayRequest } from "../../types";

export type CheckoutNavMethod =
  | "RECOMMENDED"
  | "UPI"
  | "CARD"
  | "NETBANKING"
  | "WALLET"
  | "EMI";

export type OperationalMethod = "UPI" | "CARD" | "NETBANKING" | "WALLET" | "EMI";

export type CheckoutScreenStatus =
  | "INPUT"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "PENDING";

export interface UpiAppOption {
  id: string;
  name: string;
  short: string;
  accent: string;
  bg: string;
}

export interface BankOption {
  code: string;
  name: string;
  badge: string;
  color: string;
  popular?: boolean;
}

export interface ToastNotice {
  id: number;
  message: string;
  tone: "info" | "success" | "error";
}

export interface MantuCheckoutOptions {
  key: string;
  order_id: string;
  amount: number;
  currency?: string;
  name?: string;
  description?: string;
  order?: Order;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  onPay?: (req: PayRequest) => Promise<Order>;
  onPollOrder?: () => Promise<Order>;
  onComplete?: (order: Order) => void;
  handler: (response: MantuCheckoutResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}
