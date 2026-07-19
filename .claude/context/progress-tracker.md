# Verid — Progress Tracker

**Last revised:** 20 July 2026

---

## Status

**Extension built and loaded. Backend signal updates complete. Next: deploy backend + load extension in Chrome.**

---

## Completed

- **B1.1** — Express scaffold + shared types
- **B1.2** — Scoring module + all 5 tests passing
- **B1.3** — Supabase logging (fire-and-forget, PII-free)
- **B2.0** — Vision capacity check (decision: single Groq call, MAX_IMAGES=3)
- **B2.1a** — Groq client (qwen/qwen3.6-27b, single call, 4000ms timeout)
- **B2.2** — Prompts + Zod validation
- **B2.3** — Computed signals (price deviation ratio, review burst ratio)
- **Assembler** — assemble-signals.ts merges model + computed + account fields
- **B3.1** — Route fully wired (validate → extract → assemble → score → explain → log → respond)
- **B3.2** — Explanation builder (template from fired signals, no second AI call)
- **Brevo email verification** — send-code + verify-code endpoints, two-step signup
- **CORS** — inline middleware, ALLOWED_ORIGINS env var, chrome-extension:// origins allowed
- **F1.1–F1.3** — Mock marketplace scaffold + seed data + vibrant UI
- **F1.4–F1.7** — Supabase wiring, DB-backed listings, auth, sell page
- **F2.1–F2.4** — Verid overlay (badge, banner, blocker, scanner)
- **F3.1–F3.2** — Live API wiring + band routing
- **Seed script** — three demo listings in DB (clear/caution/block)
- **B4.1** — Updated shared/types.ts + AnalyzeRequestSchema (sellerHasStorePage, sellerListingCount)
- **B4.2** — Updated weights.ts + score-listing.ts (no_seller_store, single_listing_seller)
- **B4.3** — Updated assemble-signals.ts
- **E1.1** — Manifest + project setup (Chrome MV3, Jumia + Temu host_permissions)
- **E1.2** — Shared types bridge (extension/src/shared/types.ts)
- **E2.1** — JSON-LD extraction tier
- **E2.2** — DOM selector tier (sellerHasStorePage, sellerListingCount)
- **E2.3** — Screenshot tier + mergeExtraction()
- **E3.1** — Overlay scaffold + scanning state (pill, pulse animation)
- **E3.2** — Clear + Unknown states
- **E3.3** — Caution panel (signal chips, expandable disclosure)
- **E3.4** — Block modal (buy-click interception, focus trap, proceed anyway)
- **E4.1** — Live API call (AbortController, 5s timeout, failure → unknown)
- **E4.2** — Popup (last verdict, score, signals, scan button, on/off toggle)
- **Build** — esbuild bundles to dist/, popup.html copied, manifest paths updated

---

## Pivot decisions on the record (19 July)

- **Mock marketplace → browser extension.** The product is a Chrome MV3 extension operating on real Jumia/Temu pages. The mock marketplace is retained as a fallback demo only.
- **`new_account` + `price_anomaly` removed.** Replaced with `no_seller_store` (15pts) and `single_listing_seller` (12pts) — both DOM-readable on Jumia.
- **Three-tier extraction.** JSON-LD → DOM selectors → screenshot gap-fill.
- **Blue/white modern UI.** Extension overlay uses a clean blue/white design system.
- **Backend unchanged except signal updates.** Same `POST /api/analyze`, same AI call, same scoring engine.
- **CORS updated for extension origin.** `chrome-extension://` origins allowed.

---

## Next up

### B4.4 — Deploy backend
- Deploy to Railway or Render
- Set all env vars (GROQ_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, ALLOWED_ORIGINS)
- Update `API_URL` in `extension/src/content/index.ts` to deployed URL
- Rebuild extension (`npm run build` in `extension/`)

### Load extension in Chrome
1. Run `npm run build` in `extension/` (now copies popup.html too)
2. Go to `chrome://extensions` → Load unpacked → select `extension/` folder
3. Open a Jumia listing and verify overlay appears

---

## Risks

| Risk | Mitigation |
|---|---|
| Jumia DOM selectors break before demo | JSON-LD tier is the primary source and is stable. DOM tier is fallback. |
| Buy button selector doesn't match Jumia's actual element | Test on real Jumia page. Cut: fire modal on overlay button instead. |
| Groq 8K TPM cap hit with screenshot data URL | Drop screenshot from images array, rely on product image URLs only. |
| Extension ID changes between dev and prod | CORS wildcard `chrome-extension://` covers all extension IDs. |
| Mock marketplace fallback needed | frontend/ is complete and working. Three seeded listings produce clear/caution/block reliably. |
