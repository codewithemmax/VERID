export interface AnalyzeRequest {
  title: string;
  price: number;
  categoryMedianPrice: number;
  description: string;
  sellerAccountAgeDays: number;
  sellerRating: number | null;
  sellerReviewCount: number;
  sellerVerified: boolean;
  sellerHasStorePage: boolean;
  sellerListingCount: number;
  images: string[];
  reviews: { body: string; rating: number; postedAt: string }[];
}

export interface Signal {
  label: string;
  weight: number;
}

export interface AnalyzeResponse {
  score: number;
  band: 'clear' | 'caution' | 'block';
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
  signals: Signal[];
}

export const DEGRADED_RESPONSE: AnalyzeResponse = {
  score: 0,
  band: 'clear',
  confidence: 'low',
  explanation: 'Analysis unavailable.',
  signals: [],
};
