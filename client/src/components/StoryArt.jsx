// Editorial artwork for the two "Our Story" frames on Home and About.
//
// These stand in for photography we don't have yet. They are the fallback, not
// the plan: StoryPhoto only renders them once the real <img> 404s, so dropping
// files at /images/story-atelier.jpg and /images/story-detail.jpg silently
// takes over with no code change.
//
// What keeps flat vector work from reading as clip art is not more detail, it's
// light behaving like light. Four things do the heavy lifting here:
//   1. cast shadows (feDropShadow), so objects sit in front of the ground
//   2. surface noise + brushed anisotropy, so metal isn't a clean gradient
//   3. small, hard speculars instead of large soft ones
//   4. a light source that MOVES — see usePointerLight below
// The last is the one that sells it: a highlight travelling across the metal as
// you move is something a photograph can't do and a flat illustration never does.
//
// Gradient ids are prefixed per-composition (sa*/sd*) because both SVGs render
// on the same page and ids are document-global. They deliberately do NOT reuse
// <SvgDefs/> from JewelArt — these need a warmer, lit palette than the flat
// product icons, and keeping them self-contained means the art travels with the
// component.

import { useEffect, useRef, useState } from 'react';

// Home and About draw the same two frames, so the swap lives here next to the
// art it swaps in.
//
// `sources` is a preference order, tried in turn as each one 404s: the admin's
// upload first, then anything bundled at /images/, and only then the drawn art.
// Falsy entries are skipped, so callers can pass a not-yet-loaded upload URL
// without guarding. The list is re-tried from the top whenever it changes,
// which is what lets an upload fetched after mount take over from the art.
export function StoryPhoto({ sources, alt, fallback: Fallback }) {
  // What's tracked is WHICH urls failed, not how far down the list we've got.
  // An index needs resetting whenever `sources` changes, and that reset can only
  // run in an effect — i.e. after a render that already used the stale index, so
  // the late-arriving upload flashes the previously-failed url and a leftover
  // onError from it then advances past the good one. Keyed by url, order stops
  // mattering: a stale error marks that url dead, which is simply true.
  const [failed, setFailed] = useState(() => new Set());
  const src = (sources || []).find((s) => s && !failed.has(s));
  // Hooks run unconditionally — the early return below is after them.
  const ref = usePointerLight();

  // The art carries its own .story-art wrapper and pointer hook, so hand off
  // whole rather than nesting one inside another.
  if (!src) return <Fallback className="story-photo" />;

  // A photo gets the same lit frame the artwork does. Tilt and travelling gloss
  // are properties of the FRAME, not of the drawing — wiring them only into the
  // SVG meant uploading a photo silently turned the whole effect off.
  // Keyed by src so a swap remounts the <img>; without it React reuses the
  // element and a second failure never fires onError.
  return (
    <div className="story-photo story-art has-photo" ref={ref}>
      <img
        key={src}
        className="story-media"
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed((prev) => new Set(prev).add(src))}
      />
      <span className="story-gloss" aria-hidden="true" />
    </div>
  );
}

/* Publishes the pointer's position over the whole story visual as --px/--py in
   -1..1, which the stylesheet turns into parallax, tilt and highlight travel.
 * Both frames listen to the SAME host (.story-stack) so they are lit by one
   shared source rather than each reacting to its own box — that consistency is
   most of why the effect reads as physical.
 * Bails out entirely on touch and on prefers-reduced-motion; CSS then leaves the
   slow idle drift running instead, so those users still get moving light. */
