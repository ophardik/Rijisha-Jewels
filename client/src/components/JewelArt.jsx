// SVG illustrations for each product, keyed by `art` from the database.
// <SvgDefs/> is rendered once in App and provides the shared gradients.

export function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <linearGradient id="silver" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f4f5f7" />
          <stop offset="45%" stopColor="#c3c8d0" />
          <stop offset="75%" stopColor="#8d94a0" />
          <stop offset="100%" stopColor="#b9bec7" />
        </linearGradient>
        <linearGradient id="silverDark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d9dde3" />
          <stop offset="55%" stopColor="#9099a5" />
          <stop offset="100%" stopColor="#6a717d" />
        </linearGradient>
        <radialGradient id="pearl" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#e9e6df" />
          <stop offset="100%" stopColor="#bcb6a9" />
        </radialGradient>
        <radialGradient id="gem" cx="0.35" cy="0.3" r="0.95">
          <stop offset="0%" stopColor="#e8f4f4" />
          <stop offset="55%" stopColor="#9fc6c9" />
          <stop offset="100%" stopColor="#5d8d91" />
        </radialGradient>
      </defs>
    </svg>
  );
}

const ART = {
  jhumka: (
    <>
      <path d="M100 14 q-14 -12 -26 0 q-10 12 3 22 l17 12" fill="none" stroke="url(#silverDark)" strokeWidth="6" strokeLinecap="round" />
      <circle cx="100" cy="54" r="11" fill="url(#silver)" />
      <circle cx="100" cy="54" r="4" fill="url(#gem)" />
      <path d="M100 65 v14" stroke="url(#silverDark)" strokeWidth="4" />
      <path d="M56 132 a44 48 0 0 1 88 0 q0 10 -10 10 h-68 q-10 0 -10 -10 Z" fill="url(#silver)" />
      <path d="M66 132 a34 38 0 0 1 68 0" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="3" />
      <g fill="url(#pearl)">
        <circle cx="62" cy="156" r="7" /><circle cx="81" cy="161" r="7" /><circle cx="100" cy="164" r="7" /><circle cx="119" cy="161" r="7" /><circle cx="138" cy="156" r="7" />
      </g>
      <g stroke="url(#silverDark)" strokeWidth="2.5">
        <path d="M62 144 v5" /><path d="M81 147 v7" /><path d="M100 149 v8" /><path d="M119 147 v7" /><path d="M138 144 v5" />
      </g>
    </>
  ),
  hoops: (
    <>
      <path d="M100 20 q-12 -10 -22 0 q-9 11 3 19 l12 9" fill="none" stroke="url(#silverDark)" strokeWidth="6" strokeLinecap="round" />
      <circle cx="100" cy="130" r="72" fill="none" stroke="url(#silver)" strokeWidth="14" />
      <circle cx="100" cy="130" r="72" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeDasharray="40 320" strokeDashoffset="-60" />
      <circle cx="100" cy="58" r="8" fill="url(#silver)" />
    </>
  ),
  layered: (
    <>
      <path d="M28 26 q72 76 144 0" fill="none" stroke="url(#silverDark)" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M36 26 q64 108 128 0" fill="none" stroke="url(#silver)" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M44 26 q56 142 112 0" fill="none" stroke="url(#silverDark)" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="100" cy="64" r="7" fill="url(#pearl)" />
      <circle cx="100" cy="106" r="9" fill="url(#gem)" />
      <path d="M100 132 l14 20 -14 20 -14 -20 Z" fill="url(#silver)" />
      <path d="M100 138 l9 14 -9 14 -9 -14 Z" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
    </>
  ),
  pendant: (
    <>
      <path d="M30 24 q70 92 140 0" fill="none" stroke="url(#silverDark)" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 9" />
      <path d="M100 70 v16" stroke="url(#silverDark)" strokeWidth="4" />
      <circle cx="100" cy="92" r="7" fill="url(#silver)" />
      <path d="M100 100 c-24 12 -27 44 -6 57 c21 13 42 -7 34 -29 c-6 -17 -19 -24 -28 -28 Z" fill="url(#silver)" />
      <circle cx="100" cy="134" r="10" fill="url(#pearl)" />
      <path d="M88 122 a20 20 0 0 1 15 -13" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  chandbali: (
    <>
      <path d="M100 16 q-13 -11 -24 0 q-9 11 3 20 l15 11" fill="none" stroke="url(#silverDark)" strokeWidth="6" strokeLinecap="round" />
      <circle cx="100" cy="54" r="10" fill="url(#silver)" />
      <path d="M46 96 a54 54 0 0 0 108 0 a70 70 0 0 1 -108 0 Z" fill="url(#silver)" transform="translate(0 26)" />
      <path d="M56 122 a44 44 0 0 0 88 0" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="3" />
      <circle cx="100" cy="100" r="8" fill="url(#gem)" />
      <path d="M100 64 v26" stroke="url(#silverDark)" strokeWidth="4" />
      <g fill="url(#pearl)">
        <circle cx="62" cy="182" r="6" /><circle cx="81" cy="192" r="6" /><circle cx="100" cy="196" r="7" /><circle cx="119" cy="192" r="6" /><circle cx="138" cy="182" r="6" />
      </g>
      <g stroke="url(#silverDark)" strokeWidth="2.5">
        <path d="M62 170 v6" /><path d="M81 178 v8" /><path d="M100 180 v9" /><path d="M119 178 v8" /><path d="M138 170 v6" />
      </g>
    </>
  ),
  choker: (
    <>
      <path d="M26 60 q74 66 148 0" fill="none" stroke="url(#silver)" strokeWidth="12" strokeLinecap="round" />
      <path d="M26 60 q74 66 148 0" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="3" strokeLinecap="round" />
      <g fill="url(#gem)">
        <circle cx="58" cy="82" r="6" /><circle cx="100" cy="94" r="8" /><circle cx="142" cy="82" r="6" />
      </g>
      <path d="M100 104 v14" stroke="url(#silverDark)" strokeWidth="3.5" />
      <circle cx="100" cy="128" r="10" fill="url(#pearl)" />
    </>
  ),
  drops: (
    <>
      <path d="M100 18 q-13 -11 -24 0 q-9 11 3 20 l15 11" fill="none" stroke="url(#silverDark)" strokeWidth="6" strokeLinecap="round" />
      <circle cx="100" cy="56" r="9" fill="url(#silver)" />
      <path d="M100 65 v20" stroke="url(#silverDark)" strokeWidth="4" />
      <ellipse cx="100" cy="130" rx="34" ry="46" fill="none" stroke="url(#silver)" strokeWidth="9" />
      <path d="M100 96 v14" stroke="url(#silverDark)" strokeWidth="3" />
      <circle cx="100" cy="130" r="12" fill="url(#gem)" />
      <circle cx="100" cy="192" r="7" fill="url(#pearl)" />
      <path d="M100 176 v9" stroke="url(#silverDark)" strokeWidth="3" />
    </>
  ),
  moon: (
    <>
      <path d="M32 26 q68 84 136 0" fill="none" stroke="url(#silver)" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M100 68 v18" stroke="url(#silverDark)" strokeWidth="4" />
      <circle cx="100" cy="92" r="7" fill="url(#silver)" />
      <path d="M124 108 a44 44 0 1 0 8 52 a34 34 0 0 1 -8 -52 Z" fill="url(#silver)" />
      <circle cx="76" cy="130" r="4" fill="url(#gem)" />
      <circle cx="86" cy="156" r="3.5" fill="url(#gem)" />
      <circle cx="108" cy="168" r="3" fill="url(#gem)" />
    </>
  ),
  bangle: (
    <>
      <circle cx="100" cy="122" r="68" fill="none" stroke="url(#silver)" strokeWidth="16" />
      <circle cx="100" cy="122" r="68" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeDasharray="36 392" strokeDashoffset="-46" />
      <circle cx="100" cy="122" r="53" fill="none" stroke="url(#silverDark)" strokeWidth="1.5" strokeDasharray="2 7" />
      <g fill="url(#gem)">
        <circle cx="100" cy="54" r="8" />
        <circle cx="152" cy="88" r="5.5" />
        <circle cx="48" cy="88" r="5.5" />
      </g>
      <circle cx="100" cy="190" r="7" fill="url(#pearl)" />
    </>
  ),
  charm: (
    <>
      <path d="M28 74 q72 84 144 0" fill="none" stroke="url(#silverDark)" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 8" />
      <path d="M28 86 q72 84 144 0" fill="none" stroke="url(#silver)" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M62 118 v14" stroke="url(#silverDark)" strokeWidth="2.5" />
      <circle cx="62" cy="140" r="8" fill="url(#pearl)" />
      <path d="M100 132 v14" stroke="url(#silverDark)" strokeWidth="2.5" />
      <circle cx="100" cy="156" r="10" fill="url(#gem)" />
      <path d="M138 118 v14" stroke="url(#silverDark)" strokeWidth="2.5" />
      <path d="M147 140 a11 11 0 1 0 2 13 a8.5 8.5 0 0 1 -2 -13 Z" fill="url(#silver)" />
    </>
  ),
  anklet: (
    <>
      <path d="M22 84 q78 62 156 0" fill="none" stroke="url(#silver)" strokeWidth="6" strokeLinecap="round" />
      <path d="M22 98 q78 62 156 0" fill="none" stroke="url(#silverDark)" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 8" />
      <g stroke="url(#silverDark)" strokeWidth="2.5">
        <path d="M48 110 v10" /><path d="M74 122 v10" /><path d="M100 127 v10" /><path d="M126 122 v10" /><path d="M152 110 v10" />
      </g>
      <g fill="url(#pearl)">
        <circle cx="48" cy="127" r="6" /><circle cx="74" cy="139" r="6" /><circle cx="126" cy="139" r="6" /><circle cx="152" cy="127" r="6" />
      </g>
      <circle cx="100" cy="145" r="7.5" fill="url(#gem)" />
    </>
  ),
  tikka: (
    <>
      <circle cx="100" cy="20" r="7" fill="url(#silver)" />
      <path d="M100 27 v58" stroke="url(#silverDark)" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 7" />
      <path d="M100 27 q-42 30 -52 74" fill="none" stroke="url(#silverDark)" strokeWidth="2.5" strokeDasharray="1 7" />
      <path d="M100 27 q42 30 52 74" fill="none" stroke="url(#silverDark)" strokeWidth="2.5" strokeDasharray="1 7" />
      <circle cx="100" cy="92" r="8" fill="url(#silver)" />
      <path d="M100 102 c-26 12 -30 48 -7 62 c23 14 46 -7 37 -32 c-7 -19 -21 -26 -30 -30 Z" fill="url(#silver)" />
      <circle cx="100" cy="140" r="11" fill="url(#gem)" />
      <g fill="url(#pearl)">
        <circle cx="72" cy="182" r="6" /><circle cx="100" cy="192" r="7" /><circle cx="128" cy="182" r="6" />
      </g>
      <g stroke="url(#silverDark)" strokeWidth="2.5">
        <path d="M72 168 v8" /><path d="M100 172 v12" /><path d="M128 168 v8" />
      </g>
    </>
  ),
  heroJhumka: (
    <>
      <path d="M100 18 q-16 -14 -30 0 q-12 14 4 26 l20 14" fill="none" stroke="url(#silverDark)" strokeWidth="7" strokeLinecap="round" />
      <circle cx="100" cy="62" r="13" fill="url(#silver)" />
      <circle cx="100" cy="62" r="5" fill="url(#gem)" />
      <path d="M100 75 v18" stroke="url(#silverDark)" strokeWidth="5" strokeLinecap="round" />
      <path d="M48 150 a52 55 0 0 1 104 0 q0 12 -12 12 h-80 q-12 0 -12 -12 Z" fill="url(#silver)" />
      <path d="M60 150 a40 43 0 0 1 80 0" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="3" />
      <circle cx="100" cy="122" r="7" fill="url(#gem)" />
      <g fill="url(#pearl)">
        <circle cx="56" cy="176" r="8" /><circle cx="78" cy="182" r="8" /><circle cx="100" cy="185" r="8" /><circle cx="122" cy="182" r="8" /><circle cx="144" cy="176" r="8" />
      </g>
      <g stroke="url(#silverDark)" strokeWidth="3">
        <path d="M56 162 v6" /><path d="M78 166 v8" /><path d="M100 168 v9" /><path d="M122 166 v8" /><path d="M144 162 v6" />
      </g>
      <g fill="url(#pearl)">
        <circle cx="78" cy="208" r="6" /><circle cx="100" cy="216" r="7" /><circle cx="122" cy="208" r="6" />
      </g>
      <g stroke="url(#silverDark)" strokeWidth="2.5">
        <path d="M78 190 v11" /><path d="M100 193 v15" /><path d="M122 190 v11" />
      </g>
    </>
  ),
  earringsPair: (
    <>
      <g>
        <path d="M64 22 q-12 -12 -22 0 q-9 12 3 21 l14 10" fill="none" stroke="url(#silverDark)" strokeWidth="6" strokeLinecap="round" />
        <circle cx="64" cy="60" r="10" fill="url(#silver)" />
        <path d="M64 70 v14" stroke="url(#silverDark)" strokeWidth="4" strokeLinecap="round" />
        <path d="M64 84 c-26 8 -30 44 -8 58 c22 14 44 -6 36 -30 c-6 -18 -20 -26 -28 -28 Z" fill="url(#silver)" />
        <circle cx="64" cy="118" r="8" fill="url(#gem)" />
        <circle cx="64" cy="158" r="7" fill="url(#pearl)" />
        <path d="M64 142 v9" stroke="url(#silverDark)" strokeWidth="3" />
      </g>
      <g>
        <path d="M148 22 q-12 -12 -22 0 q-9 12 3 21 l14 10" fill="none" stroke="url(#silverDark)" strokeWidth="6" strokeLinecap="round" />
        <circle cx="148" cy="60" r="10" fill="url(#silver)" />
        <path d="M148 70 v14" stroke="url(#silverDark)" strokeWidth="4" strokeLinecap="round" />
        <path d="M148 84 c-26 8 -30 44 -8 58 c22 14 44 -6 36 -30 c-6 -18 -20 -26 -28 -28 Z" fill="url(#silver)" />
        <circle cx="148" cy="118" r="8" fill="url(#gem)" />
        <circle cx="148" cy="158" r="7" fill="url(#pearl)" />
        <path d="M148 142 v9" stroke="url(#silverDark)" strokeWidth="3" />
      </g>
    </>
  ),
  necklaceCat: (
    <>
      <path d="M30 30 q70 95 140 0" fill="none" stroke="url(#silverDark)" strokeWidth="6" strokeLinecap="round" />
      <g fill="url(#pearl)">
        <circle cx="52" cy="58" r="6" /><circle cx="76" cy="76" r="6" /><circle cx="124" cy="76" r="6" /><circle cx="148" cy="58" r="6" />
      </g>
      <path d="M100 84 v22" stroke="url(#silverDark)" strokeWidth="5" strokeLinecap="round" />
      <circle cx="100" cy="112" r="9" fill="url(#silver)" />
      <path d="M100 124 c-30 14 -34 54 -8 70 c26 16 52 -8 42 -36 c-8 -22 -24 -30 -34 -34 Z" fill="url(#silver)" />
      <circle cx="100" cy="166" r="11" fill="url(#gem)" />
      <path d="M84 150 a24 24 0 0 1 20 -16" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
};

export default function JewelArt({ art, className }) {
  return (
    <svg viewBox="0 0 200 240" className={className} aria-hidden="true">
      {ART[art] || ART.pendant}
    </svg>
  );
}
