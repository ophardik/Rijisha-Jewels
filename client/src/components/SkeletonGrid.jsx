// Shimmering product-card placeholders shown while a grid loads,
// so the layout doesn't jump when the real products arrive.
export default function SkeletonGrid({ count = 8 }) {
  return (
    <div className="grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div className="product skeleton-card" key={i}>
          <div className="skeleton skeleton-media" />
          <div className="product-info">
            <div className="skeleton skeleton-line w-40" />
            <div className="skeleton skeleton-line w-75" />
            <div className="skeleton skeleton-line w-55" />
          </div>
        </div>
      ))}
    </div>
  );
}
