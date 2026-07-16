import JewelArt from './JewelArt';
import { INSTAGRAM_URL } from '../links';
import { STRINGS } from '../strings';
import { MEDIA_TYPE } from '../enums';

const FALLBACK_ARTS = ['jhumka', 'layered', 'hoops', 'pendant', 'chandbali', 'moon'];
const FALLBACK_BGS = ['bg-a', 'bg-b', 'bg-c', 'bg-d', 'bg-b', 'bg-a'];

// "As worn by you" — a six-tile photo strip linking to Instagram.
// Uses real product photos when available, illustrations otherwise.
export default function InstaStrip({ products = [] }) {
  const photos = products
    .map((p) => p.media?.find((m) => m.type === MEDIA_TYPE.IMAGE)?.url || p.image)
    .filter(Boolean)
    .slice(0, 6);

  return (
    <section className="section insta-section">
      <div className="container">
        <div className="section-head">
          <span className="section-eyebrow">{STRINGS.home.instaEyebrow}</span>
          <h2>{STRINGS.home.instaTitle}</h2>
          <p>{STRINGS.home.instaText}</p>
        </div>
        <div className="insta-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <a
              className={`insta-tile ${photos[i] ? '' : FALLBACK_BGS[i]}`}
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              key={i}
              aria-label={STRINGS.home.instaCta}
            >
              {photos[i]
                ? <img src={photos[i]} alt="" loading="lazy" />
                : <JewelArt art={FALLBACK_ARTS[i]} />}
              <span className="insta-overlay">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" /></svg>
              </span>
            </a>
          ))}
        </div>
        <div className="center-cta">
          <a className="btn btn-ghost" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
            {STRINGS.home.instaCta}
          </a>
        </div>
      </div>
    </section>
  );
}
