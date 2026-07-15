# Verid — Architecture

**Last revised:** 15 July 2026

---

## Stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | Next.js 15 + Tailwind | Mock marketplace host + Verid overlay components |
| Backend | Node.js + Express + TypeScript | Single analyse route: extract → score → respond |
| AI | Groq (OpenAI-compatible API) | Text signal extraction, cheap and fast. Vision path gated — see below. |
| Scoring | In-process TypeScript module | Weighted heuristics. No Python, no external service. |
| Database | Supabase (Postgres) | Anonymised signal vectors only |

**No `/ml-service` directory. No Python. No `.pkl`. No `child_process.spawn`.** If any file in this repo imports `child_process` for scoring, it is a defect.

---

## AI provider — Groq

**Switched from Gemini to Groq for cost.** Verified against Groq's own docs. The tradeoff is real and asymmetric between text and vision — read both parts before wiring Unit B2.1.

### Text — settled

Use `openai/gpt-oss-120b` via Groq's OpenAI-compatible endpoint (`https://api.groq.com/openai/v1`). $0.15 input / $0.60 output per million tokens, JSON mode supported, GA (not preview). This is the model for `urgency_language`, `vague_description`, `offplatform_contact`, `review_templating`, `review_mismatch`.

**Do not use `llama-3.3-70b-versatile` or `llama-3.1-8b-instant`.** Both are on Groq's deprecation list. Prior Groq projects here used `llama-3.3-70b-versatile`; it is being retired. Check `console.groq.com/docs/deprecations` before this ships — that page is the source of truth, not this file.

### Vision — free, but capacity-constrained, not cost-constrained

**Correction to a prior version of this file: `qwen/qwen3.6-27b` is not badged "preview" on Groq's current vision docs page.** That claim came from a third-party doc that appears stale. Groq's own page currently badges only `llama-4-scout-17b-16e-instruct` as preview; `qwen3.6-27b` carries no such label as of this writing. Don't repeat the preview claim in the pitch — it isn't accurate, and it isn't the actual risk anyway.

**The real situation, confirmed against Groq's rate-limits page:** `qwen/qwen3.6-27b` is on Groq's free tier — no credit card, $0, gated by rate limits only:

| Limit | Free tier value |
|---|---|
| RPM (requests/minute) | 30 |
| RPD (requests/day) | 1,000 |
| TPM (tokens/minute) | 8,000 |
| TPD (tokens/day) | 200,000 |

For a 4-day build plus a 3-minute demo, RPD and TPD are not a concern — nowhere near 1,000 requests or 200K tokens in a day of dev + demo traffic.

**TPM is the one to watch.** 8,000 tokens/minute is tight against a single request that bundles description + reviews + 3–5 images. Groq does not publish the exact per-image token cost on its docs page; other vision APIs typically spend several hundred to 1,000+ tokens per image depending on resolution. If image tokens alone approach 8K in one call, **a single request can 429 on the spot** — a different failure mode than running out of daily quota, and the one that would actually surface live during a demo.

**Decision gate — run this as the first thirty minutes of Unit B2.0, Thursday morning, not Saturday:**

Call `qwen/qwen3.6-27b` with the seeded clean-listing images and the seeded high-risk (stock-photo) images. Check:
- Does the response's `usage` field show token counts safely under 8,000 for a full request (description + reviews + all images)? Log it — don't estimate.
- Does it produce a meaningfully different `image_synthetic_probability` between the clean and high-risk seeds, or does everything land near the same number?
- What's the wall-clock latency with 3–5 image URLs in one request?
- Run it 15–20 times in a row (this alone burns real RPD budget — track it). Does it 429 on TPM before RPD ever becomes relevant?

**If it passes (safely under 8K tokens, good discrimination, acceptable latency):** single Groq call, `qwen/qwen3.6-27b`, text + images + reviews together in one request.

**If TPM is the failure (discrimination is fine but token count runs close to or over 8K):** the fix is very likely capping images to 2–3 per request rather than 5, or dropping image resolution before sending the URL — not a provider switch. Try that first; it's cheaper than standing up a second provider.

