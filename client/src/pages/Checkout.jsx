import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from '../toast';
import { PAYMENT_METHOD } from '../enums';
import { STRINGS } from '../strings';

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
  const [payment, setPayment] = useState(PAYMENT_METHOD.COD);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <section className="section">
        <div className="container center empty-state">
          <h2 className="serif">{STRINGS.checkout.loginTitle}</h2>
          <p className="muted">{STRINGS.checkout.loginText}</p>
          <Link to="/login?next=/checkout" className="btn btn-dark">{STRINGS.common.logIn}</Link>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="section">
        <div className="container center empty-state">
          <h2 className="serif">{STRINGS.checkout.emptyTitle}</h2>
          <Link to="/shop" className="btn btn-dark">{STRINGS.common.startShopping}</Link>
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
      toast(STRINGS.checkout.orderPlaced);
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
          <span className="section-eyebrow">{STRINGS.checkout.eyebrow}</span>
          <h2>{STRINGS.checkout.title}</h2>
        </div>

        <form className="checkout-layout" onSubmit={placeOrder}>
          <div className="checkout-form">
            <h3 className="serif">{STRINGS.checkout.shippingDetails}</h3>
            <div className="field-grid">
              <label>{STRINGS.checkout.fullName}<input required value={form.fullName} onChange={set('fullName')} placeholder={STRINGS.checkout.fullNamePlaceholder} /></label>
              <label>{STRINGS.checkout.phone}<input required value={form.phone} onChange={set('phone')} placeholder={STRINGS.checkout.phonePlaceholder} pattern="[0-9]{10}" title={STRINGS.checkout.phoneHint} /></label>
              <label className="wide">{STRINGS.checkout.address}<input required value={form.address} onChange={set('address')} placeholder={STRINGS.checkout.addressPlaceholder} /></label>
              <label>{STRINGS.checkout.city}<input required value={form.city} onChange={set('city')} placeholder={STRINGS.checkout.city} /></label>
              <label>{STRINGS.checkout.state}<input required value={form.state} onChange={set('state')} placeholder={STRINGS.checkout.state} /></label>
              <label>{STRINGS.checkout.pincode}<input required value={form.pincode} onChange={set('pincode')} placeholder={STRINGS.checkout.pincodePlaceholder} pattern="[0-9]{6}" title={STRINGS.checkout.pincodeHint} /></label>
            </div>

            <h3 className="serif">{STRINGS.checkout.paymentMethod}</h3>
            <div className="pay-options">
              <label className={`pay-option ${payment === PAYMENT_METHOD.COD ? 'selected' : ''}`}>
                <input type="radio" name="payment" value={PAYMENT_METHOD.COD} checked={payment === PAYMENT_METHOD.COD} onChange={() => setPayment(PAYMENT_METHOD.COD)} />
                <b>{STRINGS.checkout.codTitle}</b>
                <span>{STRINGS.checkout.codText}</span>
              </label>
              <label className={`pay-option ${payment === PAYMENT_METHOD.UPI ? 'selected' : ''}`}>
                <input type="radio" name="payment" value={PAYMENT_METHOD.UPI} checked={payment === PAYMENT_METHOD.UPI} onChange={() => setPayment(PAYMENT_METHOD.UPI)} />
                <b>{STRINGS.checkout.upiTitle}</b>
                <span>{STRINGS.checkout.upiText}</span>
              </label>
            </div>
          </div>

          <aside className="cart-summary">
            <h3 className="serif">{STRINGS.common.orderSummary}</h3>
            {items.map((i) => (
              <div className="sum-row small" key={i.productId}>
                <span>{i.name} × {i.qty}</span><b>{inr(i.price * i.qty)}</b>
              </div>
            ))}
            <div className="sum-row"><span>{STRINGS.common.subtotal}</span><b>{inr(total)}</b></div>
            <div className="sum-row"><span>{STRINGS.common.shipping}</span><b>{shipping === 0 ? STRINGS.common.freeShipping : inr(shipping)}</b></div>
            <div className="sum-row grand"><span>{STRINGS.common.total}</span><b>{inr(total + shipping)}</b></div>
            {error && <p className="form-error">{error}</p>}
            <button className="btn btn-dark full" disabled={placing}>
              {placing ? STRINGS.checkout.placing : STRINGS.checkout.placeOrder(inr(total + shipping))}
            </button>
          </aside>
        </form>
      </div>
    </section>
  );
}
