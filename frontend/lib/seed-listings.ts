// Relative import (not the "@/" alias) so this file also resolves when the seed
// script runs it under tsx, which does not read tsconfig path aliases.
import type { Listing, ListingReview, Band } from "./types";

/**
 * F1.2 — Seed listings.
 *
 * Three listings reverse-engineered from the worked cases in architecture.md so
 * that each lands in a distinct band. The band math is hand-computed in the
 * comment above each listing, against backend/src/scoring/weights.ts:
 *
 *   Layer 1 (Account):  new_account 15 (age<14) · no_history 8 (reviews==0 && age<30)
 *   Layer 2 (Listing):  offplatform_contact 30 · image_synthetic 20 (>0.7)
 *                       price_anomaly 18 ((price-median)/median < -0.35)
 *                       urgency_language 12 (>0.7) · vague_description 10 (spec<0.3)
 *   Layer 3 (Reviews):  review_templating 15 (>0.7) · review_mismatch 12
 *                       review_burst 10 (>50% within any 48h window)
 *   Multiplier: 1 layer ×0.80 · 2 layers ×1.00 · 3 layers ×1.25
 *   score = min(100, round(rawSum × multiplier))
 *   Bands: clear 0–30 · caution 31–85 · block 86–100
 *
 * The AI-derived signals (offplatform, image_synthetic, urgency, vague,
 * templating, mismatch) are noted as "AI will flag" — the text/images are
 * written so the live model produces them. price_anomaly, new_account,
 * no_history and review_burst are deterministic and guaranteed by these seeds.
 */

/** Display-only review. `author` is stripped before anything reaches the
 *  AnalyzeRequest payload — it is PII and is absent from the API contract. */
export type SeedReview = ListingReview;

/** A seed is just a Listing with two extra fields used by the seed script and
 *  for documentation. Both the DB rows and these seeds satisfy `Listing`. */
export interface SeedListing extends Listing {
  slug: string;
  /** Reference only — the real band comes from the backend at runtime. */
  expectedBand: Band;
}

/* ------------------------------------------------------------------ *
 * 1. CLEAN — target 0–30
 *
 *   Aged verified seller, fair price, specific copy, genuine spread reviews.
 *   Layer 1: 0  (age 512 > 14/30)
 *   Layer 2: 0  (price -6.7% > -35% · specific · real photos · no urgency)
 *   Layer 3: 0  (genuine, varied, spread over 6 months)
 *   rawSum 0 · 0 layers ×0.80 → 0 → CLEAR ✓
 * ------------------------------------------------------------------ */
const cleanListing: SeedListing = {
  id: "aso-oke-throw",
  slug: "handwoven-aso-oke-throw",
  title: "Handwoven Aso-Oke Throw Blanket — Indigo & Gold",
  subtitle: "Loom-woven in Iseyin · 180 × 130cm · pure cotton",
  category: "Home & Textiles",
  condition: "New — handmade to order",
  location: "Ibadan, Oyo",
  sellerName: "Nkechi Heritage Textiles",
  price: 42000,
  categoryMedianPrice: 45000,
  description:
    "A full-size Aso-Oke throw handwoven on a traditional narrow-strip loom in " +
    "Iseyin, Oyo State. Measures 180 × 130cm and is pieced from eight woven " +
    "strips in indigo and gold cotton with a hand-knotted fringe. Pre-washed and " +
    "colourfast; ships flat-folded with care instructions. Each piece takes about " +
    "nine days on the loom, so slight variation between throws is expected and part " +
    "of the craft. Returns accepted within 14 days through Kora Market checkout.",
  sellerAccountAgeDays: 512,
  sellerRating: 4.9,
  sellerReviewCount: 168,
  sellerVerified: true,
  images: [
    "https://picsum.photos/seed/asooke-throw-1/1000/1000",
    "https://picsum.photos/seed/asooke-throw-2/1000/1000",
    "https://picsum.photos/seed/asooke-throw-3/1000/1000",
  ],
  reviews: [
    {
      author: "Adaeze O.",
      body:
        "The indigo is so much richer in person. It's heavier than I expected in a " +
        "good way and the fringe is beautifully knotted. Arrived flat and pressed.",
      rating: 5,
      postedAt: "2026-01-10T14:20:00Z",
    },
    {
      author: "Tunde A.",
      body:
        "Bought this as a wedding gift. The weave is tight and even. Communication " +
        "from Nkechi was patient — she sent extra photos before I ordered.",
      rating: 5,
      postedAt: "2026-02-22T09:05:00Z",
    },
    {
      author: "Ifeoma N.",
      body:
        "Colour matched the listing photos well. Docked a star only because delivery " +
        "took a little longer than the estimate, but the throw itself is lovely.",
      rating: 4,
      postedAt: "2026-03-30T18:47:00Z",
    },
    {
      author: "Segun B.",
      body:
        "Second one I've ordered. Holds up well to washing — no fading after a few " +
        "months of use on the sofa.",
      rating: 5,
      postedAt: "2026-05-11T11:32:00Z",
    },
    {
      author: "Chidinma E.",
      body:
        "Genuinely handmade, you can feel it. The narrow-strip seams are neat. Would " +
        "buy from this seller again.",
      rating: 5,
      postedAt: "2026-06-28T16:10:00Z",
    },
  ],
  expectedBand: "clear",
};