**If it fails on discrimination or reliability, not just TPM:** fall back to a two-provider hybrid — `gpt-oss-120b` on Groq for all text/review signals, plus a single Gemini `gemini-3.5-flash` call for `image_synthetic` only, fired in parallel with the Groq call via `Promise.all`, not sequentially. Keep the Gemini client code from the prior iteration rather than deleting it.

**Decide by Thursday lunchtime and write the answer into `progress-tracker.md`.** Do not carry this decision into Friday.

Model strings live in `GROQ_MODEL_TEXT` and `GROQ_MODEL_VISION` env vars (plus `GEMINI_MODEL` if the fallback triggers). Never hardcoded in a service file — this project has already been burned once by a hardcoded model string going stale (Gemini 1.5 → 404).

**"A separate Vision API" still doesn't exist, on either provider.** Whichever path is taken, images and text travel in the same request to one multimodal model.

**Note on structured output:** Groq's JSON mode (`response_format: { type: "json_object" }`) is a looser guarantee than Gemini's schema-constrained output — it asks the model to emit valid JSON but doesn't constrain the shape at the API level. Prompts must spell out exact key names and types explicitly, and Zod validation is not optional here — it's the only thing standing between a malformed response and a crashed route.

---

## API contract — `POST /api/analyze`

This is the contract. Frontend and backend both build against exactly this. Any change is a two-person decision, not a unilateral one.

### Request

```ts
{
  title: string;
  price: number;              // NGN, integer
  categoryMedianPrice: number; // from seed data; the market baseline
  description: string;
  sellerAccountAgeDays: number;
  sellerRating: number | null;  // 0-5, null if none
  sellerReviewCount: number;
  sellerVerified: boolean;
  images: string[];             // absolute URLs
  reviews: {
    body: string;
    rating: number;             // 1-5
    postedAt: string;           // ISO 8601
  }[];
}
```

**The previous contract was `{ title, price, description, images, reviews }`.** It omitted `sellerAccountAgeDays` — a field the frontend was told to seed (unit_frontend 1.2) and extract (unit_frontend 2.1), and which the scoring depends on. Ashiah would have built against a contract missing a field Emmanuel needs. That is the one failure an API contract exists to prevent, and it was already present on day one.

**`reviews[].author` is deliberately absent.** Review author names are PII. The scope expansion to review analysis quietly introduced personal data into a system whose entire privacy pitch is "we store no PII." The frontend strips author names during extraction. They never enter the payload, never reach the AI provider, never reach Supabase. If a judge asks about the privacy answer, this is the thing they will find.

### Response

```ts
{
  score: number;              // 0-100 integer
  band: "clear" | "caution" | "block";
  confidence: "high" | "medium" | "low";
  explanation: string;        // one plain-language sentence
  signals: {
    label: string;            // "Seller account is 3 days old"
    weight: number;           // points contributed
  }[];                        // only signals that fired; ordered by weight desc
}
```

### Degraded response

On AI-call timeout or failure, return **HTTP 200** with:

```ts
{ score: 0, band: "clear", confidence: "low", explanation: "Analysis unavailable.", signals: [] }
```

Not a 503. A 503 makes the frontend render an error state on a page the buyer is trying to use. Verid failing silently is correct behaviour — it is an assistant, not a gate. `confidence: "low"` is the honest signal, and the UI renders a neutral "couldn't check this one" state rather than a false all-clear.

---

## Scoring specification

**Non-negotiable properties.** These exist because each one is the answer to a question a judge will ask:

- **No single signal can reach the block band.** A legitimate seller with a new account is not a scammer. Answers the false-positive question.
- **The block band requires all three layers to fire.** Signal stacking. Answers the adversarial-resilience question.
- **Low confidence caps the score.** Answers the false-certainty question.
- **Every point is traceable to a named signal shown in the UI.** Answers the explainability question.

### Signal layers

