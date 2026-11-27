import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getCatalog } from "../api/merchantApi";
import type { CartLine, Product } from "../types";

const KEY = "deskwell.cart.v1";
const MAX_QTY = 10;

interface Ctx {
  lines: CartLine[];
  products: Record<string, Product>;
  catalogError: string | null;
  loading: boolean;
  count: number;
  add: (productId: string) => void;
  setQuantity: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<Ctx | null>(null);


function load(): CartLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((l) => typeof l?.product_id === "string" && Number.isInteger(l?.quantity) && l.quantity > 0)
      .map((l) => ({ product_id: l.product_id, quantity: Math.min(l.quantity, MAX_QTY) }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(load);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    getCatalog(ctrl.signal)
      .then((list) => setProducts(Object.fromEntries(list.map((p) => [p.id, p]))))
      .catch((e: Error) => {
        if (e.name !== "AbortError") setCatalogError(e.message);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {

    }
  }, [lines]);


  useEffect(() => {
    if (loading || Object.keys(products).length === 0) return;
    setLines((cur) => (cur.some((l) => !products[l.product_id]) ? cur.filter((l) => products[l.product_id]) : cur));
  }, [loading, products]);

  const add = useCallback((id: string) => {
    setLines((cur) => {
      const found = cur.find((l) => l.product_id === id);
      if (!found) return [...cur, { product_id: id, quantity: 1 }];
      return cur.map((l) => (l.product_id === id ? { ...l, quantity: Math.min(l.quantity + 1, MAX_QTY) } : l));
    });
  }, []);

  const setQuantity = useCallback((id: string, qty: number) => {
    setLines((cur) =>
      qty <= 0 ? cur.filter((l) => l.product_id !== id) : cur.map((l) => (l.product_id === id ? { ...l, quantity: Math.min(qty, MAX_QTY) } : l)),
    );
  }, []);

  const remove = useCallback((id: string) => setLines((cur) => cur.filter((l) => l.product_id !== id)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<Ctx>(
    () => ({
      lines,
      products,
      catalogError,
      loading,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      add,
      setQuantity,
      remove,
      clear,
    }),
    [lines, products, catalogError, loading, add, setQuantity, remove, clear],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): Ctx {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

export const MAX_QUANTITY = MAX_QTY;
