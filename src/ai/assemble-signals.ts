// Assembles a complete SignalInput from:
//   - model-derived signals (from groq-client)
//   - computed arithmetic signals (from computed-signals)
//   - account-layer fields (from the raw request)
//
// On model failure (signals === null), falls back to neutral values so the
// scoring module still runs and produces a low-confidence result rather than
// crashing the route.

import type { AnalyzeRequest, SignalInput } from '../../../shared/types';
import type { ModelSignals } from './schema';
import { computePriceDeviationRatio, computeReviewBurstRatio } from './computed-signals';

export function assembleSignals(
  req: AnalyzeRequest,
  modelSignals: ModelSignals | null
): SignalInput {
  const priceRatio = computePriceDeviationRatio(req);

  return {
    // Layer 1 — Account (from request, no AI)
    sellerAccountAgeDays: req.sellerAccountAgeDays,
    sellerReviewCount: req.sellerReviewCount,

    // Layer 2 — Listing (AI + computed)
    offplatform_contact: modelSignals?.offplatform_contact ?? false,
    image_synthetic_probability: modelSignals?.image_synthetic_probability ?? 0,
    price: req.price,
    categoryMedianPrice: req.categoryMedianPrice,
    urgency_score: modelSignals?.urgency_score ?? 0,
    description_specificity: modelSignals?.description_specificity ?? 1,

    // Layer 3 — Reviews (AI + computed)
    review_template_similarity: modelSignals?.review_template_similarity ?? 0,
    review_product_mismatch: modelSignals?.review_product_mismatch ?? false,
    reviews: req.reviews.map((r) => ({ postedAt: r.postedAt })),
  };
}
