/**
 * Rating stars. Uses the marketplace ink color, never a status hue — a gold or
 * green star would collide with Verid's palette (see the color rule in
 * ui-context.md). Filled = magenta, empty = warm line.
 */
export function Stars({
  rating,
  size = 16,
}: {
  rating: number;
  size?: number;
}) {
  const rounded = Math.round(rating);
  return (
    <span
      className="inline-flex items-center gap-0.5 align-middle"
      aria-label={`${rating} out of 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={i < rounded ? "#E22C8B" : "none"}
          stroke={i < rounded ? "#E22C8B" : "#E7DAC9"}
          strokeWidth={1.6}
          aria-hidden="true"
        >
          <path d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 18.6 6 20.7l1.2-6.6L2.4 9.5l6.6-.9L12 2.5z" />
        </svg>
      ))}
    </span>
  );
}
