import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import JewelArt from '../components/JewelArt';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

const COLLECTIONS = [
  { key: 'earrings', title: 'Earrings', sub: 'Jhumkas · Hoops · Studs · Drops', art: 'earringsPair' },
  { key: 'necklaces', title: 'Necklaces', sub: 'Pendants · Chokers · Layered Chains', art: 'necklaceCat' },
  { key: 'bracelets', title: 'Bracelets', sub: 'Bangles · Kadas · Charm Chains', art: 'bangle', comingSoon: true },
  { key: 'antique', title: 'Antique Jewellery', sub: 'Anklets · Maang Tikkas · More', art: 'tikka' },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [collectionImages, setCollectionImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/products?sort=rating')
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    api('/home-collections')
      .then(setCollectionImages)
      .catch(() => {}); // cards fall back to their illustrations
  }, []);

  const featured = products.slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-text">
            <span className="hero-eyebrow">Handcrafted 925 Sterling Silver</span>
            <h1>Where Silver<br />Becomes <em>Poetry</em></h1>
            <p>Discover earrings and necklaces sculpted by master artisans — timeless silver jewellery designed to make every moment shine.</p>
            <div className="hero-cta">
              <Link to="/shop" className="btn btn-dark">Shop Collection</Link>
              <a href="#story" className="btn btn-ghost">Our Story</a>
            </div>
            <div className="hero-stats">
              <div className="hero-stat"><b>92.5%</b><span>Pure Silver</span></div>
              <div className="hero-stat"><b>5,000+</b><span>Happy Customers</span></div>
              <div className="hero-stat"><b>100%</b><span>Hallmarked</span></div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-ring"></div>
            <div className="hero-frame">
              <video
                key={collectionImages.hero || 'default-hero'}
                className="hero-video"
                src={collectionImages.hero || '/videos/hero-jewellery.mp4'}
                autoPlay
                muted
                loop
                playsInline
                aria-label="Model flaunting Rijisha silver jewellery"
              />
            </div>
            {/* <div className="hero-card">
              <div className="dot">
                <svg viewBox="0 0 24 24" width="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg>
              </div>
              <div><b>BIS Hallmark Certified</b><span>Purity you can trust</span></div>
            </div> */}
          </div>
        </div>
      </section>

      {/* Collections */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="section-eyebrow">Curated For You</span>
            <h2>Shop by Collection</h2>
            <p>Four signatures, one promise — silver that speaks softly and shines forever.</p>
          </div>
          <div className="cats">
            {COLLECTIONS.map((c) => {
              const CardTag = c.comingSoon ? 'div' : Link;
              return (
                <CardTag
                  {...(c.comingSoon ? {} : { to: `/shop?category=${c.key}` })}
                  className={`cat-card cat-${c.key} ${collectionImages[c.key] ? 'has-photo' : ''} ${c.comingSoon ? 'cat-soon' : ''}`}
                  key={c.key}
                >
                  {c.comingSoon && <span className="cat-soon-badge">Coming Soon</span>}
                  {collectionImages[c.key]
                    ? <img src={collectionImages[c.key]} alt={`${c.title} collection`} className="cat-photo" />
                    : <JewelArt art={c.art} />}
                  <div className="cat-label">
                    <div>
                      <h3>{c.title}</h3>
                      <span>{c.comingSoon ? 'Launching Soon · Stay Tuned' : c.sub}</span>
                    </div>
                    {!c.comingSoon && (
                      <span className="cat-arrow">
                        <svg viewBox="0 0 24 24" width="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
                      </span>
                    )}
                  </div>
                </CardTag>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="section shop-band">
        <div className="container">
          <div className="section-head">
            <span className="section-eyebrow">Bestsellers</span>
            <h2>Our Signature Pieces</h2>
            <p>Loved, reviewed and re-ordered — straight from the Rijisha atelier.</p>
          </div>
          {error && <p className="form-error center">{error}</p>}
          {loading ? (
            <Loader label="Bringing out the bestsellers…" />
          ) : (
            <div className="grid">
              {featured.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          )}
          <div className="center-cta">
            <Link to="/shop" className="btn btn-ghost">View All Pieces</Link>
          </div>
        </div>
      </section>

      {/* Promises */}
      <section className="promises">
        <div className="container promises-inner">
          <div className="promise">
            <span className="promise-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 2 3 7v6c0 5 4 8 9 9 5-1 9-4 9-9V7l-9-5Z" /><path d="m9 12 2 2 4-4" /></svg></span>
            <div><b>925 Sterling Silver</b><span>BIS hallmarked purity</span></div>
          </div>
          <div className="promise">
            <span className="promise-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 7h13v10H3zM16 10h4l1 3v4h-5" /><circle cx="7" cy="19" r="1.8" /><circle cx="18" cy="19" r="1.8" /></svg></span>
            <div><b>Free Shipping</b><span>On orders above ₹2,999</span></div>
          </div>
          <div className="promise">
            <span className="promise-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg></span>
            <div><b>15-Day Easy Returns</b><span>No questions asked</span></div>
          </div>
          <div className="promise">
            <span className="promise-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3l2.5 5.3 5.5.8-4 4 1 5.9-5-2.8-5 2.8 1-5.9-4-4 5.5-.8L12 3Z" /></svg></span>
            <div><b>Anti-Tarnish Finish</b><span>Shine that stays</span></div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="section" id="story">
        <div className="container story-inner">
          <div className="story-visual">
            <div className="story-frame">
              <JewelArt art="pendant" />
            </div>
            {/* <div className="story-badge">Since<br /><b>2012</b></div> */}
          </div>
          <div className="story-text">
            <span className="section-eyebrow">Our Story</span>
            <h2>Crafted by Hand,<br />Cherished for Generations</h2>
            <p>Rijisha Jewellers began as a small family atelier with one belief — that silver is not just a metal, but a memory in the making. Every piece we create carries the warmth of the hands that shaped it.</p>
            <p>Today, our master artisans blend traditional Indian karigari with contemporary design, creating earrings and necklaces that feel as personal as they look precious.</p>
            <ul className="story-points">
              <li><span className="tick">✓</span> Handcrafted by third-generation silversmiths</li>
              <li><span className="tick">✓</span> Ethically sourced, 92.5% pure sterling silver</li>
              <li><span className="tick">✓</span> Every piece BIS hallmarked &amp; quality checked</li>
            </ul>
            <Link to="/shop" className="btn btn-dark">Explore the Craft</Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section testimonials">
        <div className="container">
          <div className="section-head">
            <span className="section-eyebrow">Words of Love</span>
            <h2>What Our Customers Say</h2>
            <p>Over 5,000 happy customers across India trust Rijisha for their silver moments.</p>
          </div>
          <div className="t-grid">
            <div className="t-card">
              <div className="stars">★★★★★</div>
              <p>"The Meera Jhumkas are even more beautiful in person. The finish is flawless and they're so light I forget I'm wearing them."</p>
              <div className="t-who">
                <span className="t-avatar">AS</span>
                <div><b>Ananya Sharma</b><span>Mumbai</span></div>
              </div>
            </div>
            <div className="t-card">
              <div className="stars">★★★★★</div>
              <p>"Bought the Tara layered necklace for my sister's wedding. Everyone asked where it was from. Packaging felt like a gift itself!"</p>
              <div className="t-who">
                <span className="t-avatar">PR</span>
                <div><b>Priya Raghavan</b><span>Bengaluru</span></div>
              </div>
            </div>
            <div className="t-card">
              <div className="stars">★★★★★</div>
              <p>"Six months of daily wear and my hoops still shine like day one. The anti-tarnish coating truly works. Fully worth it."</p>
              <div className="t-who">
                <span className="t-avatar">MK</span>
                <div><b>Meghna Kapoor</b><span>Delhi</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
