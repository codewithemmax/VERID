# Verid Backend — Implementation Units

**Owner:** Emmanuel
**Last revised:** 15 July 2026 — **4 days to deadline**

One unit at a time. Complete and verify before starting the next.
Commit format: `feat(B#.#): short description`

**Phase 3 of the previous version — the Python ML microservice — is deleted, not deferred.** See `project-overview.md` for the reasoning. If you find yourself installing `xgboost`, you are reading a stale file.

---

## Phase 1 — Foundation

- [X] **Unit B1.1: Express scaffold + shared types**
  - Node + Express + TypeScript strict. `.env` gitignored on the first commit.
  - `shared/types.ts` — `AnalyzeRequest`, `AnalyzeResponse`, `SignalInput`, `Verdict`. Imported by both packages. **Write this first and tell Ashiah it exists.** The contract being a compiled type rather than a paragraph is the single highest-leverage thing in this build.
  - Zod schema for `AnalyzeRequest`; `POST /api/analyze` rejects malformed bodies with 400.
  - Error middleware, shape `{ error: { code, message } }`.
  - **Verify:** server boots; empty POST → 400; a valid seeded payload → 200 with a stub.

- [x] **Unit B1.2: Scoring module** ← *do this before touching the AI provider*
  - `src/scoring/weights.ts` — every weight and threshold from `architecture.md`. One exported const. Nothing else in the repo holds a scoring number.
  - `src/scoring/score-listing.ts` — `scoreListing(signals: SignalInput): Verdict`. Pure, sync, no I/O, no `Date.now()`, no randomness. Implements: weighted sum → layer count → multiplier → cap 100 → band → confidence → low-confidence cap at 60.
  - `src/scoring/scoring.test.ts` — the five worked cases from `architecture.md`, asserted exactly.
  - **Verify:** all five pass. This is the unit that proves the engine is logic and not a lookup table. It is also the unit that will otherwise get skipped on Saturday. Do it Wednesday.

  Why first: the scoring module is the product. the AI call is a feature extractor you could replace. Building it first means that if everything else slips, you have a working, testable, honest engine to demo, and a stub extractor is a two-hour job. Building it last means it gets rushed and untested.

- [x] **Unit B1.3: Supabase logging**
  - Client init. `risk_logs` table per `architecture.md`.
  - `logVerdict(verdict, rawSignals)` — fire and forget. Never awaited in the request path. Failure is swallowed and logged locally.
  - Passes score, band, confidence, fired signals, raw numeric vector. **Nothing else.** No review bodies, no seller names, no URLs.
  - **Verify:** an analyse call inserts a row. Kill the Supabase key — the endpoint still returns 200 in full.

---

## Phase 2 — AI signal extraction (Groq)

- [x] **Unit B2.0: Vision capacity check — do this FIRST, before writing any service code**
  - This is a 30-minute spike, not a full implementation. Hit Groq's `qwen/qwen3.6-27b` directly (curl or a throwaway script) with the seeded clean-listing images and the seeded high-risk stock-photo images.
  - **This model is free-tier (30 RPM / 1,000 RPD / 8,000 TPM / 200,000 TPD), not preview-restricted** — a prior version of this file said otherwise based on a stale third-party source; Groq's own docs don't badge it preview. The actual constraint is capacity, not stability.
  - **Check the `usage` field on every response.** A single request bundling description + reviews + 3–5 images needs to land safely under 8,000 tokens, or it risks a 429 on the spot during a live demo — a sharper failure than running low on daily quota.
  - Also check: does it produce a meaningfully different `image_synthetic_probability` between the clean and high-risk seeds, or does everything cluster near the same number? What's the latency with 3–5 image URLs in one request? Run it 15–20 times back to back — note how much of the 1,000 RPD budget that alone costs.
  - **This determines which of B2.1a or B2.1b you build next. Do not build both "just in case" — pick one, write the decision in `progress-tracker.md`, move on.**
  - **Verify:** you have a logged token count, a latency number, and a pass/fail judgement, in writing, before lunch Thursday.

- [x] **Unit B2.1a: Single-call path (if the gate passes)**
  - `src/ai/groq-client.ts`. Vision+text model from `process.env.GROQ_MODEL_VISION`, default `qwen/qwen3.6-27b`.
  - **One request.** Description, review bodies, and image URLs together in one message.
  - `response_format: { type: "json_object" }`. Groq's JSON mode does not enforce a schema the way Gemini's does — the prompt must spell out exact keys and types, and Zod validation is load-bearing, not a formality.
  - `AbortController`, 4000ms.
  - If B2.0 showed token usage running close to the 8K TPM ceiling, cap images at 2–3 per request or downsize before sending the URL, rather than risking a live 429.
  - **Verify:** a real seeded payload returns parseable JSON matching the Zod schema, with logged token usage comfortably under 8,000.

