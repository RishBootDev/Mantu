import { Link, useNavigate } from "react-router-dom";
import { MAX_QUANTITY, useCart } from "../context/CartContext";
import { formatAmount } from "../format";

export default function Cart() {
  const { lines, products, loading, setQuantity, remove } = useCart();
  const navigate = useNavigate();

  const rows = lines.flatMap((l) => (products[l.product_id] ? [{ line: l, product: products[l.product_id] }] : []));
  const subtotal = rows.reduce((sum, r) => sum + r.product.price_amount_units * r.line.quantity, 0);

  if (loading) return <p role="status">Loading your cart…</p>;
  if (rows.length === 0) {
    return (
      <section>
        <h1>Your cart is empty</h1>
        <p><Link to="/" className="btn">Browse products</Link></p>
      </section>
    );
  }

  return (
    <section>
      <h1>Cart</h1>
      <ul className="cart-lines">
        {rows.map(({ line, product }) => (
          <li key={product.id}>
            <img src={product.image_url} alt="" width={96} height={72} />
            <div className="grow">
              <strong>{product.name}</strong>
              <div className="muted num">{formatAmount(product.price_amount_units, product.currency)} each</div>
            </div>
            <div className="qty" role="group" aria-label={`Quantity for ${product.name}`}>
              <button aria-label="Decrease quantity" onClick={() => setQuantity(product.id, line.quantity - 1)}>−</button>
              <span className="num" aria-live="polite">{line.quantity}</span>
              <button aria-label="Increase quantity" disabled={line.quantity >= MAX_QUANTITY}
                onClick={() => setQuantity(product.id, line.quantity + 1)}>+</button>
            </div>
            <div className="line-total num">{formatAmount(product.price_amount_units * line.quantity, product.currency)}</div>
            <button className="link" onClick={() => remove(product.id)}>Remove</button>
          </li>
        ))}
      </ul>
      <div className="cart-foot">
        <div>
          <div className="muted">Subtotal</div>
          <div className="price num">{formatAmount(subtotal)}</div>
          <p className="muted small">The final amount is confirmed by the server at checkout.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/checkout")}>Check out</button>
      </div>
    </section>
  );
}
