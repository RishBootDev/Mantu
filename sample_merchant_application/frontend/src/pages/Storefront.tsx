import { useCart } from "../context/CartContext";
import { formatAmount } from "../format";

export default function Storefront() {
  const { products, loading, catalogError, add, lines } = useCart();
  const list = Object.values(products);

  return (
    <section>
      <h1>Workspace essentials</h1>
      <p className="lede">Curated audio, lighting, peripherals, and desk hardware for everyday focus.</p>

      {loading && <p role="status">Loading products…</p>}
      {catalogError && <p className="notice bad" role="alert">{catalogError}</p>}

      <ul className="grid">
        {list.map((p) => {
          const inCart = lines.find((l) => l.product_id === p.id)?.quantity ?? 0;
          return (
            <li key={p.id} className="card">
              <img src={p.image_url} alt={p.name} width={400} height={300} loading="lazy" />
              <div className="card-body">
                <h2>{p.name}</h2>
                <p className="muted">{p.description}</p>
                <div className="card-foot">
                  <span className="price num">{formatAmount(p.price_amount_units, p.currency)}</span>
                  <button className="btn" onClick={() => add(p.id)}>
                    Add to cart{inCart > 0 ? ` (${inCart})` : ""}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
