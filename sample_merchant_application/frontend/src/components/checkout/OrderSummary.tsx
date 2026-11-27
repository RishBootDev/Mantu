import { formatAmount } from "../../format";
import type { Order } from "../../types";

export default function OrderSummary({ order }: { order: Order }) {
  return (
    <aside className="summary" aria-label="Order summary">
      <h2>Your order</h2>
      <ul className="lines">
        {order.items.map((i) => (
          <li key={i.product_id}>
            <span>{i.name} <span className="muted">× {i.quantity}</span></span>
            <span className="num">{formatAmount(i.unit_amount_units * i.quantity, order.currency)}</span>
          </li>
        ))}
      </ul>
      <div className="total">
        <span>Total to pay</span>
        <strong className="num">{formatAmount(order.amount_units, order.currency)}</strong>
      </div>
      <p className="muted small">This amount was calculated by the store server from its own prices.</p>
    </aside>
  );
}