- [x] **Unit B2.1b: Hybrid-call path (if the gate fails)**
  - `src/ai/groq-client.ts` — text-only call to `process.env.GROQ_MODEL_TEXT`, default `openai/gpt-oss-120b`, for description + reviews.
  - `src/ai/gemini-client.ts` — single call to `process.env.GEMINI_MODEL`, default `gemini-3.5-flash`, for images only (`image_synthetic` alone).
  - Both fired via `Promise.all`, **concurrent, not sequential** — this is what keeps the hybrid path inside the latency budget.
  - Same JSON-mode / Zod-validation / timeout treatment on both.
  - **Verify:** both calls complete and merge into one signal object; total wall-clock time is bounded by the slower of the two calls, not their sum.

- [x] **Unit B2.2: Prompts + Zod validation**
  - `src/ai/prompts.ts` — exported template functions, not inline strings. You will rewrite these many times.
  - Must extract, as numbers: `urgency_score`, `description_specificity`, `offplatform_contact` (bool), `image_synthetic_probability`, `review_template_similarity`, `review_product_mismatch`. Names must match `SignalInput` exactly, whichever path (B2.1a/B2.1b) is producing them.
  - Zod-parse the response. On parse failure → degraded verdict, not a throw.
  - **Verify:** the high-risk seed produces high urgency + `offplatform_contact: true` + high image_synthetic. The clean seed produces low values across the board. If the model can't separate your own seeded listings, the prompt is wrong — fix it here, before wiring, while it's cheap to iterate.

- [x] **Unit B2.3: Computed signals**
  - `price_anomaly` and `review_burst` are arithmetic, not AI, on either path. Compute them in TypeScript from the request. Do not ask any model to do maths it will do worse and slower.
  - `review_burst`: >50% of reviews within any rolling 48h window.
  - **Verify:** unit-test both against the seeds.

---

## Phase 3 — Assembly

- [ ] **Unit B3.1: Wire the route**
  - `POST /api/analyze`: validate → AI call(s) (B2.1a or B2.1b, per the Thursday decision) + computed signals → assemble `SignalInput` → `scoreListing()` → fire-and-forget log → respond.
  - AI-call failure or timeout → **HTTP 200** with the degraded verdict (`score: 0, band: "clear", confidence: "low", explanation: "Analysis unavailable."`). Not 503. Verid failing must not break the buyer's page.
  - **Verify:** full round trip on all three seeds produces the three intended bands, p50 under ~1.5s. Then pull the network cable mid-request and confirm a clean degraded 200.

- [ ] **Unit B3.2: Explanation string**
  - One plain-language sentence generated from the fired signals. **Template it in TypeScript from the signal labels — do not make a second AI call for prose.** A second round trip to write one sentence doubles your latency for cosmetics.
  - Signal labels are human-readable at the point of definition: `"Seller account is 3 days old"`, not `"new_account"`. The UI renders these directly.
  - **Verify:** each seed produces a sentence a non-technical person understands with no jargon and no numbers like `0.91`.

- [ ] **Unit B3.3: Deploy + README**
  - Render or Railway. Env vars set. CORS allows the frontend origin.
  - `README.md`: what it is, how to run it, required env vars, how to hit the endpoint with curl.
  - **Verify:** Ashiah's deployed frontend reaches the deployed backend. Judges clone repos — a repo that doesn't run is a repo that scores zero on code quality regardless of what's in it.

---

## Cut list — drop in this order

1. Supabase logging (B1.3) → console.log. Costs the "feedback loop" talking point; say it's schema-ready.
2. `review_burst` → the templating signal carries the review layer alone.
3. Deploy → demo on localhost, record the video locally.

**Never cut:** B1.2. The scoring module with its tests is the entire technical claim.

---

## Open questions

- **Vision path is a capacity question, not a stability question.** `qwen/qwen3.6-27b` is free-tier and not preview-restricted (correcting an earlier note in this file that said otherwise). The open variable is whether one request's image tokens fit under the free tier's 8,000 TPM cap. Unit B2.0 resolves this Thursday morning — single-call, image-capped single-call, or hybrid — before any dependent unit is built.
- **`categoryMedianPrice` comes from seed data.** In production it needs a price index we don't have. This is a stated Phase 2 dependency in `project-overview.md`, not something to solve this week — but know the answer when a judge asks where the market baseline comes from.