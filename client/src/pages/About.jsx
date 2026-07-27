import { useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { usePageTitle } from '../usePageTitle';
import { STRINGS } from '../strings';
import { ETSY_URL, whatsappUrl } from '../links';

const STORY_MAIN = '/images/story-atelier.jpg';
const STORY_DETAIL = '/images/story-detail.jpg';

// Same treatment the home page uses: the photo is optional, and until one is
// uploaded the frame falls back to the monogram rather than a broken image.
function StoryPhoto({ src, alt, monogram = false }) {
  const [missing, setMissing] = useState(false);
  if (missing) return monogram ? <span className="story-placeholder">R</span> : null;
  return <img className="story-photo" src={src} alt={alt} loading="lazy" onError={() => setMissing(true)} />;
}

// Paths only — the <svg> wrapper is shared, so the icons stay plain data and
// need no keys of their own.
const VALUE_ICON_PATHS = [
  // One of one — a star
  ['m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6L12 16.8 6.6 19.6l1.2-6L3.3 9.4l6.1-.8L12 3Z'],
  // Hallmarked silver — a shield with a tick
  ['M12 2 3 7v6c0 5 4 8 9 9 5-1 9-4 9-9V7l-9-5Z', 'm9 12 2 2 4-4'],
  // Made by hand
  [
    'M12 10.4 9.4 7.8a1.85 1.85 0 0 1 2.6-2.6 1.85 1.85 0 0 1 2.6 2.6L12 10.4Z',
    'M5 13.6v3.1a4.6 4.6 0 0 0 4.6 4.6h4.8a4.6 4.6 0 0 0 4.6-4.6v-3.1',
    'M5 13.6a1.7 1.7 0 0 1 3.4 0v1.7M19 13.6a1.7 1.7 0 0 0-3.4 0v1.7',
  ],
  // Honest pricing — a rupee mark
  ['M12 3v18', 'M6 6h9a3 3 0 0 1 0 6H6h9a3 3 0 0 1 0 6H6'],
];

const ValueIcon = ({ paths }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {paths.map((d) => <path key={d} d={d} />)}
  </svg>
);

export default function About() {
  usePageTitle(STRINGS.titles.about);

  return (
    <>
      {/* Intro */}
      <section className="section about-intro">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="section-eyebrow">{STRINGS.about.eyebrow}</span>
              <h2>{STRINGS.about.title}</h2>
              <p>{STRINGS.about.intro}</p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="about-stats">
              {STRINGS.about.stats.map((stat) => {
                // Short values ("3", "92.5%") stay display-sized. A written-out
                // phrase is set smaller and, on narrow screens, given the whole
                // row so it never has to wrap.
                const phrase = stat.value.length > 8;
                return (
                  <div className={`about-stat ${phrase ? 'wide' : ''}`} key={stat.label}>
                    <b className={phrase ? 'phrase' : ''}>{stat.value}</b>
                    <span>{stat.label}</span>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Story */}
      <section className="section">
        <Reveal>
          <div className="container story-inner">
            <div className="story-visual">
              <div className="story-stack">
                <div className="story-frame">
                  <StoryPhoto src={STORY_MAIN} alt={STRINGS.home.storyMainAlt} monogram />
                </div>
                <div className="story-detail">
                  <StoryPhoto src={STORY_DETAIL} alt={STRINGS.home.storyDetailAlt} />
                </div>
                <div className="story-badge">{STRINGS.home.storyBadge}</div>
              </div>
            </div>
            <div className="story-text">
              <span className="section-eyebrow">{STRINGS.about.storyEyebrow}</span>
              <h2>{STRINGS.about.storyTitle}</h2>
              {STRINGS.about.storyParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <ul className="story-points">
                {STRINGS.about.storyPoints.map((point) => (
                  <li key={point}><span className="tick">✓</span> {point}</li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </section>

      {/* What we stand for */}
      <section className="section about-values-section">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="section-eyebrow">{STRINGS.about.valuesEyebrow}</span>
              <h2>{STRINGS.about.valuesTitle}</h2>
              <p>{STRINGS.about.valuesText}</p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="about-values">
              {STRINGS.about.values.map((value, i) => (
                <div className="about-value" key={value.title}>
                  <span className="about-value-icon"><ValueIcon paths={VALUE_ICON_PATHS[i]} /></span>
                  <h3>{value.title}</h3>
                  <p>{value.text}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* How a piece is made */}
      <section className="section">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="section-eyebrow">{STRINGS.about.craftEyebrow}</span>
              <h2>{STRINGS.about.craftTitle}</h2>
              <p>{STRINGS.about.craftText}</p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <ol className="about-steps">
              {STRINGS.about.craftSteps.map((step, i) => (
                <li key={step.title}>
                  <span className="about-step-no">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* Visit / buy */}
      <section className="section about-visit">
        <div className="container">
          <Reveal>
            <div className="about-visit-card">
              <span className="section-eyebrow">{STRINGS.about.visitEyebrow}</span>
              <h2>{STRINGS.about.visitTitle}</h2>
              <p>{STRINGS.about.visitText}</p>
              <address>{STRINGS.footer.address}</address>
              <div className="about-visit-actions">
                <a className="btn btn-etsy" href={ETSY_URL} target="_blank" rel="noreferrer">
                  {STRINGS.common.buyOnEtsy}
                </a>
                <a
                  className="btn btn-ghost"
                  href={whatsappUrl(STRINGS.whatsapp.message)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {STRINGS.about.visitWhatsApp}
                </a>
                <Link className="btn btn-dark" to="/shop">{STRINGS.about.visitShop}</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
