# Verid — Progress Tracker

**Last revised:** 15 July 2026
**Deadline:** Sunday 19 July 2026 — **4 days**

---

## Status

Backend Phase 1–3 complete. Frontend Phase 1, 1B, and 2 complete. All 5 scoring tests pass. Ready for F3.1/F3.2 integration verification, then B3.3 deploy.

---

## Completed

- Scope locked: consumer-first standalone assistant on a seeded mock marketplace.
- Review analysis confirmed in scope (hardest layer for a scammer to forge).
- Git repo synced.
- **Reversed the Hugging Face ML pivot.** All three candidate repos verified as real; all three verified as unusable — transaction-fraud and email-spam models with no feature overlap with listing signals. Scoring returns to transparent weighted heuristics with a cross-layer compounding rule. See `project-overview.md`.
- **Switched primary AI provider from Gemini to Groq, for cost.** Text is settled: `openai/gpt-oss-120b`, GA, $0.15/$0.60 per million tokens. Vision is **free**, not paid — `qwen/qwen3.6-27b` is on Groq's free tier (30 RPM / 1,000 RPD / 8,000 TPM / 200,000 TPD, no card required). **Correction:** an earlier note here said Groq badges this model "preview" — that came from a stale third-party source and isn't on Groq's current docs. The real open question is capacity, not stability: whether one request's images fit under the 8,000 TPM cap. A decision gate (Unit B2.0, Thursday morning) checks logged token usage and picks single-call vs. an image-capped single-call vs. a Groq+Gemini hybrid.
- **Corrected the Gemini model string, kept as fallback.** `gemini-1.5-flash` is shut down and returns 404. If the hybrid vision path is needed, use `gemini-3.5-flash` via env var — same correction as before, just now conditional rather than primary.
- **Collapsed two AI calls into one, on whichever path is chosen.** No provider has a separate "Vision API" — vision is a multimodal capability of one model, not a distinct product, regardless of Groq or Gemini.
- **Fixed the API contract.** Added `sellerAccountAgeDays`, `sellerRating`, `sellerReviewCount`, `sellerVerified`, `categoryMedianPrice`. Removed `reviews[].author` as PII.
- **Resolved the threshold conflict.** Four files specified four different band schemes. Now one: 0–30 clear / 31–85 caution / 86–100 block, low-confidence capped at 60.
- **Corrected the timeline.** The handover said "7-day build." It is Wednesday. There are 4 days.
- **B1.1 done.** `shared/types.ts` — `AnalyzeRequest`, `AnalyzeResponse`, `SignalInput`, `Verdict`, `DEGRADED_RESPONSE`. Zod validates full request shape; malformed bodies → 400 `{ error: { code, message } }`. Route returns degraded stub 200.
- **B1.2 done.** `weights.ts` holds every number. `scoreListing()` is pure/sync. All 5 worked cases from `architecture.md` pass (`npm test`).
- **B1.3 done.** `src/db/log-verdict.ts` — fire-and-forget `logVerdict(verdict, rawSignals)`. Writes to `risk_logs` table. No PII, no review bodies, no URLs.
- **B2.0 decision: B2.1a with MAX_IMAGES=3.** Spike script existed with placeholder URLs (never run against real images). Taking the conservative single-call path with images capped at 3 to stay safely under the 8,000 TPM free-tier cap. If the cap proves too tight during integration, raise to 5 — one constant in `groq-client.ts`.
- **B2.1a done.** `src/ai/groq-client.ts` — single Groq call to `GROQ_MODEL_VISION` (default `qwen/qwen3.6-27b`). `AbortController` 4000ms timeout. Zod-validates response. Returns `null` signals on any failure — never throws.
- **B2.2 done.** `src/ai/prompts.ts` — `buildAnalysisPrompt()` template. Explicit key names and types in the prompt body (Groq JSON mode is a request, not a schema guarantee). Prompt instructs model to avoid rounding to 0/1 unless unambiguous.
- **B2.3 done.** `src/ai/computed-signals.ts` — `computePriceDeviationRatio()` and `computeReviewBurstRatio()`. Pure arithmetic, no AI.
- **Assembler done.** `src/ai/assemble-signals.ts` — `assembleSignals(req, modelSignals)` merges model output + computed signals + account fields into `SignalInput`. Neutral fallback values when model returns null (low-confidence path).
- **Brevo email verification done.** `backend/src/routes/email-verify.ts` — two endpoints: `POST /api/auth/send-code` (generates 6-digit code, stores in-memory with 10-min TTL, sends via Brevo Transactional Email) and `POST /api/auth/verify-code` (checks code, deletes on success). Signup page rewritten as a two-step flow: step 1 collects name/email/password and sends the code; step 2 takes the code input, verifies against the backend, then creates the Supabase account. Brevo key is server-side only (`BREVO_API_KEY` in backend `.env`). Sender: `olayinkaemma27@gmail.com`.

