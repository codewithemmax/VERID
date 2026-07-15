/** Format an integer NGN amount as ₦-prefixed, thousands-separated. */
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

/** Human-readable account age, e.g. "3 days" / "1 year, 5 months". */
export function formatAccountAge(days: number): string {
  if (days < 1) return "today";
  if (days < 30) return `${days} day${days === 1 ? "" : "s"}`;
  if (days < 365) {
    const months = Math.round(days / 30);
    return `${months} month${months === 1 ? "" : "s"}`;
  }
  const years = Math.floor(days / 365);
  const months = Math.round((days - years * 365) / 30);
  const y = `${years} year${years === 1 ? "" : "s"}`;
  return months > 0 ? `${y}, ${months} month${months === 1 ? "" : "s"}` : y;
}

/** Percent a price sits below the category median, rounded. 0 if not below. */
export function percentBelowMedian(price: number, median: number): number {
  if (median <= 0) return 0;
  const ratio = (price - median) / median;
  return ratio < 0 ? Math.round(-ratio * 100) : 0;
}

/** Short date like "10 Jan 2026". */
export function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
