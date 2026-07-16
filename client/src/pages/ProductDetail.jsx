import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import JewelArt from '../components/JewelArt';
import Loader from '../components/Loader';
// import { useCart } from '../context/CartContext'; // cart disabled — buying happens on Etsy
import { useAuth } from '../context/AuthContext';
import { toast } from '../toast';
import RelatedProducts from '../components/RelatedProducts';
import RecentlyViewed from '../components/RecentlyViewed';
import Reviews from '../components/Reviews';
import Stars from '../components/Stars';
import { addRecentlyViewed } from '../recentlyViewed';
import { usePageTitle } from '../usePageTitle';
import { MEDIA_TYPE } from '../enums';
import { STRINGS } from '../strings';
import { ETSY_URL } from '../links';

const inr = (n) => `₹${n.toLocaleString('en-IN')}`;

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  // const [qty, setQty] = useState(1); // cart disabled
  const [activeMedia, setActiveMedia] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [pop, setPop] = useState(false);
  // const { add } = useCart(); // cart disabled
  const { user, wishlist, toggleWishlist } = useAuth();

  usePageTitle(product?.name);

  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveMedia(0);
    setLightbox(false);
    api(`/products/${slug}`)
      .then((p) => {
        setProduct(p);
        addRecentlyViewed(p);
      })
      .catch((err) => setError(err.message));
  }, [slug]);

  // Lightbox: lock scroll while open, close on Escape
  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : '';
    if (!lightbox) return undefined;
    const onKey = (e) => e.key === 'Escape' && setLightbox(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [lightbox]);

  if (error) {
    return (
      <section className="section">
        <div className="container center">
          <p className="form-error">{error}</p>
          <Link to="/shop" className="btn btn-dark">{STRINGS.productDetail.backToShop}</Link>
        </div>
      </section>
    );
  }
  if (!product) return <section className="section"><Loader label={STRINGS.productDetail.loader} /></section>;

  const wished = wishlist?.includes(product._id);
  const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  const media = product.media?.length
    ? product.media
    : product.image ? [{ url: product.image, type: MEDIA_TYPE.IMAGE }] : [];
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
      toast(STRINGS.common.loginToWishlist);
      navigate('/login');
      return;
    }
    const added = await toggleWishlist(product._id);
    if (added) {
      setPop(true);
      setTimeout(() => setPop(false), 500);
    }
    toast(
      added ? STRINGS.productDetail.addedToWishlist : STRINGS.productDetail.removedFromWishlist,
      added ? 'wish' : 'info'
    );
  };

  return (
    <>
      <section className="section detail-section">
        <div className="container detail-inner">
          <div className="detail-gallery">
            <div className={`detail-media ${product.bg}`}>
              {product.tag && <span className="p-tag">{product.tag}</span>}
              {!current && <JewelArt art={product.art} />}
              {current?.type === MEDIA_TYPE.IMAGE && (
                <img
                  className="product-photo zoomable"
                  src={current.url}
                  alt={product.name}
                  onClick={() => setLightbox(true)}
                />
              )}
              {current?.type === MEDIA_TYPE.VIDEO && (
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
                    {m.type === MEDIA_TYPE.VIDEO
                      ? <><video src={m.url} muted preload="metadata" /><span className="media-badge">▶</span></>
                      : <img src={m.url} alt="" loading="lazy" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="detail-info">
            <nav className="crumbs">
              <Link to="/">{STRINGS.productDetail.crumbHome}</Link> / <Link to={`/shop?category=${product.category}`}>{product.category}</Link> / <span>{product.name}</span>
            </nav>
            <h1>{product.name}</h1>
            <div className="stars">
              {product.numReviews > 0 ? (
                <>
                  <Stars value={product.rating} />
                  <span>{STRINGS.productDetail.reviews(product.rating, product.numReviews)}</span>
                </>
              ) : (
                <span className="muted">{STRINGS.productDetail.noReviews}</span>
              )}
            </div>

            <div className="detail-price">
              <b>{inr(product.price)}</b>
              {product.mrp && <><s>{inr(product.mrp)}</s><em>{STRINGS.productDetail.discountOff(discount)}</em></>}
            </div>
            <p className="tax-note">{STRINGS.productDetail.taxNote}</p>

            <p className="detail-desc">{product.description}</p>

            <ul className="detail-points">
              {STRINGS.productDetail.points.map((point) => (
                <li key={point}><span className="tick">✓</span> {point}</li>
              ))}
            </ul>

            <div className="detail-stock">
              {product.stock > 0
                ? product.stock <= 10
                  ? <span className="low-stock">{STRINGS.productDetail.onlyLeft(product.stock)}</span>
                  : <span className="in-stock">{STRINGS.productDetail.inStock}</span>
                : <span className="form-error">{STRINGS.productDetail.outOfStock}</span>}
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
                {STRINGS.common.buyOnEtsy}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16" style={{ marginLeft: 8 }}>
                  <path d="M7 17 17 7M9 7h8v8" />
                </svg>
              </a>
              <button className={`icon-btn wish-lg ${wished ? 'active' : ''} ${pop ? 'pop' : ''}`} onClick={onWish} aria-label="Toggle wishlist">
                <svg viewBox="0 0 24 24" fill={wished ? '#c0392b' : 'none'} stroke="currentColor" strokeWidth="1.7">
                  <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.4 1-4.5 2.5C10.9 4 9.3 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      <Reviews
        product={product}
        onChange={() => api(`/products/${slug}`).then(setProduct).catch(() => {})}
      />

      <RelatedProducts category={product.category} excludeSlug={product.slug} />
      <RecentlyViewed excludeId={product._id} />

      {/* Sticky buy bar — mobile only */}
      <div className="buy-bar">
        <div className="buy-bar-price">
          <b>{inr(product.price)}</b>
          {product.mrp && <s>{inr(product.mrp)}</s>}
        </div>
        <a className="btn btn-etsy" href={ETSY_URL} target="_blank" rel="noreferrer">
          {STRINGS.common.buyOnEtsy}
        </a>
      </div>

      {/* Zoom lightbox */}
      {lightbox && current?.type === MEDIA_TYPE.IMAGE && (
        <div className="lightbox" onClick={() => setLightbox(false)} role="dialog" aria-modal="true">
          <button className="lightbox-close" aria-label="Close" onClick={() => setLightbox(false)}>×</button>
          <img src={current.url} alt={product.name} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
