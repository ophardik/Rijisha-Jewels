import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from '../toast';

const inr = (n) => `₹${n.toLocaleString('en-IN')}`;
const FREE_SHIPPING_ABOVE = 2999;
const SHIPPING_FEE = 99;

export default function Checkout() {
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: user?.name || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [payment, setPayment] = useState('COD');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <section className="section">
        <div className="container center empty-state">
          <h2 className="serif">Please log in to checkout</h2>
          <p className="muted">Your bag is saved — log in or create an account to place your order.</p>
          <Link to="/login?next=/checkout" className="btn btn-dark">Log In</Link>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="section">
        <div className="container center empty-state">
          <h2 className="serif">Your bag is empty</h2>
          <Link to="/shop" className="btn btn-dark">Start Shopping</Link>
        </div>
      </section>
    );
  }

  const shipping = total >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const placeOrder = async (e) => {
    e.preventDefault();
    setError('');
    setPlacing(true);
    try {
      const order = await api('/orders', {
        method: 'POST',
        body: {
          items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
          shipping: form,
          paymentMethod: payment,
        },
      });
      clear();
      toast('✓ Order placed successfully!');
      navigate('/orders', { state: { justPlaced: order._id } });
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="section-eyebrow">Almost There</span>
          <h2>Checkout</h2>
        </div>

        <form className="checkout-layout" onSubmit={placeOrder}>
          <div className="checkout-form">
            <h3 className="serif">Shipping Details</h3>
            <div className="field-grid">
              <label>Full Name<input required value={form.fullName} onChange={set('fullName')} placeholder="Your full name" /></label>
              <label>Phone<input required value={form.phone} onChange={set('phone')} placeholder="10-digit mobile number" pattern="[0-9]{10}" title="Enter a 10-digit phone number" /></label>
              <label className="wide">Address<input required value={form.address} onChange={set('address')} placeholder="House no., street, area" /></label>
              <label>City<input required value={form.city} onChange={set('city')} placeholder="City" /></label>
              <label>State<input required value={form.state} onChange={set('state')} placeholder="State" /></label>
              <label>Pincode<input required value={form.pincode} onChange={set('pincode')} placeholder="6-digit pincode" pattern="[0-9]{6}" title="Enter a 6-digit pincode" /></label>
            </div>

            <h3 className="serif">Payment Method</h3>
            <div className="pay-options">
              <label className={`pay-option ${payment === 'COD' ? 'selected' : ''}`}>
                <input type="radio" name="payment" value="COD" checked={payment === 'COD'} onChange={() => setPayment('COD')} />
                <b>Cash on Delivery</b>
                <span>Pay when your order arrives</span>
              </label>
              <label className={`pay-option ${payment === 'UPI' ? 'selected' : ''}`}>
                <input type="radio" name="payment" value="UPI" checked={payment === 'UPI'} onChange={() => setPayment('UPI')} />
                <b>UPI</b>
                <span>Pay on delivery via UPI</span>
              </label>
            </div>
          </div>

          <aside className="cart-summary">
            <h3 className="serif">Order Summary</h3>
            {items.map((i) => (
              <div className="sum-row small" key={i.productId}>
                <span>{i.name} × {i.qty}</span><b>{inr(i.price * i.qty)}</b>
              </div>
            ))}
            <div className="sum-row"><span>Subtotal</span><b>{inr(total)}</b></div>
            <div className="sum-row"><span>Shipping</span><b>{shipping === 0 ? 'Free' : inr(shipping)}</b></div>
            <div className="sum-row grand"><span>Total</span><b>{inr(total + shipping)}</b></div>
            {error && <p className="form-error">{error}</p>}
            <button className="btn btn-dark full" disabled={placing}>
              {placing ? 'Placing Order…' : `Place Order · ${inr(total + shipping)}`}
            </button>
          </aside>
        </form>
      </div>
    </section>
  );
}
