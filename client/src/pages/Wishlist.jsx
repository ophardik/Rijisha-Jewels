import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import { usePageTitle } from '../usePageTitle';
import { STRINGS } from '../strings';

export default function Wishlist() {
  usePageTitle(STRINGS.titles.wishlist);
  const { user, wishlist, loading: authLoading } = useAuth();
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    api('/wishlist').then(setProducts).catch((err) => setError(err.message));
  }, [user, wishlist]);

  if (authLoading) return <section className="section"><Loader /></section>;

  if (!user) {
    return (
      <section className="section">
        <div className="container center empty-state">
          <h2 className="serif">{STRINGS.wishlist.loginTitle}</h2>
          <p className="muted">{STRINGS.wishlist.loginText}</p>
          <Link to="/login?next=/wishlist" className="btn btn-dark">{STRINGS.common.logIn}</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="section-eyebrow">{STRINGS.wishlist.eyebrow}</span>
          <h2>{STRINGS.wishlist.title}</h2>
        </div>
        {error && <p className="form-error center">{error}</p>}
        {products === null ? (
          <Loader label={STRINGS.wishlist.loader} />
        ) : products.length === 0 ? (
          <div className="center empty-state">
            <p className="muted">{STRINGS.wishlist.empty}</p>
            <Link to="/shop" className="btn btn-dark">{STRINGS.wishlist.browse}</Link>
          </div>
        ) : (
          <div className="grid">
            {products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </div>
    </section>
  );
}
