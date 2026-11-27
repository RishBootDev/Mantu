import { NavLink, Outlet } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Layout() {
  const { count } = useCart();
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="topbar">
        <NavLink to="/" className="brand">deskwell</NavLink>
        <nav aria-label="Main">
          <NavLink to="/" end>Shop</NavLink>
          <NavLink to="/orders">Orders</NavLink>
          <NavLink to="/cart" className="cart-link">
            Cart <span className="count" aria-label={`${count} items in cart`}>{count}</span>
          </NavLink>
        </nav>
      </header>
      <div className="testbar" role="note">Test mode: payments run against the Mantu simulator. No real money moves.</div>
      <main id="main"><Outlet /></main>
    </>
  );
}