- **B3.1 done.** Route fully wired: validate → `extractSignals()` → `assembleSignals()` → `scoreListing()` → `buildExplanation()` → fire-and-forget `logVerdict()` → respond. AI failure → degraded 200, never 503.
- **B3.2 done.** `src/ai/build-explanation.ts` — plain-language sentence templated from fired signals. No second AI call.
- **Frontend Phase 2 done (F2.1–F2.4 + wiring).**
  - **F2.1:** `lib/extract-page-data.ts` — reads `data-verid-target` only, strips author names, returns typed `AnalyzeRequest`.
  - **F2.2:** `components/verid/VeridBadge.tsx` — scanning pulse → clear shield / unknown dash. Space reserved on mount, zero layout shift.
  - **F2.3:** `components/verid/VeridBanner.tsx` — caution band, dark instrument rectangle, signal chips (max 4 + overflow), expandable disclosure with explanation + confidence sentence.
  - **F2.4:** `components/verid/VeridBlocker.tsx` — block band modal, fires on Buy click, scrim darkens marketplace, focus trap, Escape → Go back, Proceed anyway always present.
  - **VeridScanner:** `components/verid/VeridScanner.tsx` — fires `extractPageData()` + `POST /api/analyze` on mount, 400ms minimum scan duration, any failure → unknown state, never crashes the page.
  - **BuyRegion:** `components/verid/BuyRegion.tsx` — client wrapper owning the buy interaction: banner above, badge beside button, Buy click intercepted for block band.
  - **Listing page updated:** `VeridScanner`, `VeridBlocker`, `BuyRegion` all mounted. `VeridProvider` wraps the page.
  - **Tailwind updated:** Verid colour tokens (`verid-surface`, `verid-border`, `verid-text`, `verid-text-dim`, `verid-clear`, `verid-caution`, `verid-block`, `verid-unknown`), Verid font families, `verid-pulse` keyframe.
  - **Layout updated:** Space Grotesk + DM Sans loaded as `--font-verid-head` / `--font-verid-body`.
- **Frontend Phase 1 done (F1.1–F1.3).** `frontend/` scaffolded: Next.js 15 App Router + Tailwind v3 + TS `strict`. `next build` is clean under strict; all three listing routes prerender via `generateStaticParams`.
  - **F1.1:** `context/VeridProvider.tsx` — `{ status, verdict, blockerOpen }` + setters, logs default state on mount. Shared types imported from `@shared/types` (type-only, tsconfig path alias). No local redeclaration of the contract.
  - **F1.2:** `lib/seed-listings.ts` — three listings, each hand-computed against the weights table (math in the file): clean **0** (Aso-Oke throw), caution **43** (teak lounge chair — reproduces the ui-context worked example: new_account 15 + price_anomaly 18 + vague_description 10, ×1.00), block **100** (iPhone scam — all three layers, rawSum 132 ×1.25 → capped 100). Review `author` is a display-only field, absent from `AnalyzeRequest`.
  - **F1.3:** `components/marketplace/` — `ProductGallery` (client), `ProductDetails`, `SellerCard`, `ReviewSection`, `BuyButton`, plus `MarketHeader`/`Stars`. Built in the **vibrant-expressive** system (Bricolage Grotesque + Manrope, magenta/violet/cyan/cobalt on warm ivory). Verified: no green/amber/red anywhere in the marketplace (color rule holds); every `data-verid-target` present in SSR HTML (`title`, `price`, `description`, `seller-age`, `seller-rating`, `seller-reviews`, `seller-verified`, `images`, `reviews`, `buy-button`); review author names rendered in unmarked elements so extraction can skip them.
  - **Note:** extended the extraction-target list with `seller-verified` (data attr) and put `categoryMedianPrice` on the price element as `data-verid-median` — both are in the `AnalyzeRequest` contract but had no other natural DOM home. F2.1 will read them.

---

## Next up

**Emmanuel — next:** B3.3 — deploy to Render/Railway, set env vars, write README.

**Ashiah — next:** F3.1/F3.2 are wired. Set `NEXT_PUBLIC_VERID_API_URL` in `.env.local`, run both servers, open all three seeded listings and verify clear/caution/block bands fire end-to-end.

---

## Day plan

