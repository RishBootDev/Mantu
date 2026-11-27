import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getOrder } from "../api/merchantApi";
import StatusBadge from "../components/checkout/StatusBadge";
import { formatAmount, isPendingStatus, isSuccessStatus } from "../format";
import type { Order } from "../types";

const POLL_MS = 3000;
const POLL_LIMIT_MS = 2 * 60 * 1000;

export default function OrderResult() {
  const { orderId = "" } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gaveUp, setGaveUp] = useState(false);

 useEffect(() => {
    const ctrl = new AbortController();
    const started = Date.now();
    let timer: number | undefined;

    const tick = async () => {
      try {
        const o = await getOrder(orderId, ctrl.signal);
        setOrder(o);
        setError(null);
        const waiting = isPendingStatus(o.latest_payment?.status);
        if (waiting && Date.now() - started < POLL_LIMIT_MS) timer = window.setTimeout(tick, POLL_MS);
        else if (waiting) setGaveUp(true);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError((e as Error).message);
      }
    };
    tick();
    return () => {
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, [orderId]);

  if (error && !order) return (
    <section className="narrow">
      <p className="notice bad" role="alert">{error}</p>
      <Link to="/orders" className="btn">View orders</Link>
    </section>
  );
  if (!order) return <p role="status">Loading your order…</p>;

  const pay = order.latest_payment;
  const status = pay?.status ?? "";
  const paid = order.status === "PAID" || isSuccessStatus(status);
  const pending = !paid && isPendingStatus(status);
  const failed = !paid && !pending && (order.status === "PAYMENT_FAILED" || !!pay);

  let headline = "Payment not started";
  let tone = "wait";
  let detail = "This order is waiting for a payment.";
  if (paid) {
    headline = "Payment received"; tone = "ok";
    detail = order.refund_state === "REFUNDED" ? "This order has been refunded."
      : order.refund_state === "PARTIALLY_REFUNDED" ? "This order has been partially refunded."
      : order.customer_address
        ? `Thanks! Your order is confirmed. We will deliver the product to ${order.customer_address} shortly.`
        : "Thanks! Your order is confirmed. We will deliver your product shortly.";
  } else if (pending) {
    headline = "Payment is being confirmed"; tone = "wait";
    detail = gaveUp ? "This is taking longer than usual. You can leave this page; the order list will update when confirmation arrives."
      : "Hang tight. This page updates on its own.";
  } else if (failed) {
    headline = "Payment didn't go through"; tone = "bad";
    detail = pay?.error_description ?? "Payment could not be completed. Try another method.";
  }

  return (
    <section className="narrow">
      <div className={`result result-${tone}`} role="status" aria-live="polite" style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
        {paid && (
          <img
            src="/payment_successful.gif"
            alt="Payment Successful"
            style={{ width: "80px", height: "80px", objectFit: "contain", flexShrink: 0 }}
          />
        )}
        {failed && (
          <img
            src="/payment_error.gif"
            alt="Payment Failed"
            style={{ width: "80px", height: "80px", objectFit: "contain", flexShrink: 0 }}
          />
        )}
        <div>
          {pending && !gaveUp && <span className="spinner" aria-hidden="true" />}
          <h1>{headline}</h1>
          <p>{detail}</p>
        </div>
      </div>

      <dl className="facts">
        <dt>Order ID</dt><dd className="mono">{order.mantu_order_id ?? "—"}</dd>
        <dt>Payment ID</dt><dd className="mono">{pay?.mantu_payment_id ?? "—"}</dd>
        <dt>Status</dt><dd>{pay ? <StatusBadge status={pay.status} /> : <StatusBadge status={order.status} />}</dd>
        <dt>Amount</dt><dd className="num">{formatAmount(order.amount_units, order.currency)}</dd>
        {pay && <><dt>Method</dt><dd>{pay.method === "NETBANKING" ? "Net Banking" : pay.method === "UPI" ? "UPI" : "Card"}</dd></>}
        {pay?.selected_route_id && <><dt>Route</dt><dd className="mono">{pay.selected_route_id}</dd></>}
        {order.customer_address && <><dt>Delivery address</dt><dd>{order.customer_address}</dd></>}
        <dt>Receipt</dt><dd className="mono">{order.receipt}</dd>
      </dl>

      <div className="actions">
        {(failed || order.status === "PENDING_PAYMENT") && !pending && (
          <Link className="btn btn-primary" to={`/checkout/${order.id}/pay`}>
            {failed ? "Try another method" : "Continue to payment"}
          </Link>
        )}
        <Link className="btn" to="/">Keep shopping</Link>
        <Link className="btn" to="/orders">Order history</Link>
      </div>
    </section>
  );
}