/* ------------------------------------------------------------------ *
 * 2. CAUTION — target 31–85  (reproduces the ui-context.md worked example)
 *
 *   New-ish reseller, priced ~42% under market, thin/vague copy.
 *   Layer 1: new_account 15         (age 3 < 14)   [no_history NOT fired: 2 reviews]
 *   Layer 2: price_anomaly 18       ((70k-120k)/120k = -41.7% < -35%)
 *          + vague_description 10   (AI will flag: short, generic copy)  = 28
 *   Layer 3: 0                       (2 genuine, un-templated reviews, no burst)
 *   rawSum 43 · 2 layers ×1.00 → 43 → CAUTION ✓
 *   Signals shown (weight desc): price_anomaly · new_account · vague_description
 *   → "Price is 42% below market" · "Seller account is 3 days old" · "Vague description"
 * ------------------------------------------------------------------ */
const cautionListing: SeedListing = {
  id: "teak-lounge-chair",
  slug: "midcentury-teak-lounge-chair",
  title: "Mid-Century Teak Lounge Chair",
  subtitle: "Vintage · solid teak frame · reupholstered seat",
  category: "Furniture",
  condition: "Used — good",
  location: "Lekki, Lagos",
  sellerName: "urban_finds_ng",
  price: 70000,
  categoryMedianPrice: 120000,
  description:
    "Vintage teak lounge chair. Solid frame, comfortable, nice condition. Selling " +
    "cheap because I am relocating and everything must go this week. Pickup or " +
    "delivery can be arranged.",
  sellerAccountAgeDays: 3,
  sellerRating: 5.0,
  sellerReviewCount: 2,
  sellerVerified: false,
  images: [
    "https://picsum.photos/seed/teak-chair-1/1000/1000",
    "https://picsum.photos/seed/teak-chair-2/1000/1000",
  ],
  reviews: [
    {
      author: "Kelechi M.",
      body:
        "Chair is decent for the price. Seat was recently redone. Seller was quick " +
        "to reply and delivery within Lekki was fine.",
      rating: 4,
      postedAt: "2026-07-10T13:15:00Z",
    },
    {
      author: "Bisi F.",
      body:
        "Solid little chair, a couple of scuffs on one leg as expected for vintage. " +
        "Fair deal overall.",
      rating: 4,
      postedAt: "2026-07-13T10:40:00Z",
    },
  ],
  expectedBand: "caution",
};

/* ------------------------------------------------------------------ *
 * 3. BLOCK — target 86–100  (full scam: all three layers fire)
 *
 *   Layer 1: new_account 15          (age 2 < 14)  [no_history NOT fired: 5 reviews]
 *   Layer 2: offplatform_contact 30  (AI: explicit WhatsApp number in copy)
 *          + urgency_language 12     (AI: "pay now / limited stock")
 *          + image_synthetic 20      (AI: stock/synthetic photos)
 *          + price_anomaly 18        ((420k-1.15m)/1.15m = -63.5% < -35%)   = 80
 *   Layer 3: review_templating 15    (AI: identical sentence skeletons)
 *          + review_mismatch 12      (AI: reviews mention a smartwatch, not a phone)
 *          + review_burst 10         (all 5 posted inside a 48h window)      = 37
 *   rawSum 132 · 3 layers ×1.25 = 165 → min(100,165) = 100 → BLOCK ✓
 *   (Even if the vision model misses image_synthetic, 3 layers still fire.)
 * ------------------------------------------------------------------ */
