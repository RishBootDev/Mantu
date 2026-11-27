import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listOrders } from "../api/merchantApi";
import StatusBadge from "../components/checkout/StatusBadge";
import { formatAmount, formatDate } from "../format";
import type { Order } from "../types";

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    listOrders(ctrl.signal)
      .then(setOrders)
      .catch((e: Error) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => ctrl.abort();
  }, []);

  return (
    <section>
      <h1>Orders</h1>
      {error && <p className="notice bad" role="alert">{error}</p>}
      {!orders && !error && <p role="status">Loading orders…</p>}
      {orders && orders.length === 0 && (
        <p>No orders yet. <Link to="/">Browse the shop</Link>.</p>
      )}
      {orders && orders.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Placed</th><th>Receipt</th><th>Items</th><th className="r">Amount</th><th>Latest status</th><th /></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{formatDate(o.created_at)}</td>
                  <td className="mono">{o.receipt}</td>
                  <td>{o.items.map((i) => `${i.name} × ${i.quantity}`).join(", ")}</td>
                  <td className="r num">{formatAmount(o.amount_units, o.currency)}</td>
                  <td>
                    <StatusBadge status={o.latest_payment?.status ?? o.status} />
                    {o.refund_state && o.latest_payment?.status !== o.refund_state && <> <StatusBadge status={o.refund_state} /></>}
                  </td>
                  <td>
                    {o.status === "PENDING_PAYMENT" && !o.latest_payment
                      ? <Link to={`/checkout/${o.id}/pay`}>Pay now</Link>
                      : <Link to={`/orders/${o.id}/result`}>Details</Link>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
