# Verid Frontend — Implementation Units

**Owner:** Ashiah
**Last revised:** 15 July 2026 — **4 days to deadline**

One unit at a time. Complete and verify before starting the next.
Commit format: `feat(F#.#): short description`

Every unit has a **Verify** line. If you cannot demonstrate the verify condition, the unit is not done, regardless of how much code exists.

---

## Phase 1 — Host marketplace

- [x] **Unit F1.1: Scaffold**
  - Next.js 15 (App Router) + Tailwind + TypeScript strict.
  - Import the shared `AnalyzeRequest` / `AnalyzeResponse` types from `shared/types.ts`. Do not redeclare them locally — that is how a contract drifts.
  - `VeridProvider` context: `{ status: 'idle'|'scanning'|'done'|'failed', verdict: AnalyzeResponse|null, blockerOpen: boolean }`.
  - **Verify:** app builds clean under `strict: true`; provider default state logs on mount.

- [x] **Unit F1.2: Seed data**
  - `lib/seed-listings.ts` — three listings. Every field in `AnalyzeRequest` must be present, including `sellerAccountAgeDays`, `sellerRating`, `sellerVerified`, `categoryMedianPrice`.
  - Reverse-engineer the seeds from the five worked cases in `architecture.md`. The clean listing must score in 0–30. The caution listing must land in 31–85. The high-risk listing must exceed 86 **through all three layers** — new account + off-platform contact + stock photo + price anomaly + templated reviews. If the high-risk listing only trips two layers, the multiplier holds it under 86 and your demo has no blocker.
  - Reviews: 5 per listing. The high-risk set must be visibly templated — same sentence skeleton, same cadence, posted inside 48 hours. Write these by hand; make them look like real fake reviews, not like lorem ipsum.
  - **Verify:** hand-compute each seed's score against the weights table. All three land in their intended bands. Do this on paper before writing the backend. If the seeds don't produce three distinct bands, nothing downstream works.

- [x] **Unit F1.3: Marketplace UI**
  - `components/marketplace/` — `ProductGallery`, `ProductDetails`, `SellerCard`, `ReviewSection`, `BuyButton`.
  - **Vibrant expressive design** per the marketplace design system in `ui-context.md`: `Bricolage Grotesque` + `Manrope`, the magenta/violet/cyan palette on warm ivory, playful geometry, energetic layout. Build it with intent — it is the host, not the hero, so respect the effort budget (get type, color, and one strong hero listing layout right; do not gold-plate every card).
  - **The marketplace must not touch the status hues.** No green / amber / orange / red as a brand color anywhere — those belong to Verid alone (see the color rule in `ui-context.md`). Buy button is magenta.
  - **No Verid typefaces here.** Space Grotesk and DM Sans are Verid's tell; the marketplace never renders in them.
  - Every extraction target carries `data-verid-target="..."`: `title`, `price`, `description`, `seller-age`, `seller-rating`, `seller-reviews`, `images`, `reviews`. Styling is expressive, but extraction hooks are on `data-verid-target` only — never tie extraction to a class that visual polish will later change.
  - **Verify:** all three seeded listings render at `/listing/[id]` and look like a real, vibrant marketplace. `document.querySelectorAll('[data-verid-target]')` returns every field. No status-hue (green/amber/red) pixels anywhere except Verid components.

---

## Phase 1B — Accounts & seller-posted listings (scope expansion, 15 July)

The marketplace becomes real: email/password auth, sellers post products, listings live in Supabase. The three crafted seeds become DB rows. See `project-overview.md` (SCOPE EXPANSION) and `architecture.md` (Storage §A) for the reframed privacy pitch and the schema. This phase sits between the static marketplace (Phase 1) and the Verid overlay (Phase 2); the overlay does not care where a listing came from.

- [x] **Unit F1.4: Supabase wiring + schema**
  - Add `@supabase/supabase-js`. `lib/supabase/browser.ts` (anon key, client session) and `lib/supabase/server.ts` (anon key, server reads). Service-role key is used **only** in `scripts/seed.ts`, never in app code or the bundle.
  - Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client-safe); `SUPABASE_SERVICE_ROLE_KEY` (seed script only). `.env.local` is gitignored; ship `.env.local.example`.
  - Apply `supabase/migrations/0001_marketplace.sql`: `profiles`, `listings`, RLS policies, and the `auth.users` → `profiles` trigger.
  - **Verify:** the app reads an empty `listings` table without error; RLS blocks a write from an anonymous client.

- [x] **Unit F1.5: DB-backed marketplace + seed the demo rows**
  - `lib/listings.ts` — `getAllListings()` / `getListingById(id)` read from Supabase (listing joined to profile) and map rows to the shared `Listing` type the components already consume. Home + `/listing/[id]` read from here, not from `seed-listings.ts`.
  - `scripts/seed.ts` (service role) — create three demo seller accounts, insert their profiles with back-dated `created_at` for the crafted ages, insert the three listings from `seed-listings.ts`. Idempotent (safe to re-run).
  - **Verify:** after seeding, all three demo listings render from the DB at `/listing/[id]` and still hand-compute to clear / caution / block.

