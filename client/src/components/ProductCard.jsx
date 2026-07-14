import { Link, useNavigate } from 'react-router-dom';
import JewelArt from './JewelArt';
// import { useCart } from '../context/CartContext'; // cart disabled — buying happens on Etsy
import { useAuth } from '../context/AuthContext';
import { toast } from '../toast';

const inr = (n) => `₹${n.toLocaleString('en-IN')}`;
export const ETSY_URL = 'https://rijishaajewels.etsy.com';

export default function ProductCard({ product }) {
  // const { add } = useCart(); // cart disabled
  const { user, wishlist, toggleWishlist } = useAuth();
  const navigate = useNavigate();

  const wished = wishlist?.includes(product._id);

  const onWish = async (e) => {
    e.preventDefault();
    if (!user) {
      toast('Please log in to save to wishlist');
      navigate('/login');
      return;
    }
    try {
      const added = await toggleWishlist(product._id);
      toast(added ? `♥ ${product.name} added to wishlist` : `${product.name} removed from wishlist`);
    } catch (err) {
      toast(err.message);
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
    window.open(ETSY_URL, '_blank', 'noopener');
  };

  return (
    <Link to={`/product/${product.slug}`} className="product">
      <div className={`product-media ${product.bg}`}>
        {product.tag && (
          <span className={`p-tag ${product.tag === 'New' || product.tag === 'Festive' ? 'gold' : ''}`}>
            {product.tag}
          </span>
        )}
        <button className={`wish ${wished ? 'active' : ''}`} onClick={onWish} aria-label="Toggle wishlist">
          <svg viewBox="0 0 24 24" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
            <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.4 1-4.5 2.5C10.9 4 9.3 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />
          </svg>
        </button>
        {(() => {
          const first = product.media?.find((m) => m.type === 'image')
            || product.media?.[0]
            || (product.image ? { url: product.image, type: 'image' } : null);
          if (!first) return <JewelArt art={product.art} />;
          return first.type === 'video'
            ? <video className="product-photo" src={first.url} muted playsInline preload="metadata" />
            : <img className="product-photo" src={first.url} alt={product.name} loading="lazy" />;
        })()}
        {/* <button className="quick-add" onClick={onAdd}>Add to Bag</button> */}
        <button className="quick-add" onClick={onEtsy}>Buy on Etsy</button>
      </div>
      <div className="product-info">
        <span className="product-cat">
          {product.category} · {product.subCategory}
        </span>
        <h3>{product.name}</h3>
        <div className="price">
          <b>{inr(product.price)}</b>
          {product.mrp && <s>{inr(product.mrp)}</s>}
        </div>
        <div className="stars">
          {'★'.repeat(Math.round(product.rating))}
          <span>({product.numReviews})</span>
        </div>
      </div>
    </Link>
  );
}
