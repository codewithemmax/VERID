export const WEIGHTS = {
  // Layer 1 — Account
  new_account: 15,
  no_history: 8,

  // Layer 2 — Listing
  offplatform_contact: 30,
  image_synthetic: 20,
  price_anomaly: 18,
  urgency_language: 12,
  vague_description: 10,

  // Layer 3 — Reviews
  review_templating: 15,
  review_mismatch: 12,
  review_burst: 10,
} as const;

export const THRESHOLDS = {
  new_account_days: 14,
  no_history_days: 30,
  price_anomaly_ratio: -0.35,
  urgency_score: 0.7,
  description_specificity: 0.3,
  image_synthetic_probability: 0.7,
  review_template_similarity: 0.7,
  review_burst_window_hours: 48,
  review_burst_ratio: 0.5,
  band_caution: 31,
  band_block: 86,
  confidence_high: 8,
  confidence_medium: 5,
  low_confidence_score_cap: 60,
} as const;

export const MULTIPLIERS = {
  one_layer: 0.80,
  two_layers: 1.00,
  three_layers: 1.25,
} as const;