function usePointerLight() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window.matchMedia !== 'function') return undefined;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || still.matches) return undefined;

    const host = el.closest('.story-stack') || el;
    let frame = 0;
    let pending = null;

    const apply = () => {
      frame = 0;
      const box = el.getBoundingClientRect();
      if (!box.width || !box.height) return;
      el.style.setProperty('--px', (((pending.x - box.left) / box.width) * 2 - 1).toFixed(3));
      el.style.setProperty('--py', (((pending.y - box.top) / box.height) * 2 - 1).toFixed(3));
    };
    const onMove = (e) => {
      pending = { x: e.clientX, y: e.clientY };
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onEnter = () => el.classList.add('is-live');
    const onLeave = () => {
      el.classList.remove('is-live');
      el.style.setProperty('--px', '0');
      el.style.setProperty('--py', '0');
    };

    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerenter', onEnter);
    host.addEventListener('pointerleave', onLeave);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerenter', onEnter);
      host.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return ref;
}

/* Film grain over a lit gradient breaks up the banding that gives flat vector
   work away. */
const Grain = ({ id, size }) => (
  <rect
    width={size}
    height={size}
    fill="#808080"
    filter={`url(#${id})`}
    opacity="0.24"
    style={{ mixBlendMode: 'overlay' }}
  />
);

/* A four-point glint. Drawn once at unit scale and placed by transform so the
   sparkles can sit on whichever facets catch the light. */
const GLINT = 'M0 -1 Q0.13 -0.13 1 0 Q0.13 0.13 0 1 Q-0.13 0.13 -1 0 Q-0.13 -0.13 0 -1 Z';
const Glint = ({ x, y, r, o = 0.85 }) => (
  <path d={GLINT} fill="#ffffff" opacity={o} transform={`translate(${x} ${y}) scale(${r})`} />
);

const DROP_PATH =
  'M200 190 C187 216 170 242 170 266 C170 291 183 308 200 308 C217 308 230 291 230 266 C230 242 213 216 200 190 Z';

