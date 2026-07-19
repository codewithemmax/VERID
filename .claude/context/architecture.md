# Verid — Architecture

**Last revised:** 19 July 2026

---

## Stack

| Layer | Technology | Role |
|---|---|---|
| Extension | Chrome MV3 (TypeScript) | Three-tier extraction + overlay injection on real marketplace pages |
| Backend | Node.js + Express + TypeScript | Single analyse route + email verification route |
| Email | Brevo Transactional Email API | 6-digit OTP verification on signup |
| AI | Groq (OpenAI-compatible API) | Text signal extraction + vision (qwen/qwen3.6-27b) |
| Scoring | In-process TypeScript module | Weighted heuristics. No Python, no external service. |
| Database | Supabase (Postgres) | Anonymised signal vectors only (risk_logs) |
| Fallback demo | Next.js 15 + Tailwind (frontend/) | Mock marketplace — retained for demo fallback only |

**No `/ml-service` directory. No Python. No `.pkl`. No `child_process.spawn`.**

---

## Extension architecture

```
extension/
├── manifest.json          — Chrome MV3, host_permissions for Jumia + Temu
├── src/
│   ├── content/
│   │   ├── index.ts       — entry point, fires on matching URLs
│   │   ├── extract.ts     — three-tier extraction (JSON-LD → DOM → screenshot)
│   │   └── overlay.ts     — injects badge/banner/blocker onto the page
│   ├── background/
│   │   └── service-worker.ts — handles captureVisibleTab(), message routing
│   ├── popup/
│   │   ├── popup.html
│   │   └── popup.ts       — last verdict display, on/off toggle
│   └── shared/
│       └── types.ts       — re-exports from shared/types.ts
├── styles/
│   └── overlay.css        — blue/white design tokens, injected with content script
└── tsconfig.json
```

---

## Three-tier extraction

Every field in `AnalyzeRequest` is attempted in tier order. The first tier that returns a value wins. Missing fields fall back to safe defaults (empty string, 0, null) — the confidence model handles thin data.

### Tier 1 — JSON-LD

```ts
const ld = document.querySelector('script[type="application/ld+json"]');
const data = JSON.parse(ld?.textContent ?? '{}');
// schema.org/Product gives: name, offers.price, description, image[], review[]
```

Jumia embeds `schema.org/Product`. This is the most stable source — it's machine-readable data the marketplace puts there for Google, not for scrapers, so it doesn't change with visual redesigns.

### Tier 2 — DOM selectors

Targeted selectors for fields JSON-LD missed. Every selector is wrapped in try/catch. A failed selector returns null — it does not throw.

Jumia-specific targets (verified against current DOM, subject to change):
- Title: `h1[class*="name"]` or `[data-qa="pdp-product-name"]`
- Price: `[data-qa="pdp-price"]` or `span[class*="price"]`
- Description: `[data-qa="pdp-description"]` or `div[class*="description"]`
- Seller name: `[data-qa="pdp-seller-name"]` or `a[class*="seller"]`
- Seller store link: presence of `a[href*="/shop/"]` — absence = `no_seller_store` signal
- Seller listing count: text near seller name matching `/\d+ products?/i`
- Reviews: `[data-qa="review-item"]` or `div[class*="review"]`
- Images: `img[class*="gallery"]` or `img[data-qa*="image"]`

### Tier 3 — Screenshot gap-fill

`chrome.tabs.captureVisibleTab()` fires from the background service worker when tiers 1+2 leave fields empty. The screenshot is:
- Cropped to the listing content area (top 80% of viewport, avoids nav/footer)
- Sent as a base64 data URL in the `images` array alongside any product image URLs
- Processed by the vision model for `image_synthetic_probability` and any text fields still missing

Screenshot is also always sent for image analysis regardless of whether tiers 1+2 succeeded — the vision model seeing the actual rendered page is more reliable than sending product image URLs alone.

---

## Signal changes for real marketplaces

Two signals removed (data unavailable on real marketplace pages), two added:

### Removed
- `new_account` — seller account age not shown on Jumia/Temu listing pages
- `price_anomaly` — requires a category median price baseline we don't own

### Added
- `no_seller_store` (15pts, Layer 1) — no linked seller store/profile page found in DOM. Real Jumia sellers have a `/shop/` link; scam listings often don't.
- `single_listing_seller` (12pts, Layer 1) — seller has only one listing. Extracted from seller profile text or inferred from absence of a store link with product count.

