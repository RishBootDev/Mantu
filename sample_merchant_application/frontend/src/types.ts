export type PaymentMethod = "CARD" | "UPI" | "NETBANKING";

export interface Product {
  id: string;
  name: string;
  description: string;
  price_amount_units: number;
  currency: string;
  image_url: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_amount_units: number;
}

export interface Payment {
  id: string;
  mantu_payment_id: string | null;
  method: PaymentMethod;
  status: string;
  selected_route_id: string | null;
  error_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  receipt: string;
  mantu_order_id: string | null;
  mantu_key_id?: string | null;
  amount_units: number;
  currency: string;
  status: "PENDING_PAYMENT" | "PAID" | "PAYMENT_FAILED" | "CANCELLED";
  refund_state: string | null;
  items: OrderItem[];
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address?: string | null;
  customer_country?: string | null;
  created_at: string;
  updated_at: string;
  latest_payment: Payment | null;
}

export interface VerifyPaymentRequest {
  mantu_payment_id: string;
  mantu_order_id: string;
  mantu_signature: string;
                                   
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export interface MantuCheckoutResponse {
  mantu_payment_id: string;
  mantu_order_id: string;
  mantu_signature: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface CartLine {
  product_id: string;
  quantity: number;
}

export interface CustomerDetails {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_country: string;
}

export interface PayRequest {
  method: PaymentMethod;
  vpa?: string;
  bank?: string;
  pan?: string;
  cvv?: string;
  expiry_month?: number;
  expiry_year?: number;
  card_holder_name?: string;
  device_id?: string;
  ip_country?: string;
  billing_country?: string;
}