export function StoryArtMain({ className }) {
  const ref = usePointerLight();

  return (
    <div className={`${className} story-art`} ref={ref}>
      <svg
        viewBox="0 0 400 500"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label="Illustration of a handcrafted sterling silver pendant on its chain, lit against a dark ground"
      >
        <defs>
          <linearGradient id="saGround" x1="0.1" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#17171d" />
            <stop offset="48%" stopColor="#32353d" />
            <stop offset="100%" stopColor="#50555e" />
          </linearGradient>
          <radialGradient id="saLight" cx="0.46" cy="0.36" r="0.6">
            <stop offset="0%" stopColor="#d8b075" stopOpacity="0.34" />
            <stop offset="50%" stopColor="#9a7b4f" stopOpacity="0.11" />
            <stop offset="100%" stopColor="#9a7b4f" stopOpacity="0" />
          </radialGradient>
          {/* Kept modest — the travelling lamp screens on top of this, and the
              two stacking is what produced a bloom blob in the frame's centre. */}
          <radialGradient id="saHalo" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#c9a468" stopOpacity="0.2" />
            <stop offset="45%" stopColor="#c9a468" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#c9a468" stopOpacity="0" />
          </radialGradient>
          {/* The travelling lamp. Screen-blended over everything so moving it
              relights ground and metal together — but kept low, because a bright
              screened radial over a whole frame reads as lens bloom, not as a
              light source. The specular below does the visible work. */}
          <radialGradient id="saLamp" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#ffe6bd" stopOpacity="0.15" />
            <stop offset="45%" stopColor="#c9a468" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#9a7b4f" stopOpacity="0" />
          </radialGradient>
          {/* Hard-centred and tight, so the specular stays a glint not a smear. */}
          <radialGradient id="saSpec" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="30%" stopColor="#ffffff" stopOpacity="0.13" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          {/* Starts at a soft pewter rather than pure white — a #fff stop here
              blows the top-left third of the drop into one flat highlight. */}
          <linearGradient id="saMetal" x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#eceff3" />
            <stop offset="30%" stopColor="#c4c9d1" />
            <stop offset="64%" stopColor="#7d8490" />
            <stop offset="100%" stopColor="#b3b9c2" />
          </linearGradient>
          <linearGradient id="saMetalDeep" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e4e8ed" />
            <stop offset="52%" stopColor="#939ba8" />
            <stop offset="100%" stopColor="#636a76" />
          </linearGradient>
          <radialGradient id="saStone" cx="0.34" cy="0.26" r="0.92">
            <stop offset="0%" stopColor="#f6ead4" />
            <stop offset="38%" stopColor="#c9a468" />
            <stop offset="100%" stopColor="#795d34" />
          </radialGradient>
          <radialGradient id="saPearl" cx="0.34" cy="0.28" r="0.9">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="58%" stopColor="#eae7e0" />
            <stop offset="100%" stopColor="#b8b2a6" />
          </radialGradient>
          <radialGradient id="saVignette" cx="0.5" cy="0.44" r="0.78">
            <stop offset="52%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
          </radialGradient>

          <filter id="saGrainF">
            <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          {/* Stretched noise — high frequency across, low along — reads as the
              directional grain of polished silver rather than as dirt. */}
          <filter id="saBrush">
            <feTurbulence type="fractalNoise" baseFrequency="0.014 0.75" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <filter id="saCast" x="-45%" y="-40%" width="190%" height="185%">
            <feDropShadow dx="2" dy="7" stdDeviation="7" floodColor="#05050a" floodOpacity="0.3" />
          </filter>
          {/* Throws the backdrop very slightly out of focus, which is what puts
              the piece on its own focal plane. */}
          <filter id="saDefocus">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>

          <clipPath id="saDropClip">
            <path d={DROP_PATH} />
          </clipPath>
        </defs>

        <rect width="400" height="500" fill="url(#saGround)" />
        <rect width="400" height="500" fill="url(#saLight)" />

        <g className="l-back">
          {/* Faint guilloché rings, like the turned finish on a jeweller's bench block. */}
          <g fill="none" stroke="#ffffff" filter="url(#saDefocus)">
            <circle cx="196" cy="234" r="118" strokeOpacity="0.07" />
            <circle cx="196" cy="234" r="162" strokeOpacity="0.05" />
            <circle cx="196" cy="234" r="212" strokeOpacity="0.03" />
          </g>
          <ellipse cx="200" cy="296" rx="124" ry="146" fill="url(#saHalo)" />
        </g>

        {/* The necklace is one rigid object, so it parallaxes as one layer —
            splitting chain from pendant would visibly pull the piece apart. */}
        <g className="l-piece">
          <g transform="translate(0 34)" filter="url(#saCast)">
            <path d="M46 54 Q200 258 354 54" fill="none" stroke="url(#saMetalDeep)" strokeWidth="7" strokeLinecap="round" />
            <path
              d="M46 54 Q200 258 354 54"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.38"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="3 11"
            />

            {/* Accent stones seated on the chain, mirrored either side of centre. */}
            <g fill="url(#saStone)">
              <circle cx="123" cy="131" r="6.5" />
              <circle cx="277" cy="131" r="6.5" />
            </g>
            <g fill="url(#saPearl)">
              <circle cx="83" cy="97" r="5" />
              <circle cx="317" cy="97" r="5" />
            </g>

            {/* Bail. The connector is a flat colour on purpose: a vertical line
                has a zero-width bounding box, so an objectBoundingBox gradient
                collapses and the browser drops the element entirely. */}
            <circle cx="200" cy="166" r="10" fill="none" stroke="url(#saMetalDeep)" strokeWidth="5" />
            <path d="M200 176 v14" stroke="#9aa2ae" strokeWidth="4.5" strokeLinecap="round" />

            {/* Teardrop body — all cubics, so the silhouette stays a true pear. */}
            <path d={DROP_PATH} fill="url(#saMetal)" />
            <g clipPath="url(#saDropClip)">
              <rect
                x="160"
                y="180"
                width="80"
                height="140"
                fill="#8f97a3"
                filter="url(#saBrush)"
                opacity="0.16"
                style={{ mixBlendMode: 'overlay' }}
              />
              {/* Ambient occlusion where the pear turns away from the light. */}
              <ellipse cx="238" cy="286" rx="34" ry="52" fill="#0b0e14" opacity="0.26" />
              <ellipse className="spec" cx="194" cy="238" rx="30" ry="46" fill="url(#saSpec)" />
            </g>
            <path
              d="M190 212 C181 234 177 252 178 266"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.42"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            {/* Centre stone — same cut as the macro frame, set small. */}
            <circle cx="200" cy="268" r="25" fill="url(#saMetalDeep)" />
            <Gem cx={200} cy={268} r={20} table="saStone" />

            {/* Drop pearl (flat-coloured connector, same zero-bbox reason as the bail) */}
            <path d="M200 308 v12" stroke="#9aa2ae" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="200" cy="332" r="10.5" fill="url(#saPearl)" />
            <ellipse cx="196" cy="328" rx="3.4" ry="2.2" fill="#ffffff" opacity="0.55" transform="rotate(-32 196 328)" />

            <Glint x={190} y={258} r={7} o={0.6} />
            <Glint x={277} y={131} r={5} o={0.6} />
          </g>
        </g>

        {/* Dust sits nearest the lens, so it travels furthest. */}
        <g className="l-dust" fill="#ffffff">
          <circle cx="118" cy="196" r="1.6" opacity="0.3" />
          <circle cx="292" cy="228" r="1.3" opacity="0.24" />
          <circle cx="148" cy="392" r="1.8" opacity="0.2" />
          <circle cx="268" cy="126" r="1.4" opacity="0.28" />
          <circle cx="96" cy="300" r="1.2" opacity="0.22" />
        </g>

        <ellipse className="lamp" cx="200" cy="250" rx="230" ry="270" fill="url(#saLamp)" />
        <rect width="400" height="500" fill="url(#saVignette)" />
        <Grain id="saGrainF" size={500} />
      </svg>
    </div>
  );
}

