export interface AnalyzeRequest {
  title: string;
  price: number;
  categoryMedianPrice: number;
  description: string;
  sellerAccountAgeDays: number;
  sellerRating: number | null;
  sellerReviewCount: number;
  sellerVerified: boolean;
  images: string[];
  reviews: {
    body: string;
    rating: number;
    postedAt: string;
  }[];
}

export interface SignalInput {
  // Layer 1 — Account (computed from request)
  sellerAccountAgeDays: number;
  sellerReviewCount: number;

  // Layer 2 — Listing (AI + computed)
  offplatform_contact: boolean;
  image_synthetic_probability: number;
  price: number;
  categoryMedianPrice: number;
  urgency_score: number;
  description_specificity: number;

  // Layer 3 — Reviews (AI + computed)
  review_template_similarity: number;
  review_product_mismatch: boolean;
  reviews: { postedAt: string }[];
}

export interface Signal {
  label: string;
  weight: number;
}

export interface Verdict {
  score: number;
  band: 'clear' | 'caution' | 'block';
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
  signals: Signal[];
}

export type AnalyzeResponse = Verdict;

export const DEGRADED_RESPONSE: AnalyzeResponse = {
  score: 0,
  band: 'clear',
  confidence: 'low',
  explanation: 'Analysis unavailable.',
  signals: [],
};
