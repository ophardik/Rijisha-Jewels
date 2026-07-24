import { Link } from 'react-router-dom';
import { CATEGORY, CATEGORY_LABEL, SORT } from '../enums';
import { STRINGS } from '../strings';
import { ETSY_URL, INSTAGRAM_URL, FACEBOOK_URL, whatsappUrl } from '../links';

export default function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-about">
            <Link to="/" className="logo">
              <img className="logo-img" src="/logo-white.png" alt={STRINGS.header.logoAlt} />
            </Link>
            <p>{STRINGS.footer.about}</p>
            <div className="socials">
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" /></svg></a>
              {/* Facebook icon hidden for now — restore when the page is live.
              <a href={FACEBOOK_URL} target="_blank" rel="noreferrer" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M15 3h-3a4 4 0 0 0-4 4v3H5v4h3v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h2Z" /></svg></a>
              */}
              <a href={whatsappUrl(STRINGS.whatsapp.message)} target="_blank" rel="noreferrer" aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3Z" /><path d="M9 9.5c.5 2.5 3 5 5.5 5.5l1-1.5-2-1-1 .5c-.8-.5-1.5-1.2-2-2l.5-1-1-2L9 9.5Z" /></svg></a>
            </div>
          </div>

          <div className="footer-col">
            <h4>{STRINGS.footer.shopTitle}</h4>
            <ul>
              {Object.values(CATEGORY).map((category) => (
                <li key={category}><Link to={`/shop?category=${category}`}>{CATEGORY_LABEL[category]}</Link></li>
              ))}
              <li><Link to={`/shop?sort=${SORT.NEWEST}`}>{STRINGS.footer.newArrivals}</Link></li>
              <li><Link to={`/shop?sort=${SORT.RATING}`}>{STRINGS.footer.bestsellers}</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>{STRINGS.footer.accountTitle}</h4>
            <ul>
              {/* Orders disabled for now — ordering happens on Etsy
              <li><Link to="/orders">Track Your Order</Link></li> */}
              <li><Link to="/wishlist">{STRINGS.footer.myWishlist}</Link></li>
              {/* <li><Link to="/cart">My Bag</Link></li> */}
              <li><a href={ETSY_URL} target="_blank" rel="noreferrer">{STRINGS.footer.etsyShop}</a></li>
              <li><Link to="/login">{STRINGS.footer.loginRegister}</Link></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h4>{STRINGS.footer.contactTitle}</h4>
            <ul>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                <span>{STRINGS.footer.address}</span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>
                <span>{STRINGS.footer.phone}</span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
                <span>{STRINGS.footer.email}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>{STRINGS.footer.copyright}</span>
          <span>{STRINGS.footer.tagline}</span>
        </div>
      </div>
    </footer>
  );
}
