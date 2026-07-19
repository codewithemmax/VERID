# Verid Backend — Implementation Units

**Last revised:** 19 July 2026

All Phase 1–3 units are complete. The backend is stable. The only changes needed are to support the extension pivot: updated signals, relaxed request validation, and updated scoring.

---

## Completed (unchanged)

- [x] B1.1 — Express scaffold + shared types
- [x] B1.2 — Scoring module + 5 tests
- [x] B1.3 — Supabase logging
- [x] B2.0 — Vision capacity check
- [x] B2.1a — Single Groq call (qwen/qwen3.6-27b)
- [x] B2.2 — Prompts + Zod validation
- [x] B2.3 — Computed signals
- [x] B3.1 — Route wired
- [x] B3.2 — Explanation builder
- [x] Brevo email verification

---

## Phase 4 — Extension support changes

- [ ] **Unit B4.1: Update shared types + request schema**
  - `shared/types.ts` — add `sellerHasStorePage: boolean` and `sellerListingCount: number` to `AnalyzeRequest`.
  - Add `no_seller_store` and `single_listing_seller` to `SignalInput`.
  - `backend/src/routes/analyze.ts` — update `AnalyzeRequestSchema`:
    - `categoryMedianPrice` → `z.number().default(0)` (optional, defaults to 0)
    - `sellerAccountAgeDays` → `z.number().int().default(0)`
    - `sellerHasStorePage` → `z.boolean().default(true)`
    - `sellerListingCount` → `z.number().int().default(0)`
    - `reviews[].postedAt` → `z.string().default('')` (timestamps not always available)
  - **Verify:** a payload with only `title`, `price`, `description`, `images` passes validation. Missing fields use safe defaults.

- [ ] **Unit B4.2: Update weights + scoring**
  - `backend/src/scoring/weights.ts` — replace `new_account` (15) and `price_anomaly` (18) with `no_seller_store` (15) and `single_listing_seller` (12).
  - `backend/src/scoring/score-listing.ts` — replace Layer 1 logic:
    - `no_seller_store`: fires when `!signals.sellerHasStorePage`
    - `single_listing_seller`: fires when `signals.sellerListingCount <= 1`
    - `no_history`: fires when `signals.sellerReviewCount === 0`
    - Remove `new_account` and `price_anomaly` checks entirely.
  - Update confidence calculation: `resolvable` threshold adjusted to 7/4 (was 8/5) since we have fewer guaranteed-present fields on real marketplace pages.
  - **Verify:** update the scoring tests in `scoring.test.ts` to reflect the new signal set. All tests pass.

- [ ] **Unit B4.3: Update assemble-signals**
  - `backend/src/ai/assemble-signals.ts` — add `sellerHasStorePage` and `sellerListingCount` from request into `SignalInput`. Remove `categoryMedianPrice` price ratio computation (signal is gone).
  - **Verify:** a request from the extension (with real Jumia data) assembles a valid `SignalInput` without errors.

- [ ] **Unit B4.4: Deploy**
  - Render or Railway. Env vars set. CORS `ALLOWED_ORIGINS` includes the extension origin (`chrome-extension://*` or the specific extension ID).
  - **Verify:** extension on a real device reaches the deployed backend. Verdict returns.

---

## CORS note for extension

Chrome extensions make requests from `chrome-extension://[extension-id]`. Add this to `ALLOWED_ORIGINS` in the backend, or use a wildcard check:

```ts
// In server.ts CORS middleware — allow extension origins
const origin = req.headers.origin ?? '';
if (ALLOWED_ORIGINS.includes(origin) || origin.startsWith('chrome-extension://')) {
  res.setHeader('Access-Control-Allow-Origin', origin);
}
```

---

## Cut list

1. `single_listing_seller` → if seller listing count is unreliable on Jumia, drop the signal and accept a slightly lower max score.
2. Deploy → demo on localhost with ngrok tunnel if Railway setup takes too long.

**Never cut:** B4.1 and B4.2. The contract and scoring are the product.
