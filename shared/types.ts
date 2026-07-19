export interface AnalyzeRequest {
  title: string;
  price: number;
  categoryMedianPrice: number;   // pass 0 when unavailable
  description: string;
  sellerAccountAgeDays: number;  // pass 0 when unavailable
  sellerRating: number | null;
  sellerReviewCount: number;
  sellerVerified: boolean;
  sellerHasStorePage: boolean;   // false = no_seller_store fires
  sellerListingCount: number;    // <=1 = single_listing_seller fires
  images: string[];
  reviews: {
    body: string;
    rating: number;
    postedAt: string;            // ISO 8601 — empty string when unavailable
  }[];
}

export interface SignalInput {
  // Layer 1 — Seller (from DOM, no AI)
  sellerReviewCount: number;
  sellerHasStorePage: boolean;
  sellerListingCount: number;

  // Layer 2 — Listing (AI-derived)
  offplatform_contact: boolean;
  image_synthetic_probability: number;
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
