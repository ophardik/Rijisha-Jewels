import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { ORDER_STATUS_LABEL } from '../enums';
import { usePageTitle } from '../usePageTitle';
import { STRINGS } from '../strings';

const inr = (n) => `₹${n.toLocaleString('en-IN')}`;

export default function Orders() {
  usePageTitle(STRINGS.titles.orders);
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    api('/orders/mine').then(setOrders).catch((err) => setError(err.message));
  }, [user]);

  if (authLoading) return <section className="section"><Loader /></section>;

  if (!user) {
    return (
      <section className="section">
        <div className="container center empty-state">
          <h2 className="serif">{STRINGS.orders.loginTitle}</h2>
          <Link to="/login?next=/orders" className="btn btn-dark">{STRINGS.common.logIn}</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container narrow">
        <div className="section-head">
          <span className="section-eyebrow">{STRINGS.orders.eyebrow}</span>
          <h2>{STRINGS.orders.title}</h2>
        </div>

        {error && <p className="form-error center">{error}</p>}
        {orders === null ? (
          <Loader label={STRINGS.orders.loader} />
        ) : orders.length === 0 ? (
          <div className="center empty-state">
            <p className="muted">{STRINGS.orders.empty}</p>
            <Link to="/shop" className="btn btn-dark">{STRINGS.common.startShopping}</Link>
          </div>
        ) : (
          orders.map((order) => (
            <div className="order-card" key={order._id}>
              <div className="order-head">
                <div>
                  <b>{STRINGS.orders.orderNo(order._id.slice(-8).toUpperCase())}</b>
                  <span className="muted">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <span className={`status status-${order.status}`}>{ORDER_STATUS_LABEL[order.status]}</span>
              </div>
              <ul className="order-items">
                {order.items.map((item, i) => (
                  <li key={i}>
                    <span>{item.name} × {item.qty}</span>
                    <b>{inr(item.price * item.qty)}</b>
                  </li>
                ))}
              </ul>
              <div className="order-foot">
                <span className="muted">
                  {STRINGS.orders.shipsTo(order.paymentMethod, order.shipping.city, order.shipping.state, order.shipping.pincode)}
                </span>
                <b>{STRINGS.orders.total(inr(order.grandTotal))}</b>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