const blockListing: SeedListing = {
  id: "iphone-15-pro-max",
  slug: "apple-iphone-15-pro-max-256gb",
  title: "Apple iPhone 15 Pro Max 256GB — Sealed",
  subtitle: "Brand new · factory sealed · all colours available",
  category: "Phones & Tablets",
  condition: "New — sealed",
  location: "Computer Village, Lagos",
  sellerName: "deals_plug_official",
  price: 420000,
  categoryMedianPrice: 1150000,
  description:
    "iPhone 15 Pro Max 256GB brand new sealed in box. Original with full warranty. " +
    "PRICE IS FINAL and stock is very limited — only 2 left, first to pay keeps it!! " +
    "Don't buy here, message me directly on WhatsApp 0803 555 0142 for faster " +
    "response and better price. Pay now to reserve, delivery same day nationwide.",
  sellerAccountAgeDays: 2,
  sellerRating: 5.0,
  sellerReviewCount: 5,
  sellerVerified: false,
  images: [
    "https://picsum.photos/seed/iphone-stock-1/1000/1000",
    "https://picsum.photos/seed/iphone-stock-2/1000/1000",
    "https://picsum.photos/seed/iphone-stock-3/1000/1000",
  ],
  reviews: [
    {
      author: "James O.",
      body: "Fast delivery, genuine product, highly recommend this seller!!! 100% legit.",
      rating: 5,
      postedAt: "2026-07-13T08:12:00Z",
    },
    {
      author: "Grace A.",
      body: "Fast delivery, genuine product, highly recommend this seller!!! Very legit.",
      rating: 5,
      postedAt: "2026-07-13T15:47:00Z",
    },
    {
      author: "Michael E.",
      body:
        "Fast delivery, original item, highly recommend this seller!!! The smartwatch " +
        "works perfectly and battery is great.",
      rating: 5,
      postedAt: "2026-07-14T06:30:00Z",
    },
    {
      author: "Blessing U.",
      body: "Fast delivery, genuine product, highly recommend this seller!!! Trusted plug.",
      rating: 5,
      postedAt: "2026-07-14T13:05:00Z",
    },
    {
      author: "David N.",
      body:
        "Fast delivery, original item, highly recommend this seller!!! My smartwatch " +
        "arrived same day, thank you.",
      rating: 5,
      postedAt: "2026-07-14T19:58:00Z",
    },
  ],
  expectedBand: "block",
};

export const SEED_LISTINGS: SeedListing[] = [
  cleanListing,
  cautionListing,
  blockListing,
];

/**
 * Demo seller accounts that own the seed listings. `accountAgeDays` back-dates
 * the profile's created_at so the crafted account ages hold; rating/reviewCount/
 * verified are the reputation values the band math assumes. The seed script
 * (scripts/seed.ts) creates these auth users and profiles, then inserts each
 * listing above under the matching seller. `listingId` maps a seller to their
 * listing by the listing's `id`.
 */
export interface SeedSeller {
  email: string;
  password: string;
  displayName: string;
  accountAgeDays: number;
  rating: number | null;
  reviewCount: number;
  verified: boolean;
  listingId: string;
}

export const SEED_SELLERS: SeedSeller[] = [
  {
    email: "nkechi.textiles@kora.demo",
    password: "kora-demo-clean-01",
    displayName: cleanListing.sellerName,
    accountAgeDays: cleanListing.sellerAccountAgeDays,
    rating: cleanListing.sellerRating,
    reviewCount: cleanListing.sellerReviewCount,
    verified: cleanListing.sellerVerified,
    listingId: cleanListing.id,
  },
  {
    email: "urban.finds@kora.demo",
    password: "kora-demo-caution-01",
    displayName: cautionListing.sellerName,
    accountAgeDays: cautionListing.sellerAccountAgeDays,
    rating: cautionListing.sellerRating,
    reviewCount: cautionListing.sellerReviewCount,
    verified: cautionListing.sellerVerified,
    listingId: cautionListing.id,
  },
  {
    email: "deals.plug@kora.demo",
    password: "kora-demo-block-01",
    displayName: blockListing.sellerName,
    accountAgeDays: blockListing.sellerAccountAgeDays,
    rating: blockListing.sellerRating,
    reviewCount: blockListing.sellerReviewCount,
    verified: blockListing.sellerVerified,
    listingId: blockListing.id,
  },
];
