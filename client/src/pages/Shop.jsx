import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import ProductCard from '../components/ProductCard';
import SkeletonGrid from '../components/SkeletonGrid';
import { usePageTitle } from '../usePageTitle';
import { CATEGORY, CATEGORY_LABEL, CATEGORY_ALL, SORT } from '../enums';
import { STRINGS } from '../strings';

export default function Shop() {
  usePageTitle(STRINGS.titles.shop);
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const category = params.get('category') || CATEGORY_ALL;
  const sort = params.get('sort') || '';
  const search = params.get('search') || '';
  const comingSoon = category === CATEGORY.BRACELETS;

  useEffect(() => {
    if (comingSoon) {
      setProducts([]);
      setError('');
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = new URLSearchParams();
    if (category !== CATEGORY_ALL) q.set('category', category);
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
    if (value && value !== CATEGORY_ALL) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <section className="section shop-page">
      <div className="container">
        <div className="section-head">
          <span className="section-eyebrow">{STRINGS.shop.eyebrow}</span>
          <h2>{STRINGS.shop.title}</h2>
          <p>{STRINGS.shop.text}</p>
        </div>

        <div className="shop-toolbar">
          <div className="filter-tabs">
            {[
              { value: CATEGORY_ALL, label: STRINGS.shop.allPieces },
              ...Object.values(CATEGORY).map((value) => ({ value, label: CATEGORY_LABEL[value] })),
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
              placeholder={STRINGS.shop.searchPlaceholder}
              value={search}
              onChange={(e) => update('search', e.target.value)}
            />
            <select className="sort-select" value={sort} onChange={(e) => update('sort', e.target.value)}>
              <option value="">{STRINGS.shop.sortFeatured}</option>
              <option value={SORT.PRICE_ASC}>{STRINGS.shop.sortPriceAsc}</option>
              <option value={SORT.PRICE_DESC}>{STRINGS.shop.sortPriceDesc}</option>
              <option value={SORT.RATING}>{STRINGS.shop.sortRating}</option>
              <option value={SORT.NEWEST}>{STRINGS.shop.sortNewest}</option>
            </select>
          </div>
        </div>

        {error && <p className="form-error center">{error}</p>}
        {comingSoon ? (
          <div className="shop-soon">
            <span className="soon-pill">{STRINGS.shop.soonPill}</span>
            <h3>{STRINGS.shop.soonTitle}</h3>
            <p>{STRINGS.shop.soonText}</p>
            <button className="btn btn-ghost" onClick={() => update('category', CATEGORY_ALL)}>{STRINGS.shop.browseOther}</button>
          </div>
        ) : loading ? (
          <SkeletonGrid />
        ) : products.length === 0 ? (
          <p className="muted center">{STRINGS.shop.noMatch}</p>
        ) : (
          <div className="grid">
            {products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </div>
    </section>
  );
}
