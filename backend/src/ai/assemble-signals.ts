import type { AnalyzeRequest, SignalInput } from '../../../shared/types';
import type { ModelSignals } from './schema';

export function assembleSignals(
  req: AnalyzeRequest,
  modelSignals: ModelSignals | null
): SignalInput {
  return {
    // Layer 1 — Seller (from request, no AI)
    sellerReviewCount:    req.sellerReviewCount,
    sellerHasStorePage:   req.sellerHasStorePage,
    sellerListingCount:   req.sellerListingCount,

    // Layer 2 — Listing (AI-derived)
    offplatform_contact:          modelSignals?.offplatform_contact          ?? false,
    image_synthetic_probability:  modelSignals?.image_synthetic_probability  ?? 0,
    urgency_score:                modelSignals?.urgency_score                ?? 0,
    description_specificity:      modelSignals?.description_specificity      ?? 1,

    // Layer 3 — Reviews (AI + computed)
    review_template_similarity: modelSignals?.review_template_similarity ?? 0,
    review_product_mismatch:    modelSignals?.review_product_mismatch    ?? false,
    reviews: req.reviews.map(r => ({ postedAt: r.postedAt })),
  };
}