/* Round-brilliant crown, generated rather than eyeballed: girdle r=126, star
   ring r=80, table r=46, all about (150,150), with each facet flat-shaded from
   its centroid angle against a light at 215°. That single rule is what makes
   neighbouring facets step in brightness the way a real cut stone does. */
const GEM_FACETS = [
  ['M276 150 L266.4 198.2 L223.9 180.6 Z', '#4a3820'],
  ['M266.4 198.2 L239.1 239.1 L223.9 180.6 Z', '#4f3e26'],
  ['M223.9 180.6 L239.1 239.1 L180.6 223.9 Z', '#44321a'],
  ['M239.1 239.1 L198.2 266.4 L180.6 223.9 Z', '#4b3a22'],
  ['M198.2 266.4 L150 276 L180.6 223.9 Z', '#64533c'],
  ['M180.6 223.9 L150 276 L119.4 223.9 Z', '#594830'],
  ['M150 276 L101.8 266.4 L119.4 223.9 Z', '#7a6b54'],
  ['M101.8 266.4 L60.9 239.1 L119.4 223.9 Z', '#9e907a'],
  ['M119.4 223.9 L60.9 239.1 L76.1 180.6 Z', '#988a74'],
  ['M60.9 239.1 L33.6 198.2 L76.1 180.6 Z', '#baae99'],
  ['M33.6 198.2 L24 150 L76.1 180.6 Z', '#dbd0bb'],
  ['M76.1 180.6 L24 150 L76.1 119.4 Z', '#cec3ae'],
  ['M24 150 L33.6 101.8 L76.1 119.4 Z', '#e7ddc8'],
  ['M33.6 101.8 L60.9 60.9 L76.1 119.4 Z', '#f7eeda'],
  ['M76.1 119.4 L60.9 60.9 L119.4 76.1 Z', '#dcd1bd'],
  ['M60.9 60.9 L101.8 33.6 L119.4 76.1 Z', '#e5dbc6'],
  ['M101.8 33.6 L150 24 L119.4 76.1 Z', '#e3d9c4'],
  ['M119.4 76.1 L150 24 L180.6 76.1 Z', '#b9ad98'],
  ['M150 24 L198.2 33.6 L180.6 76.1 Z', '#b6aa94'],
  ['M198.2 33.6 L239.1 60.9 L180.6 76.1 Z', '#a99c86'],
  ['M180.6 76.1 L239.1 60.9 L223.9 119.4 Z', '#7b6b54'],
  ['M239.1 60.9 L266.4 101.8 L223.9 119.4 Z', '#76664f'],
  ['M266.4 101.8 L276 150 L223.9 119.4 Z', '#6c5c45'],
  ['M223.9 119.4 L276 150 L223.9 180.6 Z', '#44321a'],
  ['M223.9 180.6 L180.6 223.9 L167.6 192.5 L192.5 167.6 Z', '#58472f'],
  ['M180.6 223.9 L119.4 223.9 L132.4 192.5 L167.6 192.5 Z', '#7b6b54'],
  ['M119.4 223.9 L76.1 180.6 L107.5 167.6 L132.4 192.5 Z', '#b9ad98'],
  ['M76.1 180.6 L76.1 119.4 L107.5 132.4 L107.5 167.6 Z', '#f0e6d2'],
  ['M76.1 119.4 L119.4 76.1 L132.4 107.5 L107.5 132.4 Z', '#fef5e1'],
  ['M119.4 76.1 L180.6 76.1 L167.6 107.5 L132.4 107.5 Z', '#dbd0bc'],
  ['M180.6 76.1 L223.9 119.4 L192.5 132.4 L167.6 107.5 Z', '#9c8e78'],
  ['M223.9 119.4 L223.9 180.6 L192.5 167.6 L192.5 132.4 Z', '#66563e'],
];