- [x] **Unit F1.6: Email/password auth**
  - `context/AuthProvider.tsx` (client) — wraps Supabase auth session, exposes `{ user, signUp, signIn, signOut }`. Header shows login state.
  - `/signup` and `/login` pages. Sign-up collects a `display_name` (written to the profile). Friendly error messages, no raw Supabase errors leaked to the UI.
  - **Verify:** sign up a new user, log out, log back in. A `profiles` row exists for them with `review_count = 0`, `verified = false`.

- [x] **Unit F1.7: Post a product**
  - `/sell` page, gated to signed-in users (redirect to `/login` otherwise). Form: title, subtitle, category, condition, location, description, price, image URLs (one per line, 1–5). `category_median_price` from a `CATEGORY_MEDIANS` map, fallback = price.
  - Insert into `listings` with `seller_id = auth.uid()`. On success, redirect to the new listing.
  - **Verify:** a signed-in user posts a product; it appears on the home grid and its own `/listing/[id]`; Verid analyses it end-to-end in Phase 3 like any other listing. A brand-new seller's listing correctly reads as a new account (age < 14, 0 reviews).

---

## Phase 2 — Verid overlay (build against hardcoded verdicts)

Do not wait for the backend. Hardcode `AnalyzeResponse` objects and build all four states now.

- [x] **Unit F2.1: Extraction utility**
  - `lib/extract-page-data.ts` → `extractPageData(): AnalyzeRequest`.
  - Reads DOM via `data-verid-target` only. Never CSS classes, never `id`.
  - **Strips review author names.** They are never read into the payload. This is a privacy requirement from `architecture.md`, not a preference — the whole "no PII" pitch depends on it.
  - **Verify:** console-log the return on each listing. It type-checks as `AnalyzeRequest`, contains no author names, and matches the seed data exactly.

- [x] **Unit F2.2: Scanning + Clear + Unknown states**
  - `VeridBadge` — grey pulsing dot → green shield / grey dash.
  - Reserve the badge's space on mount. **Zero layout shift.**
  - 400ms minimum scanning duration even on a faster response (see `ui-context.md`).
  - Unknown state renders grey, never green.
  - **Verify:** toggle hardcoded verdicts; badge transitions correctly; the Buy button does not move by a single pixel at any point.

- [x] **Unit F2.3: Caution banner (31–85)**
  - `VeridBanner` — amber, inserts above Buy, pushes content down.
  - Signal chips from `verdict.signals`, weight-ordered, max 4 then `+N more`.
  - Expandable disclosure: `explanation` + per-signal detail. Confidence sentence inline.
  - Buy button stays enabled and unchanged.
  - **Verify:** renders from a hardcoded caution verdict; disclosure expands; Buy still clicks through. This component is the demo's money shot — give it the most polish of anything you build.

- [x] **Unit F2.4: Blocker modal (86–100)**
  - `VeridBlocker` — scrim + blur, red rule, plain-English signal bullets.
  - **Fires on Buy click, not on mount.**
  - Buttons: `Go back` (solid red, primary) / `Report this listing` (secondary) / `Proceed anyway` (dim text link).
  - Focus trap. `Escape` → `Go back`.
  - **Verify:** clicking Buy on a hardcoded block verdict fires the modal; Tab cannot escape it; `Proceed anyway` reaches checkout.

---

## Phase 3 — Wire

- [ ] **Unit F3.1: Live API**
  - `useEffect` on listing mount → `extractPageData()` → `POST /api/analyze` → set verdict.
  - `AbortController`, 5000ms client timeout (backend budget is 4000ms; leave headroom).
  - Any failure → unknown state. Never a React error boundary over the page.
  - **Verify:** kill the backend mid-demo. The listing page still works and shows grey. Do this test — a crashed demo in front of judges ends the pitch, and this is the only line of defence.

- [ ] **Unit F3.2: Band routing**
  - Route `verdict.band` to the correct component. Read the band from the response; do not re-derive it from the score on the client. One source of truth, and it is the backend.
  - **Verify:** all three seeded listings hit the live backend and produce their intended bands end to end.

---

## Cut list — drop in this order if Saturday night is going badly

1. `Report this listing` button → make it a no-op that closes the modal.
2. `+N more` chip overflow → just render all signals.
3. Confidence sentence → keep it. It is 20 minutes and it answers a judging criterion. Cut something else.
4. Marketplace visual polish → cut back to the **clean vibrant baseline** (cohesive type + color + one strong listing layout). Do not gold-plate every card, but do not fall back to system-font gray either — the baseline is beautiful by design. Cut the fussy extras, keep the vibe.

**Never cut:** the three-band routing, the extraction utility, or the failure state. Those are the product.