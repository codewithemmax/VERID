/**
 * The categories a seller can post under, and a rough market median (NGN) for
 * each. The median is the baseline for the `price_anomaly` signal. It is a
 * chosen constant, not a real price index — see the known limitation in
 * project-overview.md. If a category has no median here, the post flow falls
 * back to the listing's own price, so `price_anomaly` simply doesn't fire.
 */
export const CATEGORIES = [
  "Home & Textiles",
  "Furniture",
  "Phones & Tablets",
  "Electronics",
  "Fashion",
  "Beauty",
  "Art & Crafts",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_MEDIANS: Record<string, number> = {
  "Home & Textiles": 45000,
  Furniture: 120000,
  "Phones & Tablets": 1150000,
  Electronics: 350000,
  Fashion: 25000,
  Beauty: 15000,
  "Art & Crafts": 40000,
};

/** Median for a category, falling back to the listing's own price. */
export function medianForCategory(category: string, price: number): number {
  return CATEGORY_MEDIANS[category] ?? price;
}
