# Verid Backend — Implementation Units

**Last revised:** 20 July 2026

All backend units are complete.

---

## Completed

- [x] B1.1 — Express scaffold + shared types
- [x] B1.2 — Scoring module + 5 tests-*+++
- [x] B1.3 — Supabase logging
- [x] B2.0 — Vision capacity check
- [x] B2.1a — Single Groq call (qwen/qwen3.6-27b)
- [x] B2.2 — Prompts + Zod validation
- [x] B2.3 — Computed signals
- [x] B3.1 — Route wired
- [x] B3.2 — Explanation builder
- [x] Brevo email verification
- [x] B4.1 — Updated shared types + request schema (sellerHasStorePage, sellerListingCount)
- [x] B4.2 — Updated weights + scoring (no_seller_store, single_listing_seller)
- [x] B4.3 — Updated assemble-signals.ts

---

## Remaining

- [ ] **B4.4: Deploy**
  - Railway or Render. Set env vars. CORS `ALLOWED_ORIGINS` includes `chrome-extension://`.
  - Update `API_URL` in `extension/src/content/index.ts` to deployed URL.
  - Rebuild extension after URL update.
  - **Verify:** extension on a real Jumia listing reaches the deployed backend. Verdict renders.
