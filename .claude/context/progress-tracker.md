# Verid — Progress Tracker

**Last revised:** 19 July 2026

---

## Status

**PIVOT: Browser extension on real marketplaces.**

Backend complete (B1–B3). Mock marketplace complete (F1–F3, retained as fallback). Extension build starting now. Backend needs signal updates (B4.1–B4.3) to support new real-marketplace signals.

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
- **CORS** — inline middleware, ALLOWED_ORIGINS env var
- **F1.1–F1.3** — Mock marketplace scaffold + seed data + vibrant UI
- **F1.4–F1.7** — Supabase wiring, DB-backed listings, auth, sell page
- **F2.1–F2.4** — Verid overlay (badge, banner, blocker, scanner)
- **F3.1–F3.2** — Live API wiring + band routing
- **Seed script** — three demo listings in DB (clear/caution/block)

---

## Pivot decisions on the record (19 July)

- **Mock marketplace → browser extension.** The product is a Chrome MV3 extension operating on real Jumia/Temu pages. The mock marketplace is retained as a fallback demo only.
- **`new_account` + `price_anomaly` removed.** Both require data unavailable on real marketplace pages (seller account age, category median price). Replaced with `no_seller_store` (15pts) and `single_listing_seller` (12pts) — both DOM-readable on Jumia.
- **Three-tier extraction.** JSON-LD → DOM selectors → screenshot gap-fill. JSON-LD is the primary source; it's stable and machine-readable. Screenshot via `captureVisibleTab()` fills gaps and feeds the vision model.
- **Blue/white modern UI.** Extension overlay uses a clean blue/white design system. Old dark/clinical overlay and vibrant marketplace palette are both retired for the extension.
- **Backend unchanged except signal updates.** Same `POST /api/analyze`, same AI call, same scoring engine. Only the signal definitions and request schema change (B4.1–B4.3).
- **CORS updated for extension origin.** `chrome-extension://` origins allowed in the CORS middleware.

---

## Next up

### Backend (B4.1–B4.4)
1. **B4.1** — Update `shared/types.ts` + `AnalyzeRequestSchema` (add `sellerHasStorePage`, `sellerListingCount`, relax optional fields)
2. **B4.2** — Update `weights.ts` + `score-listing.ts` (new Layer 1 signals)
3. **B4.3** — Update `assemble-signals.ts`
4. **B4.4** — Deploy with updated CORS

### Extension (E1–E4)
1. **E1.1** — Manifest + project setup
2. **E1.2** — Shared types bridge
3. **E2.1** — JSON-LD extraction tier
4. **E2.2** — DOM selector tier
5. **E2.3** — Screenshot tier + merge
6. **E3.1** — Overlay scaffold + scanning state
7. **E3.2** — Clear + Unknown states
8. **E3.3** — Caution panel
9. **E3.4** — Block modal
10. **E4.1** — Live API call
11. **E4.2** — Popup

---

## Risks

| Risk | Mitigation |
|---|---|
| Jumia DOM selectors break before demo | JSON-LD tier is the primary source and is stable. DOM tier is fallback. If both fail, screenshot tier still feeds the vision model. |
| Buy button selector doesn't match Jumia's actual element | Test on real Jumia page before building E3.4. Cut list: fire modal on a "Check listing" button in the overlay instead. |
| Groq 8K TPM cap hit with screenshot data URL | Screenshot is large. If TPM is hit, drop screenshot from the images array and rely on product image URLs only. |
| Extension ID changes between dev and prod | CORS wildcard `chrome-extension://` covers all extension IDs. |
| Mock marketplace fallback needed | frontend/ is complete and working. Three seeded listings produce clear/caution/block reliably. |
