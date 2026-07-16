import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import JewelArt from './JewelArt';
// import { useCart } from '../context/CartContext'; // cart disabled — buying happens on Etsy
import { useAuth } from '../context/AuthContext';
import { toast } from '../toast';
import { MEDIA_TYPE, PRODUCT_TAG } from '../enums';
import { STRINGS } from '../strings';
import { ETSY_URL } from '../links';
import Stars from './Stars';

const inr = (n) => `₹${n.toLocaleString('en-IN')}`;

export default function ProductCard({ product }) {
  // const { add } = useCart(); // cart disabled
  const { user, wishlist, toggleWishlist } = useAuth();
  const navigate = useNavigate();
  const altVideoRef = useRef(null);
  const [pop, setPop] = useState(false);

  const wished = wishlist?.includes(product._id);
  const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  const media = product.media?.length
    ? product.media
    : product.image ? [{ url: product.image, type: MEDIA_TYPE.IMAGE }] : [];
  const primary = media.find((m) => m.type === MEDIA_TYPE.IMAGE) || media[0] || null;
  const alt = media.find((m) => m.url !== primary?.url) || null;

  const onWish = async (e) => {
    e.preventDefault();
    if (!user) {
      toast(STRINGS.common.loginToWishlist);
      navigate('/login');
      return;
    }
    try {
      const added = await toggleWishlist(product._id);
      if (added) {
        setPop(true);
        setTimeout(() => setPop(false), 500);
      }
      toast(
        added ? STRINGS.productCard.addedToWishlist(product.name) : STRINGS.productCard.removedFromWishlist(product.name),
        added ? 'wish' : 'info'
      );
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  // Cart disabled — buying happens on Etsy
  // const onAdd = (e) => {
  //   e.preventDefault();
  //   add(product);
  //   toast(`✓ ${product.name} added to your bag`);
  // };

  const onEtsy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(ETSY_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className="product"
      onMouseEnter={() => altVideoRef.current?.play()}
      onMouseLeave={() => altVideoRef.current?.pause()}
    >
      <div className={`product-media ${product.bg}`}>
        {product.tag && (
          <span className={`p-tag ${product.tag === PRODUCT_TAG.NEW || product.tag === PRODUCT_TAG.FESTIVE ? 'gold' : ''}`}>
            {product.tag}
          </span>
        )}
        <button className={`wish ${wished ? 'active' : ''} ${pop ? 'pop' : ''}`} onClick={onWish} aria-label="Toggle wishlist">
          <svg viewBox="0 0 24 24" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
            <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.4 1-4.5 2.5C10.9 4 9.3 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />
          </svg>
        </button>
        {!primary && <JewelArt art={product.art} />}
        {primary && (primary.type === MEDIA_TYPE.VIDEO
          ? <video className="product-photo" src={primary.url} muted playsInline preload="metadata" />
          : <img className="product-photo" src={primary.url} alt={product.name} loading="lazy" />)}
        {alt && (alt.type === MEDIA_TYPE.VIDEO
          ? <video ref={altVideoRef} className="product-photo alt-media" src={alt.url} muted loop playsInline preload="metadata" />
          : <img className="product-photo alt-media" src={alt.url} alt="" loading="lazy" />)}
        {/* <button className="quick-add" onClick={onAdd}>Add to Bag</button> */}
        <button className="quick-add" onClick={onEtsy}>{STRINGS.common.buyOnEtsy}</button>
      </div>
      <div className="product-info">
        <span className="product-cat">
          {product.category} · {product.subCategory}
        </span>
        <h3>{product.name}</h3>
        <div className="price">
          <b>{inr(product.price)}</b>
          {product.mrp && <s>{inr(product.mrp)}</s>}
          {discount > 0 && <em className="off">{STRINGS.productDetail.discountOff(discount)}</em>}
        </div>
        {product.numReviews > 0 && (
          <div className="stars">
            <Stars value={product.rating} />
            <span>({product.numReviews})</span>
          </div>
        )}
      </div>
    </Link>
  );
}
