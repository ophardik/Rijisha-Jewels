import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const category = params.get('category') || 'all';
  const sort = params.get('sort') || '';
  const search = params.get('search') || '';
  const comingSoon = category === 'bracelets';

  useEffect(() => {
    if (comingSoon) {
      setProducts([]);
      setError('');
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = new URLSearchParams();
    if (category !== 'all') q.set('category', category);
    if (sort) q.set('sort', sort);
    if (search) q.set('search', search);
    api(`/products?${q}`)
      .then((data) => {
        setProducts(data);
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [category, sort, search, comingSoon]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value && value !== 'all') next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <section className="section shop-page">
      <div className="container">
        <div className="section-head">
          <span className="section-eyebrow">The Collection</span>
          <h2>Shop Silver Jewellery</h2>
          <p>Every piece handcrafted in 92.5% sterling silver with an anti-tarnish finish.</p>
        </div>

        <div className="shop-toolbar">
          <div className="filter-tabs">
            {[
              { value: 'all', label: 'All Pieces' },
              { value: 'earrings', label: 'Earrings' },
              { value: 'necklaces', label: 'Necklaces' },
              { value: 'bracelets', label: 'Bracelets' },
              { value: 'antique', label: 'Antique Jewellery' },
            ].map((cat) => (
              <button
                key={cat.value}
                className={`tab ${category === cat.value ? 'active' : ''}`}
                onClick={() => update('category', cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="toolbar-right">
            <input
              className="search-input"
              type="search"
              placeholder="Search jewellery..."
              value={search}
              onChange={(e) => update('search', e.target.value)}
            />
            <select className="sort-select" value={sort} onChange={(e) => update('sort', e.target.value)}>
              <option value="">Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {error && <p className="form-error center">{error}</p>}
        {comingSoon ? (
          <div className="shop-soon">
            <span className="soon-pill">Coming Soon</span>
            <h3>Bracelets are on their way</h3>
            <p>Our artisans are crafting the very first Rijisha bracelet collection right now. Stay tuned — it will be worth the wait.</p>
            <button className="btn btn-ghost" onClick={() => update('category', 'all')}>Browse Other Pieces</button>
          </div>
        ) : loading ? (
          <Loader label="Laying out the collection…" />
        ) : products.length === 0 ? (
          <p className="muted center">No pieces match your search.</p>
        ) : (
          <div className="grid">
            {products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </div>
    </section>
  );
}
