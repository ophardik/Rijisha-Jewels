import { useEffect, useState } from 'react';
import { api } from '../api';
import ProductCard from './ProductCard';
import { STRINGS } from '../strings';

// "You may also like" — other pieces from the same category.
export default function RelatedProducts({ category, excludeSlug }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api(`/products?category=${category}`)
      .then((data) => setProducts(data.filter((p) => p.slug !== excludeSlug).slice(0, 4)))
      .catch(() => setProducts([]));
  }, [category, excludeSlug]);

  if (products.length === 0) return null;

  return (
    <section className="section related-section">
      <div className="container">
        <div className="section-head">
          <span className="section-eyebrow">{STRINGS.productDetail.relatedEyebrow}</span>
          <h2>{STRINGS.productDetail.relatedTitle}</h2>
        </div>
        <div className="grid">
          {products.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      </div>
    </section>
  );
}
