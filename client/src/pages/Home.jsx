import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import JewelArt from '../components/JewelArt';
import ProductCard from '../components/ProductCard';
import SkeletonGrid from '../components/SkeletonGrid';
import Reveal from '../components/Reveal';
import InstaStrip from '../components/InstaStrip';
import { StoryPhoto, StoryArtMain, StoryArtDetail } from '../components/StoryArt';
import { usePageTitle } from '../usePageTitle';
import { CATEGORY, CATEGORY_LABEL, HERO_SLOT, SORT, STORY_SLOT, STORY_DETAIL_SLOT } from '../enums';
import { STRINGS } from '../strings';

const COLLECTIONS = [
  { key: CATEGORY.EARRINGS, art: 'earringsPair' },
  { key: CATEGORY.NECKLACES, art: 'necklaceCat' },
  { key: CATEGORY.BRACELETS, art: 'bangle', comingSoon: true },
  { key: CATEGORY.ANTIQUE, art: 'tikka' },
].map((c) => ({ ...c, title: CATEGORY_LABEL[c.key], sub: STRINGS.home.collectionSub[c.key] }));

// Story visual — real photography wins whenever it exists, in this order: what
// the admin uploaded (Homepage Media → Our Story), then anything bundled at
// these paths, then the StoryArt compositions. The art depicts the jewellery
// itself, never a stand-in "artisan", so the section's claims about real people
// are only ever carried by the copy.
const STORY_MAIN = '/images/story-atelier.jpg';
const STORY_DETAIL = '/images/story-detail.jpg';