**Layer 1 — Account** (from DOM, no AI)
| Signal | Condition | Points |
|---|---|---|
| `new_account` | `sellerAccountAgeDays < 14` | 15 |
| `no_history` | `sellerReviewCount === 0 && sellerAccountAgeDays < 30` | 8 |

**Layer 2 — Listing** (Groq text model + computed)
| Signal | Condition | Points |
|---|---|---|
| `offplatform_contact` | Model flags WhatsApp / phone / email / "message me directly" in description | 30 |
| `image_synthetic` | Vision model image assessment `> 0.7` (stock or AI-generated) | 20 |
| `price_anomaly` | `(price - categoryMedianPrice) / categoryMedianPrice < -0.35` | 18 |
| `urgency_language` | Model urgency score `> 0.7` | 12 |
| `vague_description` | Model specificity score `< 0.3` | 10 |

**Layer 3 — Reviews** (Groq text model + computed)
| Signal | Condition | Points |
|---|---|---|
| `review_templating` | Model template-similarity `> 0.7` across review bodies | 15 |
| `review_mismatch` | Model flags reviews discussing a different product than the listing | 12 |
| `review_burst` | `>50%` of reviews posted within any 48h window | 10 |

Maximum raw sum: 150. Capped at 100 after the multiplier.

### Cross-layer compounding

```
layersFired = number of layers (1,2,3) contributing > 0 points

multiplier = layersFired === 3 ? 1.25
           : layersFired === 2 ? 1.00
           : 0.80

score = min(100, round(rawSum * multiplier))
```

Worked cases — verify the implementation against these:

- **Honest seller, new account, priced to move fast.** `new_account` (15) + `price_anomaly` (18) = 33 raw. Two layers → ×1.00 → **33, caution.** Warned, not blocked. Correct.
- **New account only.** 15 raw, one layer → ×0.80 → **12, clear.** Correct. A new seller is not a scammer.
- **Off-platform payment request alone.** 30 raw, one layer → ×0.80 → **24, clear.** Deliberate: worth surfacing but not worth a roadblock on its own.
- **Aged account, polished description, but stolen photos and templated reviews.** `image_synthetic` (20) + `review_templating` (15) + `review_mismatch` (12) = 47 raw, two layers → ×1.00 → **47, caution.** The scammer who ages their account and writes well still gets flagged — via a layer they cannot easily fake.
- **Full scam pattern.** `new_account` (15) + `offplatform_contact` (30) + `image_synthetic` (20) + `price_anomaly` (18) + `review_templating` (15) = 98 raw, three layers → ×1.25 = 122 → **100, block.**

### Confidence

```
resolvable = signals whose input data was present and the model returned a value for
confidence = resolvable >= 8 ? "high" : resolvable >= 5 ? "medium" : "low"
if (confidence === "low") score = min(score, 60)
```

A listing with no reviews and no category median has too little to say anything loud about. Cap it and say so.

### Where the weights live

`backend/src/scoring/weights.ts` — a single exported const object. Nothing else in the codebase contains a magic number. When a judge asks "how did you pick 30 for off-platform contact," the answer is "calibrated against our seeded cases, and it's one file, here it is." That is a better answer than pointing at a pickle.

---

## Boundaries

- `frontend/` — mock marketplace components (`ProductGallery`, `SellerCard`, `ReviewSection`) and Verid overlay components (`VeridBadge`, `VeridBanner`, `VeridBlocker`) live in **separate directories** and share no imports. The marketplace does not know its own risk score. Breaking this makes the demo a lie.
- `backend/src/ai/` — provider client(s), one primary call (plus the parallel Gemini fallback call for vision if the decision gate requires it), strict JSON output, Zod-validated.
- `backend/src/scoring/` — pure functions. No I/O. No async. Given a signal object, returns a verdict. Trivially unit-testable, which is the point.
- `backend/src/db/` — fire-and-forget anonymised logging. Never blocks the response.

## Storage

Supabase now holds **two kinds of data, kept separate on purpose** (see the reframed privacy pitch in `project-overview.md`):

### A. Marketplace host data — `profiles` + `listings` (RLS-protected)

