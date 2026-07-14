import JewelArt from './JewelArt';

// Animated loading indicator — a swinging silver jhumka with sparkles.
export default function Loader({ label = 'Polishing the silver…' }) {
  return (
    <div className="loader" role="status" aria-label={label}>
      <div className="loader-stage">
        <span className="loader-sparkle s1">✦</span>
        <span className="loader-sparkle s2">✦</span>
        <span className="loader-sparkle s3">✧</span>
        <span className="loader-sparkle s4">✧</span>
        <div className="loader-swing">
          <JewelArt art="jhumka" />
        </div>
      </div>
      <p>{label}</p>
    </div>
  );
}
