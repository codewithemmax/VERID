export const WEIGHTS = {
  // Layer 1 — Seller (DOM-readable, no AI)
  no_seller_store:       15,
  single_listing_seller: 12,
  no_history:             8,

  // Layer 2 — Listing (AI-derived)
  offplatform_contact: 30,
  image_synthetic:     20,
  urgency_language:    12,
  vague_description:   10,

  // Layer 3 — Reviews (AI + computed)
  review_templating: 15,
  review_mismatch:   12,
  review_burst:      10,
} as const;

export const THRESHOLDS = {
  urgency_score:                  0.7,
  description_specificity:        0.3,
  image_synthetic_probability:    0.7,
  review_template_similarity:     0.7,
  review_burst_window_hours:      48,
  review_burst_ratio:             0.5,
  band_caution:                   31,
  band_block:                     86,
  confidence_high:                 7,  // lowered from 8 — fewer guaranteed fields on real pages
  confidence_medium:               4,  // lowered from 5
  low_confidence_score_cap:       60,
} as const;

export const MULTIPLIERS = {
  one_layer:   0.80,
  two_layers:  1.00,
  three_layers: 1.25,
} as const;
