// Precise star rating — fills to the exact fraction (e.g. 4.8 → 96%) rather
// than rounding to whole stars. Two stacked layers: a muted base and a gold
// fill clipped to `value/5`. Pass `className="lg"` for the larger summary size.
export default function Stars({ value = 0, className = '' }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span className={`star-rating ${className}`} aria-label={`${value} out of 5 stars`}>
      <span className="star-rating-base" aria-hidden="true">★★★★★</span>
      <span className="star-rating-fill" style={{ width: `${pct}%` }} aria-hidden="true">★★★★★</span>
    </span>
  );
}
