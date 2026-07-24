import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Toaster from './components/Toaster';
import { SvgDefs } from './components/JewelArt';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
// Cart/checkout disabled for now — purchases happen on Etsy instead
// import Cart from './pages/Cart';
// import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
// Orders page disabled for now — ordering happens on Etsy; re-enable when on-site ordering returns
// import Orders from './pages/Orders';
import Wishlist from './pages/Wishlist';
import Rewards from './pages/Rewards';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import NotFound from './pages/NotFound';
import WhatsAppButton from './components/WhatsAppButton';

export default function App() {
  const location = useLocation();

  // The admin area is isolated from the storefront: no site header/footer,
  // so an unauthenticated visitor on /admin has nowhere to navigate but the login.
  const isAdminArea = location.pathname.startsWith('/admin');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname, location.search]);

  return (
    <>
      <SvgDefs />
      {!isAdminArea && <Header />}
      <main>
        <div className="route-fade" key={location.pathname}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          {/* <Route path="/cart" element={<Cart />} /> */}
          {/* <Route path="/checkout" element={<Checkout />} /> */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* <Route path="/orders" element={<Orders />} /> */}
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </div>
      </main>
      {!isAdminArea && <Footer />}
      {!isAdminArea && <WhatsAppButton />}
      <Toaster />
    </>
  );
}
