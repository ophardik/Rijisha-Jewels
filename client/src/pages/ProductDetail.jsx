import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import JewelArt from '../components/JewelArt';
import Loader from '../components/Loader';
// import { useCart } from '../context/CartContext'; // cart disabled — buying happens on Etsy
import { useAuth } from '../context/AuthContext';
import { toast } from '../toast';
import { ETSY_URL } from '../components/ProductCard';

const inr = (n) => `₹${n.toLocaleString('en-IN')}`;

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  // const [qty, setQty] = useState(1); // cart disabled
  const [activeMedia, setActiveMedia] = useState(0);
  // const { add } = useCart(); // cart disabled
  const { user, wishlist, toggleWishlist } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveMedia(0);
    api(`/products/${slug}`).then(setProduct).catch((err) => setError(err.message));
  }, [slug]);

  if (error) {
    return (
      <section className="section">
        <div className="container center">
          <p className="form-error">{error}</p>
          <Link to="/shop" className="btn btn-dark">Back to Shop</Link>
        </div>
      </section>
    );
  }
  if (!product) return <section className="section"><Loader label="Unveiling this piece…" /></section>;

  const wished = wishlist?.includes(product._id);
  const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  const media = product.media?.length
    ? product.media
    : product.image ? [{ url: product.image, type: 'image' }] : [];
  const current = media[Math.min(activeMedia, media.length - 1)];

  // Cart disabled — buying happens on Etsy
  // const onAdd = () => {
  //   add(product, qty);
  //   toast(`✓ ${product.name} added to your bag`);
  // };
  // const onBuyNow = () => {
  //   add(product, qty);
  //   navigate('/checkout');
  // };

  const onWish = async () => {
    if (!user) {
      toast('Please log in to save to wishlist');
      navigate('/login');
      return;
    }
    const added = await toggleWishlist(product._id);
    toast(added ? `♥ Added to wishlist` : `Removed from wishlist`);
  };

  return (
    <section className="section">
      <div className="container detail-inner">
        <div className="detail-gallery">
          <div className={`detail-media ${product.bg}`}>
            {product.tag && <span className="p-tag">{product.tag}</span>}
            {!current && <JewelArt art={product.art} />}
            {current?.type === 'image' && (
              <img className="product-photo" src={current.url} alt={product.name} />
            )}
            {current?.type === 'video' && (
              <video
                key={current.url}
                className="product-photo"
                src={current.url}
                controls
                playsInline
                autoPlay
                muted
                loop
              />
            )}
          </div>
          {media.length > 1 && (
            <div className="gallery-thumbs">
              {media.map((m, i) => (
                <button
                  key={m.url}
                  type="button"
                  className={`gallery-thumb ${i === activeMedia ? 'active' : ''}`}
                  onClick={() => setActiveMedia(i)}
                  aria-label={`View ${m.type} ${i + 1}`}
                >
                  {m.type === 'video'
                    ? <><video src={m.url} muted preload="metadata" /><span className="media-badge">▶</span></>
                    : <img src={m.url} alt="" loading="lazy" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-info">
          <nav className="crumbs">
            <Link to="/">Home</Link> / <Link to={`/shop?category=${product.category}`}>{product.category}</Link> / <span>{product.name}</span>
          </nav>
          <h1>{product.name}</h1>
          <div className="stars">
            {'★'.repeat(Math.round(product.rating))}
            <span>{product.rating} · {product.numReviews} reviews</span>
          </div>

          <div className="detail-price">
            <b>{inr(product.price)}</b>
            {product.mrp && <><s>{inr(product.mrp)}</s><em>{discount}% off</em></>}
          </div>
          <p className="tax-note">Inclusive of all taxes · Free shipping above ₹2,999</p>

          <p className="detail-desc">{product.description}</p>

          <ul className="detail-points">
            <li><span className="tick">✓</span> 92.5% pure sterling silver, BIS hallmarked</li>
            <li><span className="tick">✓</span> Anti-tarnish e-coating for lasting shine</li>
            <li><span className="tick">✓</span> Ships in premium gift packaging</li>
          </ul>

          <div className="detail-stock">
            {product.stock > 0
              ? product.stock <= 10
                ? <span className="low-stock">Only {product.stock} left in stock</span>
                : <span className="in-stock">In stock</span>
              : <span className="form-error">Out of stock</span>}
          </div>

          <div className="detail-actions">
            {/* Cart disabled — buying happens on Etsy
            <div className="qty-picker">
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease">−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(Math.min(10, qty + 1))} aria-label="Increase">+</button>
            </div>
            <button className="btn btn-dark" onClick={onAdd} disabled={product.stock === 0}>Add to Bag</button>
            <button className="btn btn-ghost" onClick={onBuyNow} disabled={product.stock === 0}>Buy Now</button> */}
            <a className="btn btn-etsy" href={ETSY_URL} target="_blank" rel="noreferrer">
              Buy on Etsy
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16" style={{ marginLeft: 8 }}>
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </a>
            <button className={`icon-btn wish-lg ${wished ? 'active' : ''}`} onClick={onWish} aria-label="Toggle wishlist">
              <svg viewBox="0 0 24 24" fill={wished ? '#c0392b' : 'none'} stroke="currentColor" strokeWidth="1.7">
                <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.4 1-4.5 2.5C10.9 4 9.3 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