/* Dispersion. A real stone splits light, so a handful of facets get a screened
   colour cast — without this every facet is the same hue at a different
   brightness, which is the single biggest tell that a gem was drawn.
   Tints land on mid and dark facets only — screening a colour onto an already
   near-white facet changes nothing, so the bright side of the stone is left
   alone and the fire shows where there's headroom for it. Girdle facets only
   (indices < 24): the star facets are large, and a tint across one of those
   reads as discoloration rather than as a flash. */
const GEM_FIRE = [
  [5, '#7fd8ff'],
  [8, '#ffb27a'],
  [20, '#a8ffe0'],
  [2, '#ff9ecb'],
  [22, '#9ec8ff'],
];

const GEM_TABLE =
  'M192.5 167.6 L167.6 192.5 L132.4 192.5 L107.5 167.6 L107.5 132.4 L132.4 107.5 L167.6 107.5 L192.5 132.4 Z';

/* One stone, two sizes: the macro frame shows it at 1.22×, and the pendant sets
   the same geometry at r≈20 so the two frames read as the same house style
   rather than two unrelated drawings. `table` is the gradient id to fill the
   crown with, since the two compositions carry their own defs. */
const Gem = ({ cx, cy, r, table }) => {
  const k = r / 126;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${k}) translate(-150 -150)`}>
      {GEM_FACETS.map(([d, fill]) => (
        <path key={d} d={d} fill={fill} />
      ))}
      {GEM_FIRE.map(([i, tint]) => (
        <path key={`fire${i}`} d={GEM_FACETS[i][0]} fill={tint} opacity="0.16" style={{ mixBlendMode: 'screen' }} />
      ))}
      <path d={GEM_TABLE} fill={`url(#${table})`} />
      <path d={GEM_TABLE} fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth={1.5 / k} />
    </g>
  );
};

