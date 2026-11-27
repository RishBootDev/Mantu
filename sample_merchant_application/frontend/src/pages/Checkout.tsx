import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ApiError, createOrder } from "../api/merchantApi";
import Field from "../components/checkout/Field";
import { useCart } from "../context/CartContext";
import { formatAmount } from "../format";
import type { CustomerDetails } from "../types";

type Errors = Record<string, string>;

function validate(c: CustomerDetails): Errors {
  const e: Errors = {};
  if (!c.customer_name.trim()) e.customer_name = "Enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.customer_email)) e.customer_email = "Enter a valid email address.";
  if (!/^\+?[0-9]{8,15}$/.test(c.customer_phone.replace(/[\s-]/g, ""))) e.customer_phone = "Enter a valid phone number, e.g. +919876543210.";
  if (!c.customer_address.trim()) e.customer_address = "Enter your delivery address.";
  return e;
}

const COUNTRIES = [
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "SG", name: "Singapore" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "DE", name: "Germany" },
  { code: "AU", name: "Australia" },
  { code: "CA", name: "Canada" },
];

export default function Checkout() {
  const { lines, products, loading, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState<CustomerDetails>({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_address: "",
    customer_country: "IN",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  if (loading) return <p role="status">Loading…</p>;
  if (lines.length === 0) return <Navigate to="/cart" replace />;

  const estimate = lines.reduce((s, l) => s + (products[l.product_id]?.price_amount_units ?? 0) * l.quantity, 0);

  const set = (k: keyof CustomerDetails) => (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (inFlight.current) return;
    const v = validate(form);
    setErrors(v);
    setFormError(null);
    if (Object.keys(v).length) return;

    inFlight.current = true;
    setBusy(true);
    try {
      const order = await createOrder(lines, { ...form, customer_phone: form.customer_phone.replace(/[\s-]/g, "") });
      clear();
      navigate(`/checkout/${order.id}/pay`, { replace: true });
    } catch (e) {
      const err = e as ApiError;
      setErrors(err.fieldErrors ?? {});
      setFormError(err.message);
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <section className="narrow">
      <h1>Your details</h1>
      <form onSubmit={onSubmit} noValidate>
        <Field label="Full name" name="customer_name" autoComplete="name" value={form.customer_name} onChange={set("customer_name")} error={errors.customer_name} />
        <Field label="Email" name="customer_email" type="email" autoComplete="email" value={form.customer_email} onChange={set("customer_email")} error={errors.customer_email} />
        <Field label="Phone" name="customer_phone" type="tel" autoComplete="tel" placeholder="+919876543210" value={form.customer_phone} onChange={set("customer_phone")} error={errors.customer_phone} />
        <Field label="Delivery address" name="customer_address" autoComplete="street-address" placeholder="House / Flat no., Street, City, PIN" value={form.customer_address} onChange={set("customer_address")} error={errors.customer_address} />
        <div className="field">
          <label htmlFor="f-customer_country">Country</label>
          <select
            id="f-customer_country"
            name="customer_country"
            value={form.customer_country}
            onChange={(e) => setForm({ ...form, customer_country: e.target.value })}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {formError && <p className="notice bad" role="alert">{formError}</p>}
        <p className="muted">Estimated total {formatAmount(estimate)}. You'll see the confirmed amount before paying.</p>
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Preparing your order…" : "Continue to payment"}</button>
      </form>
    </section>
  );
}
