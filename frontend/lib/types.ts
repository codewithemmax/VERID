/**
 * The display shape every marketplace component consumes. Both the crafted
 * seeds and the DB rows map to this, so components never care about the source.
 * It is a superset of the fields needed to build an AnalyzeRequest (F2.1).
 */
export interface ListingReview {
  author: string; // display only — stripped before it reaches AnalyzeRequest
  body: string;
  rating: number;
  postedAt: string; // ISO 8601
}

export type Band = "clear" | "caution" | "block";

export interface Listing {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  condition: string;
  location: string;
  sellerName: string;
  price: number;
  categoryMedianPrice: number;
  description: string;
  sellerAccountAgeDays: number;
  sellerRating: number | null;
  sellerReviewCount: number;
  sellerVerified: boolean;
  images: string[];
  reviews: ListingReview[];
}