export default function Home() {
  usePageTitle(STRINGS.titles.home);
  const [products, setProducts] = useState([]);
  const [collectionImages, setCollectionImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/products?sort=${SORT.RATING}`)
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
            <span className="hero-eyebrow">{STRINGS.home.heroEyebrow}</span>
            <h1>{STRINGS.home.heroTitle}</h1>
            <p>{STRINGS.home.heroText}</p>
            <div className="hero-cta">
              <Link to="/shop" className="btn btn-dark">{STRINGS.home.heroCtaShop}</Link>
              <a href="#story" className="btn btn-ghost">{STRINGS.home.heroCtaStory}</a>
            </div>
            <div className="hero-stats">
              {STRINGS.home.heroStats.map((stat) => (
                <div className="hero-stat" key={stat.label}><b>{stat.value}</b><span>{stat.label}</span></div>
              ))}
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-ring"></div>
            <div className="hero-frame">
              <video
                key={collectionImages[HERO_SLOT] || 'default-hero'}
                className="hero-video"
                src={collectionImages[HERO_SLOT] || '/videos/hero-jewellery.mp4'}
                autoPlay
                muted
                loop
                playsInline
                aria-label={STRINGS.home.heroVideoAria}
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
          <Reveal>
            <div className="section-head">
              <span className="section-eyebrow">{STRINGS.home.collectionsEyebrow}</span>
              <h2>{STRINGS.home.collectionsTitle}</h2>
              <p>{STRINGS.home.collectionsText}</p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="cats">
              {COLLECTIONS.map((c) => {
                const CardTag = c.comingSoon ? 'div' : Link;
                return (
                  <CardTag
                    {...(c.comingSoon ? {} : { to: `/shop?category=${c.key}` })}
                    className={`cat-card cat-${c.key} ${collectionImages[c.key] ? 'has-photo' : ''} ${c.comingSoon ? 'cat-soon' : ''}`}
                    key={c.key}
                  >
                    {c.comingSoon && <span className="cat-soon-badge">{STRINGS.home.comingSoonBadge}</span>}
                    {collectionImages[c.key]
                      ? <img src={collectionImages[c.key]} alt={STRINGS.home.collectionAlt(c.title)} className="cat-photo" loading="lazy" />
                      : <JewelArt art={c.art} />}
                    <div className="cat-label">
                      <div>
                        <h3>{c.title}</h3>
                        <span>{c.comingSoon ? STRINGS.home.comingSoonSub : c.sub}</span>
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
          </Reveal>
        </div>
      </section>

      {/* Featured */}
      <section className="section shop-band">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="section-eyebrow">{STRINGS.home.featuredEyebrow}</span>
              <h2>{STRINGS.home.featuredTitle}</h2>
              <p>{STRINGS.home.featuredText}</p>
            </div>
          </Reveal>
          {error && <p className="form-error center">{error}</p>}
          {loading ? (
            <SkeletonGrid count={4} />
          ) : (
            <Reveal delay={100}>
              <div className="grid">
                {featured.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
            </Reveal>
          )}
          <div className="center-cta">
            <Link to="/shop" className="btn btn-ghost">{STRINGS.home.viewAll}</Link>
          </div>
        </div>
      </section>

      {/* Promises */}
      <section className="promises">
        <div className="container promises-inner">
          <div className="promise">
            <span className="promise-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 2 3 7v6c0 5 4 8 9 9 5-1 9-4 9-9V7l-9-5Z" /><path d="m9 12 2 2 4-4" /></svg></span>
            <div><b>{STRINGS.home.promises[0].title}</b><span>{STRINGS.home.promises[0].sub}</span></div>
          </div>
          <div className="promise">
            <span className="promise-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 10.4 9.4 7.8a1.85 1.85 0 0 1 2.6-2.6 1.85 1.85 0 0 1 2.6 2.6L12 10.4Z" /><path d="M5 13.6v3.1a4.6 4.6 0 0 0 4.6 4.6h4.8a4.6 4.6 0 0 0 4.6-4.6v-3.1" /><path d="M5 13.6a1.7 1.7 0 0 1 3.4 0v1.7M19 13.6a1.7 1.7 0 0 0-3.4 0v1.7" /></svg></span>
            <div><b>{STRINGS.home.promises[1].title}</b><span>{STRINGS.home.promises[1].sub}</span></div>
          </div>
          <div className="promise">
            <span className="promise-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21 3.5 9.5 6.8 3h10.4l3.3 6.5L12 21Z" /><path d="M3.5 9.5h17" /><path d="M9 3 7.4 9.5 12 21l4.6-11.5L15 3" /></svg></span>
            <div><b>{STRINGS.home.promises[2].title}</b><span>{STRINGS.home.promises[2].sub}</span></div>
          </div>
          <div className="promise">
            <span className="promise-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15.2V13a2 2 0 0 1 4 0v3" /><path d="M8.5 16.6V13a3.5 3.5 0 0 1 7 0v4.2" /><path d="M7 15.4V13a5 5 0 0 1 10 0v2.6" /><path d="M5.5 15V13a6.5 6.5 0 0 1 13 0v2" /></svg></span>
            <div><b>{STRINGS.home.promises[3].title}</b><span>{STRINGS.home.promises[3].sub}</span></div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="section" id="story">
        <Reveal>
        <div className="container story-inner">
          <div className="story-visual">
            <div className="story-stack">
              <div className="story-frame">
                <StoryPhoto
                  sources={[collectionImages[STORY_SLOT], STORY_MAIN]}
                  alt={STRINGS.home.storyMainAlt}
                  fallback={StoryArtMain}
                />
              </div>
              <div className="story-detail">
                <StoryPhoto
                  sources={[collectionImages[STORY_DETAIL_SLOT], STORY_DETAIL]}
                  alt={STRINGS.home.storyDetailAlt}
                  fallback={StoryArtDetail}
                />
              </div>
              <div className="story-badge">{STRINGS.home.storyBadge}</div>
            </div>
          </div>
          <div className="story-text">
            <span className="section-eyebrow">{STRINGS.home.storyEyebrow}</span>
            <h2>{STRINGS.home.storyTitle}</h2>
            <p>{STRINGS.home.storyText1}</p>
            <p>{STRINGS.home.storyText2}</p>
            <ul className="story-points">
              {STRINGS.home.storyPoints.map((point) => (
                <li key={point}><span className="tick">✓</span> {point}</li>
              ))}
            </ul>
            <Link to="/shop" className="btn btn-dark">{STRINGS.home.storyCta}</Link>
          </div>
        </div>
        </Reveal>
      </section>

      {/* Testimonials */}
      <section className="section testimonials">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="section-eyebrow">{STRINGS.home.testimonialsEyebrow}</span>
              <h2>{STRINGS.home.testimonialsTitle}</h2>
              <p>{STRINGS.home.testimonialsText}</p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="t-grid">
              {STRINGS.home.testimonials.map((t) => (
                <div className="t-card" key={t.name}>
                  <div className="stars">★★★★★ <em className="t-via">{STRINGS.home.testimonialsVia}</em></div>
                  <p>{t.quote}</p>
                  <div className="t-who">
                    <span className="t-avatar">{t.initials}</span>
                    <div><b>{t.name}</b><span>{t.city}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Instagram strip */}
      <InstaStrip products={products} />
    </>
  );
}
