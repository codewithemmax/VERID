// Unit B2.3 — price_anomaly and review_burst are arithmetic.
// Do not ask the model to compute these.

import type { AnalyzeRequest } from '../../../shared/types';

export function computePriceDeviationRatio(req: AnalyzeRequest): number {
  if (!req.categoryMedianPrice) return 0;
  return (req.price - req.categoryMedianPrice) / req.categoryMedianPrice;
}

/**
 * Fraction of reviews falling inside the densest 48-hour window.
 * >0.5 means over half the reviews landed in a single 2-day burst.
 */
export function computeReviewBurstRatio(req: AnalyzeRequest): number {
  const times = req.reviews
    .map((r) => new Date(r.postedAt).getTime())
    .sort((a, b) => a - b);

  if (times.length === 0) return 0;

  const WINDOW_MS = 48 * 60 * 60 * 1000;
  let maxInWindow = 1;

  for (let i = 0; i < times.length; i++) {
    let count = 1;
    for (let j = i + 1; j < times.length; j++) {
      if (times[j] - times[i] <= WINDOW_MS) count++;
      else break;
    }
    maxInWindow = Math.max(maxInWindow, count);
  }

  return maxInWindow / times.length;
}