### Surviving signals (all AI-derived — unaffected by marketplace DOM)
- `offplatform_contact` (30pts, Layer 2)
- `image_synthetic` (20pts, Layer 2)
- `urgency_language` (12pts, Layer 2)
- `vague_description` (10pts, Layer 2)
- `review_templating` (15pts, Layer 3)
- `review_mismatch` (12pts, Layer 3)
- `review_burst` (10pts, Layer 3) — only fires if review timestamps are available

---

## API contract — `POST /api/analyze`

**Unchanged from the previous version**, with two relaxations for real-marketplace use:

### Request

```ts
{
  title: string;
  price: number;
  categoryMedianPrice: number;   // pass 0 when unavailable — price_anomaly won't fire
  description: string;
  sellerAccountAgeDays: number;  // pass 0 when unavailable
  sellerRating: number | null;
  sellerReviewCount: number;
  sellerVerified: boolean;
  images: string[];              // product image URLs + optional screenshot data URL
  reviews: {
    body: string;
    rating: number;
    postedAt: string;            // ISO 8601 — pass empty string when unavailable
  }[];
  // New fields for real-marketplace signals
  sellerHasStorePage: boolean;   // false = no_seller_store fires
  sellerListingCount: number;    // 1 = single_listing_seller fires
}
```

### Response (unchanged)

```ts
{
  score: number;
  band: "clear" | "caution" | "block";
  confidence: "high" | "medium" | "low";
  explanation: string;
  signals: { label: string; weight: number; }[];
}
```

### Degraded response (unchanged)

HTTP 200: `{ score: 0, band: "clear", confidence: "low", explanation: "Analysis unavailable.", signals: [] }`

---

## Scoring specification

### Signal layers (updated)

**Layer 1 — Seller** (from DOM, no AI)
| Signal | Condition | Points |
|---|---|---|
| `no_seller_store` | `sellerHasStorePage === false` | 15 |
| `single_listing_seller` | `sellerListingCount <= 1` | 12 |
| `no_history` | `sellerReviewCount === 0` | 8 |

**Layer 2 — Listing** (Groq + computed)
| Signal | Condition | Points |
|---|---|---|
| `offplatform_contact` | Model flags WhatsApp/phone/email in description | 30 |
| `image_synthetic` | Vision model `> 0.7` | 20 |
| `urgency_language` | Model urgency score `> 0.7` | 12 |
| `vague_description` | Model specificity `< 0.3` | 10 |

**Layer 3 — Reviews** (Groq + computed)
| Signal | Condition | Points |
|---|---|---|
| `review_templating` | Model template-similarity `> 0.7` | 15 |
| `review_mismatch` | Model flags wrong product in reviews | 12 |
| `review_burst` | `>50%` reviews within any 48h window | 10 |

Maximum raw sum: 144. Capped at 100 after multiplier.

### Cross-layer compounding (unchanged)

```
multiplier = layersFired === 3 ? 1.25 : layersFired === 2 ? 1.00 : 0.80
score = min(100, round(rawSum × multiplier))
```

### Confidence — updated for missing data

```
resolvable = count of signals where input data was present
           (sellerHasStorePage present → no_seller_store resolvable, etc.)
confidence = resolvable >= 7 ? "high" : resolvable >= 4 ? "medium" : "low"
if (confidence === "low") score = min(score, 60)
```

Fields that are unavailable on a real marketplace page (account age, timestamps) are marked absent — they don't count against confidence. Only fields that were present but suspicious count toward the score.

---

## Boundaries

- `extension/src/content/` — extraction and overlay. Never imports from `frontend/`.
- `extension/src/background/` — screenshot capture only. No scoring logic.
- `backend/src/scoring/` — pure functions. No I/O. No async.
- `backend/src/db/` — fire-and-forget anonymised logging. Never blocks the response.
- `frontend/` — mock marketplace, retained as fallback demo. No changes needed.

---

## Storage

### Verid analysis log — `risk_logs` (PII-free, unchanged)

```sql
create table risk_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  score int not null,
  band text not null,
  confidence text not null,
  signals jsonb not null,
  raw_signal_vector jsonb not null
);
```

No seller identity. No buyer identity. No listing URL. No review author. No IP.

### Marketplace tables — `profiles` + `listings`

Retained for the mock marketplace fallback. Unchanged.

---

## Latency budget

| Step | Budget |
|---|---|
| Three-tier extraction (content script) | ~100ms |
| Screenshot capture (background → content) | ~200ms |
| Network to backend | 200ms |
| AI call — Groq single path | ~800ms p50 / 4000ms hard timeout |
| Scoring (pure, in-process) | <5ms |
| **Total p50 target** | **~1.3s** |
