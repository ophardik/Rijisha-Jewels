import { Link, useNavigate } from 'react-router-dom';
import JewelArt from '../components/JewelArt';
import { useCart } from '../context/CartContext';
import { STRINGS } from '../strings';

const inr = (n) => `₹${n.toLocaleString('en-IN')}`;
const FREE_SHIPPING_ABOVE = 2999;
const SHIPPING_FEE = 99;

export default function Cart() {
  const { items, setQty, remove, total } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <section className="section">
        <div className="container center empty-state">
          <h2 className="serif">{STRINGS.cart.emptyTitle}</h2>
          <p className="muted">{STRINGS.cart.emptyText}</p>
          <Link to="/shop" className="btn btn-dark">{STRINGS.common.startShopping}</Link>
        </div>
      </section>
    );
  }

  const shipping = total >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="section-eyebrow">{STRINGS.cart.eyebrow}</span>
          <h2>{STRINGS.cart.title}</h2>
        </div>

        <div className="cart-layout">
          <div className="cart-items">
            {items.map((item) => (
              <div className="cart-row" key={item.productId}>
                <Link to={`/product/${item.slug}`} className={`cart-thumb ${item.bg}`}>
                  {item.image
                    ? <img className="product-photo" src={item.image} alt={item.name} />
                    : <JewelArt art={item.art} />}
                </Link>
                <div className="cart-meta">
                  <span className="product-cat">{item.category}</span>
                  <Link to={`/product/${item.slug}`}><h3>{item.name}</h3></Link>
                  <b>{inr(item.price)}</b>
                </div>
                <div className="qty-picker">
                  <button onClick={() => setQty(item.productId, item.qty - 1)} aria-label="Decrease">−</button>
                  <span>{item.qty}</span>
                  <button onClick={() => setQty(item.productId, item.qty + 1)} aria-label="Increase">+</button>
                </div>
                <b className="cart-line-total">{inr(item.price * item.qty)}</b>
                <button className="remove-btn" onClick={() => remove(item.productId)} aria-label="Remove">
                  <svg viewBox="0 0 24 24" width="18" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
                </button>
              </div>
            ))}
          </div>

          <aside className="cart-summary">
            <h3 className="serif">{STRINGS.common.orderSummary}</h3>
            <div className="sum-row"><span>{STRINGS.common.subtotal}</span><b>{inr(total)}</b></div>
            <div className="sum-row">
              <span>{STRINGS.common.shipping}</span>
              <b>{shipping === 0 ? STRINGS.common.freeShipping : inr(shipping)}</b>
            </div>
            {shipping > 0 && (
              <p className="ship-hint">{STRINGS.cart.shipHint(inr(FREE_SHIPPING_ABOVE - total))}</p>
            )}
            <div className="sum-row grand"><span>{STRINGS.common.total}</span><b>{inr(total + shipping)}</b></div>
            <button className="btn btn-dark full" onClick={() => navigate('/checkout')}>{STRINGS.cart.proceed}</button>
            <Link to="/shop" className="continue-link">{STRINGS.cart.continueShopping}</Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
