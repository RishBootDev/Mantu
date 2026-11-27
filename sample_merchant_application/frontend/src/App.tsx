import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderHistory from "./pages/OrderHistory";
import OrderResult from "./pages/OrderResult";
import Pay from "./pages/Pay";
import Storefront from "./pages/Storefront";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Storefront />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="checkout/:orderId/pay" element={<Pay />} />
        <Route path="orders" element={<OrderHistory />} />
        <Route path="orders/:orderId/result" element={<OrderResult />} />
        <Route path="*" element={<p>Page not found.</p>} />
      </Route>
    </Routes>
  );
}