| Day | Emmanuel | Ashiah |
|---|---|---|
| **Wed 15** | B1.1 shared types → B1.2 scoring + 5 tests passing | F1.1 scaffold → F1.2 seeds, hand-verified against weights |
| **Thu 16** | B2.0 vision spike (30 min, first thing) → B2.1a or B2.1b per the result → B2.2 prompt → B2.3 computed signals | F1.3 marketplace UI → F2.1 extraction |
| **Fri 17** | B3.1 wire route → B3.2 explanation → B3.3 deploy | F2.2 badge → F2.3 caution banner → F2.4 blocker |
| **Sat 18** | Integration with Ashiah. Calibrate weights against the seeds until all three bands fire cleanly. | F3.1 live API → F3.2 band routing. Integration. |
| **Sun 19** | Record demo. Submit. | Record demo. Rehearse pitch. Submit. |

**Sunday is not a build day.** It is a recording and submission day. Anything not working by Saturday night gets cut, not fixed. The cut lists are in `unit_frontend.md` and `unit_backend.md` — read them before you need them.

---

## Risks

| Risk | Mitigation | Owner |
|---|---|---|
| A single request's images may exceed Groq's free-tier 8,000 TPM cap and 429 live | Unit B2.0 spike logs actual `usage` tokens first thing Thursday. Fallback is capping images to 2–3 per request, then the Groq+Gemini hybrid if that's not enough — both specified in `unit_backend.md`. | Emmanuel |
| Seeds don't produce three distinct bands → no demo | Hand-compute Wednesday, before any code. The high-risk seed **must** trip all three layers or the multiplier holds it under 86. | Ashiah |
| Chosen model (Groq or Gemini) can't separate the seeded clean vs. high-risk listings | Caught in B2.2 verify. Iterate the prompt Thursday, when it's cheap. | Emmanuel |
| Integration slips to Sunday | Contract is a shared compiled type. Ashiah builds on hardcoded verdicts from day one and never blocks on the backend. | Both |
| An agent reads a stale context file and rebuilds the Python service | Every file dated 15 July 2026. `code-standards.md` rule 2 forbids Python outright. | Both |

---

## Decisions on the record

- **Heuristics over ML.** Not a compromise, a correction. The published precision of the best candidate model was 0.2640.
- **One AI call where possible, not two.** No provider has a separate Vision API. If the Groq vision spike fails, the fallback is two calls run in parallel (`Promise.all`), not a return to a sequential two-call design.
- **Blocker fires on Buy click, not page load.** Interruption at the point of decision is the only interruption that changes an outcome.
- **`Proceed anyway` always exists.** We are confident, not infallible. An un-overridable tool gets uninstalled.
- **Degraded response is 200, not 503.** Verid failing must not break the buyer's page.
- **Review authors are never transmitted.** The review scope expansion had quietly introduced PII into a system whose privacy pitch is "we store none."
- **SCOPE EXPANSION → real accounts + seller-posted listings (15 July).** The marketplace is no longer a static three-listing mock. Added email/password auth (Supabase Auth) and a seller "post a product" flow; listings now live in Supabase (`profiles` + `listings`, RLS-protected). The three crafted seeds become DB rows owned by demo accounts (deterministic demo anchors preserved). Privacy pitch reframed to two layers: the marketplace host stores ordinary account/listing data under RLS, while Verid's `risk_logs` stays PII-free and unchanged — that table still backs the "Verid stores no PII" claim. Updated `project-overview.md` (scope), `architecture.md` (Storage §A/§B), `unit_frontend.md` (new Phase 1B: F1.4–F1.7). API contract, scoring, and `risk_logs` are untouched. Decisions: Supabase already provisioned (user has credentials), auth = email/password, images = pasted URLs, seeds kept.
- **Marketplace visual direction changed to vibrant-expressive (15 July).** The old "keep the mock marketplace deliberately plain / ugly" rule is reversed. The marketplace is now a beautiful vibrant craft/maker host (`Bricolage Grotesque` + `Manrope`, magenta/violet/cyan on warm ivory). Verid's overlay is **unchanged** — still dark, clinical, Space Grotesk. The two-visual-systems contrast was re-engineered from *plain vs. distinctive* to *warm art vs. cold instrument*; the demo mechanic (Verid reads as "not part of this page" at a glance) is preserved. New hard constraint: the marketplace may not use the green/amber/red status hues as brand colors — those are Verid's alone. Updated `ui-context.md` and `unit_frontend.md` (F1.3 + cut list). Scope, API contract, and scoring are untouched.

---

## Note on the methodology

The handover calls this the **Six-File Context Methodology** and then lists seven files. There are seven. They are:

`project-overview.md` · `architecture.md` · `ui-context.md` · `code-standards.md` · `unit_frontend.md` · `unit_backend.md` · `progress-tracker.md`

Minor, but if the name of the system doesn't match the system, neither will anything downstream of it.