Ordinary marketplace data. A seller can read everything (the marketplace is public) but write only their own rows. Auth is Supabase Auth, email/password.

```sql
-- One profile per auth user. Holds seller reputation + display identity.
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null,
  verified      boolean not null default false,
  rating        numeric(2,1),          -- 0.0–5.0, null until rated
  review_count  int not null default 0,
  created_at    timestamptz not null default now()  -- drives sellerAccountAgeDays
);

create table listings (
  id                    uuid primary key default gen_random_uuid(),
  seller_id             uuid not null references profiles(id) on delete cascade,
  title                 text not null,
  subtitle              text not null default '',
  category              text not null,
  condition             text not null default '',
  location              text not null default '',
  description           text not null,
  price                 int not null,          -- NGN, integer
  category_median_price int not null,          -- baseline for price_anomaly
  images                text[] not null default '{}',  -- absolute public URLs
  reviews               jsonb not null default '[]',   -- [{author, body, rating, postedAt}]
  created_at            timestamptz not null default now()
);
```

**RLS:** `select` open to all on both tables; `insert`/`update`/`delete` on `listings` require `seller_id = auth.uid()`; `insert`/`update` on `profiles` require `id = auth.uid()`. A trigger on `auth.users` insert creates the matching `profiles` row. Full policy SQL lives in `supabase/migrations/`.

**Mapping to the API contract:** the frontend reads a listing joined to its profile and builds the `AnalyzeRequest` — `sellerName` = `profiles.display_name`, `sellerAccountAgeDays` = days since `profiles.created_at`, `sellerRating`/`sellerReviewCount`/`sellerVerified` from the profile, `reviews` from the listing (author names stripped before the payload, as always). `categoryMedianPrice` comes from the listing row; for user posts it is filled from a small `CATEGORY_MEDIANS` map (fallback: the listing's own price, so `price_anomaly` simply doesn't fire — consistent with the known limitation that we lack a real price index).

**The three demo listings are rows here**, owned by seeded demo accounts, with `profiles.created_at` back-dated to produce the crafted account ages. They are inserted by `frontend/scripts/seed.ts` (service-role key, server-side only). The hand-computed band math for them stays documented in `frontend/lib/seed-listings.ts`.

### B. Verid analysis log — `risk_logs` (unchanged, PII-free)

```sql
create table risk_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  score int not null,
  band text not null,
  confidence text not null,
  signals jsonb not null,        -- fired signal labels + weights
  raw_signal_vector jsonb not null  -- the numeric inputs, for future calibration
);
```

No seller identity. No buyer identity. No listing URL. No review author. No IP. This table is the backbone of the "Verid stores no PII" claim and it does **not** change because the marketplace gained accounts — the two data concerns stay separate. The `raw_signal_vector` is the thing that would eventually become training data — the honest version of the "feedback loop" claim.

## Latency budget

| Step | Budget |
|---|---|
| DOM extraction (client) | 50ms |
| Network | 200ms |
| AI call(s) — single Groq path | ~800ms p50 / **4000ms hard timeout** |
| AI call(s) — hybrid fallback path (parallel) | ~1200ms p50 (bounded by the slower of the two, run concurrently, not sequential) |
| Scoring (pure, in-process) | <5ms |
| **Total p50 target** | **~1–1.5s** |

Groq's LPU inference is generally faster than GPU-hosted Gemini for text, which is the main latency upside of the switch. The unmeasured variable is `qwen/qwen3.6-27b` specifically — preview models sometimes run on different serving infrastructure than a provider's GA models, and Groq's published speed benchmarks are mostly reported for `gpt-oss` and `llama` text models, not the vision model. That's what the Thursday decision gate above exists to check — measure it before trusting the number in this table.

A prior version of these files specified a 1.5s Gemini timeout inside a 2.5s total budget while also requiring two Gemini calls and a Python cold start. A `child_process.spawn` of Python reloads the interpreter and re-imports sklearn/xgboost on every single request — 1–3s before any inference happens. That budget never worked, on any provider. In-process scoring plus a single (or parallelised) AI call is what makes the current budget realistic.