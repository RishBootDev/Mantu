import type { CartLine, CustomerDetails, Order, PayRequest, Product, VerifyPaymentRequest } from "../types";

const BASE = import.meta.env.VITE_API_BASE ?? "";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      signal,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new ApiError(0, "network", "We couldn't reach the store server. Check your connection and try again.");
  }
  if (!res.ok) {
    let body: { code?: string; message?: string; field_errors?: { field: string; message: string }[] } = {};
    try {
      body = await res.json();
    } catch {
                          
    }
    const fields: Record<string, string> = {};
    for (const f of body.field_errors ?? []) fields[f.field] = f.message;
    throw new ApiError(res.status, body.code ?? "error", body.message ?? "Something went wrong. Please try again.", fields);
  }
  return (await res.json()) as T;
}

export const getCatalog = (signal?: AbortSignal) => request<Product[]>("/api/catalog", {}, signal);

export const createOrder = (items: CartLine[], customer: CustomerDetails, signal?: AbortSignal) =>
  request<Order>("/api/checkout/orders", { method: "POST", body: JSON.stringify({ items, ...customer }) }, signal);

export const payOrder = (orderId: string, body: PayRequest, signal?: AbortSignal) =>
  request<Order>(`/api/checkout/orders/${encodeURIComponent(orderId)}/pay`, { method: "POST", body: JSON.stringify(body) }, signal);

export const verifyPayment = (orderId: string, body: VerifyPaymentRequest, signal?: AbortSignal) =>
  request<Order>(`/api/checkout/orders/${encodeURIComponent(orderId)}/verify`, { method: "POST", body: JSON.stringify(body) }, signal);

export const getOrder = (orderId: string, signal?: AbortSignal) =>
  request<Order>(`/api/orders/${encodeURIComponent(orderId)}`, {}, signal);

export const listOrders = (signal?: AbortSignal) => request<Order[]>("/api/orders", {}, signal);
