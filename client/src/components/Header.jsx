import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
// import { useCart } from '../context/CartContext'; // cart disabled — buying happens on Etsy
import { useAuth } from '../context/AuthContext';
import { toast } from '../toast';
import { CATEGORY, CATEGORY_LABEL } from '../enums';
import { STRINGS } from '../strings';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [announceIdx, setAnnounceIdx] = useState(0);
  // const { count } = useCart(); // cart disabled
  const { user, wishlist, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // NavLink only matches the pathname, so every /shop?category=... link would
  // show as active on any shop page — match on the category ourselves
  const activeCategory = new URLSearchParams(location.search).get('category');
  const onShop = location.pathname === '/shop';
  const shopClass = (cat) => (onShop && activeCategory === cat ? 'active' : '');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Rotate the announcement bar messages
  useEffect(() => {
    const count = STRINGS.header.announcements.length;
    if (count < 2) return undefined;
    const id = setInterval(() => setAnnounceIdx((i) => (i + 1) % count), 4500);
    return () => clearInterval(id);
  }, []);

  const close = () => setMenuOpen(false);

  const onLogout = () => {
    logout();
    toast(STRINGS.header.loggedOut);
    navigate('/');
  };

  return (
    <>
      <div className="announce">
        <span className="announce-msg" key={announceIdx}>{STRINGS.header.announcements[announceIdx]}</span>
      </div>
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container header-inner">
          <Link to="/" className="logo" onClick={close}>
            <img className="logo-img" src="/logo.png" alt={STRINGS.header.logoAlt} />
          </Link>

          <nav className={`nav ${menuOpen ? 'open' : ''}`}>
            <ul>
              <li><NavLink to="/" onClick={close}>{STRINGS.header.navHome}</NavLink></li>
              <li><NavLink to="/shop" className={() => shopClass(null)} onClick={close}>{STRINGS.header.navShop}</NavLink></li>
              {Object.values(CATEGORY).map((category) => (
                <li key={category}>
                  <NavLink to={`/shop?category=${category}`} className={() => shopClass(category)} onClick={close}>
                    {CATEGORY_LABEL[category]}
                  </NavLink>
                </li>
              ))}
              {/* Orders disabled for now — ordering happens on Etsy
              {user && <li><NavLink to="/orders" onClick={close}>My Orders</NavLink></li>} */}
              {user?.isAdmin && <li><NavLink to="/admin" onClick={close} className="admin-link">{STRINGS.header.navAdmin}</NavLink></li>}
            </ul>
          </nav>

          <div className="header-icons">
            {user ? (
              <>
                <span className="hello">{STRINGS.header.hello(user.name.split(' ')[0])}</span>
                <button className="icon-btn" onClick={onLogout} aria-label="Log out" title="Log out">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                </button>
              </>
            ) : (
              <Link to="/login" className="icon-btn" aria-label="Log in" title="Log in">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 5-5.5 8-5.5s6.5 1.5 8 5.5" />
                </svg>
              </Link>
            )}

            <Link to="/wishlist" className="icon-btn" aria-label="Wishlist" title="Wishlist">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.4 1-4.5 2.5C10.9 4 9.3 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />
              </svg>
              {wishlist?.length > 0 && <span className="badge">{wishlist.length}</span>}
            </Link>

            {/* Cart disabled — buying happens on Etsy
            <Link to="/cart" className="icon-btn" aria-label="Shopping bag" title="Bag">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 7a3 3 0 0 1 6 0" />
              </svg>
              {count > 0 && <span className="badge">{count}</span>}
            </Link> */}

            <button className="hamburger icon-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                {menuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