export function StoryArtDetail({ className }) {
  const ref = usePointerLight();

  return (
    <div className={`${className} story-art`} ref={ref}>
      <svg
        viewBox="0 0 300 300"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label="Close-up illustration of a brilliant-cut gemstone set in a silver bezel"
      >
        <defs>
          <linearGradient id="sdGround" x1="0.2" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#202028" />
            <stop offset="55%" stopColor="#383c44" />
            <stop offset="100%" stopColor="#555a64" />
          </linearGradient>
          <radialGradient id="sdLight" cx="0.34" cy="0.26" r="0.66">
            <stop offset="0%" stopColor="#dcb478" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#9a7b4f" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sdLamp" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#fff1d6" stopOpacity="0.16" />
            <stop offset="42%" stopColor="#c9a468" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#9a7b4f" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sdSpec" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.42" />
            <stop offset="34%" stopColor="#ffffff" stopOpacity="0.11" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          {/* userSpaceOnUse, so the ring and every claw are lit by one shared
              sweep. Per-element (the default) each claw would get the whole
              gradient across its own tiny box and read as a chrome tube. */}
          <linearGradient id="sdBezel" gradientUnits="userSpaceOnUse" x1="34" y1="18" x2="266" y2="282">
            <stop offset="0%" stopColor="#fdfdfe" />
            <stop offset="32%" stopColor="#ccd0d7" />
            <stop offset="70%" stopColor="#7f8793" />
            <stop offset="100%" stopColor="#bcc1ca" />
          </linearGradient>
          <radialGradient id="sdTable" cx="0.34" cy="0.28" r="0.85">
            <stop offset="0%" stopColor="#fdf6e6" />
            <stop offset="45%" stopColor="#e2cb9c" />
            <stop offset="100%" stopColor="#b08f57" />
          </radialGradient>
          <radialGradient id="sdVignette" cx="0.5" cy="0.42" r="0.76">
            <stop offset="48%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.52" />
          </radialGradient>
          <filter id="sdGrainF">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          {/* No cast shadow on this frame: a macro crop has no visible ground
              for one to fall on, so it only ever renders as a black rim. */}
          <clipPath id="sdStoneClip">
            <circle cx="150" cy="150" r="150" />
          </clipPath>
        </defs>

        <rect width="300" height="300" fill="url(#sdGround)" />
        <rect width="300" height="300" fill="url(#sdLight)" />

        {/* Scaled up about centre so the stone bleeds off all four edges and only
            the bezel and prongs survive in the corners — that crop is what reads
            as a macro frame rather than a shrunken whole-object icon. */}
        <g className="l-gem">
          <g transform="translate(150 150) scale(1.15) translate(-150 -150)">
            <circle cx="150" cy="150" r="135" fill="none" stroke="url(#sdBezel)" strokeWidth="17" />
            <circle cx="150" cy="150" r="142.5" fill="none" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="2" />
            <Gem cx={150} cy={150} r={126} table="sdTable" />
            {/* Claws, not beads. Drawn once at twelve o'clock folding inward over
                the girdle (which sits at r=126, so the tab spans y≈0–39), then
                rotated onto the diagonals — the only corners the crop keeps. */}
            {[45, 135, 225, 315].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 150 150)`}>
                <path
                  d="M128 0 L172 0 L172 20 C172 31 162 39 150 39 C138 39 128 31 128 20 Z"
                  fill="url(#sdBezel)"
                />
                <path d="M136 8 L136 22" stroke="#ffffff" strokeOpacity="0.32" strokeWidth="3" strokeLinecap="round" />
              </g>
            ))}
          </g>
          <g clipPath="url(#sdStoneClip)">
            <ellipse className="spec" cx="118" cy="114" rx="56" ry="64" fill="url(#sdSpec)" />
          </g>
        </g>

        <Glint x={96} y={92} r={17} o={0.75} />
        <Glint x={196} y={183} r={9} o={0.4} />
        <Glint x={62} y={166} r={7} o={0.45} />

        <ellipse className="lamp" cx="150" cy="150" rx="180" ry="180" fill="url(#sdLamp)" />
        <rect width="300" height="300" fill="url(#sdVignette)" />
        <Grain id="sdGrainF" size={300} />
      </svg>
    </div>
  );
}
