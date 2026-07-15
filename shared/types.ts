// shared/types.ts
// Imported by both frontend and backend. This IS the API contract —
// if it drifts, the compiler catches it instead of the demo catching it.

export interface ReviewInput {
  body: string;
  rating: number;     // 1-5
  postedAt: string;   // ISO 8601
}

export interface AnalyzeRequest {
  title: string;
  price: number;
  categoryMedianPrice: number;
  description: string;
  sellerAccountAgeDays: number;
  sellerRating: number | null;
  sellerReviewCount: number;
  sellerVerified: boolean;
  images: string[];        // absolute URLs, max 5 sent to the model
  reviews: ReviewInput[];  // author names deliberately absent — PII, stripped client-side
}

export type Band = "clear" | "caution" | "block";
export type Confidence = "high" | "medium" | "low";

export interface SignalDisplay {
  label: string;   // human-readable, e.g. "Seller account is 3 days old"
  weight: number;  // points this signal contributed
}

export interface AnalyzeResponse {
  score: number;              // 0-100
  band: Band;
  confidence: Confidence;
  explanation: string;        // one plain-language sentence
  signals: SignalDisplay[];   // fired signals only, weight-desc
}

// Raw numeric signals the scoring module consumes.
// groq-client.ts + computed-signals.ts assemble this; score-listing.ts scores it.
export interface SignalInput {
  // Layer 1 — account (computed, no AI)
  sellerAccountAgeDays: number;
  sellerReviewCount: number;

  // Layer 2 — listing (model + computed)
  urgencyScore: number;               // 0-1
  descriptionSpecificity: number;     // 0-1
  offplatformContact: boolean;
  imageSyntheticProbability: number;  // 0-1
  priceDeviationRatio: number;        // (price - median) / median, negative = cheaper

  // Layer 3 — reviews (model + computed)
  reviewTemplateSimilarity: number;   // 0-1
  reviewProductMismatch: boolean;
  reviewBurstRatio: number;           // fraction of reviews inside the densest 48h window

  // Meta — feeds the confidence calculation
  resolvableSignalCount: number;
}