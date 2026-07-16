import ProductCard from './ProductCard';
import { getRecentlyViewed } from '../recentlyViewed';
import { STRINGS } from '../strings';

// Pieces the visitor looked at earlier (from localStorage), excluding the current one.
export default function RecentlyViewed({ excludeId }) {
  const products = getRecentlyViewed(excludeId).slice(0, 4);
  if (products.length === 0) return null;

  return (
    <section className="section recent-section">
      <div className="container">
        <div className="section-head">
          <span className="section-eyebrow">{STRINGS.productDetail.recentEyebrow}</span>
          <h2>{STRINGS.productDetail.recentTitle}</h2>
        </div>
        <div className="grid">
          {products.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      </div>
    </section>
  );
}
