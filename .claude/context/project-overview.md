# Verid — Project Overview

**Last revised:** 19 July 2026

---

## What Verid is

Verid is a browser extension that detects fraudulent marketplace listings in real time, before a buyer pays. It reads publicly visible listing data on real marketplaces — Jumia, Temu — extracts fraud signals using a three-tier strategy, and renders a risk verdict directly on the page.

It does not read the buyer's data. It reads the seller's public page.

---

## PIVOT DECISION (19 July) — Browser Extension on Real Marketplaces

**Reversed: mock marketplace is no longer the demo host.**

The product is now a Chrome MV3 browser extension that operates on real marketplace pages. The mock marketplace (frontend/) is retained as a fallback demo only — it is not the pitch.

Reasons on the record:
- A real extension on Jumia is the actual product. A mock marketplace is a demo crutch judges recognise.
- DOM extraction on a rendered page sidesteps bot detection entirely — Jumia cannot block a user's own browser reading its own rendered HTML.
- The demo mechanic is stronger: judges watch Verid fire on a live Jumia listing, not a seeded localhost page.

**The backend is completely unchanged.** Same `POST /api/analyze`, same scoring, same AI. The extension is a new extraction client feeding the existing API contract.

---

## Signal changes for real marketplaces

Two signals that depended on data unavailable on real marketplace pages are replaced:

**Removed:**
- `new_account` (15pts) — seller account age is not shown on Jumia/Temu listing pages
- `price_anomaly` (18pts) — requires a category median price baseline we don't own

**Added:**
- `no_seller_store` (15pts) — seller has no linked store/profile page. Real sellers on Jumia have a store link; scam listings often don't. DOM-readable.
- `single_listing_seller` (12pts) — seller has only one listing visible. Real sellers have multiple. DOM or screenshot-readable.

All AI-derived signals survive unchanged: `offplatform_contact`, `image_synthetic`, `urgency_language`, `vague_description`, `review_templating`, `review_mismatch`.

---

## Three-tier extraction strategy

```
Tier 1 — JSON-LD structured data
  Parse <script type="application/ld+json"> on the listing page.
  Jumia embeds schema.org/Product — gives title, price, description,
  images, reviews cleanly. Most reliable source. Check first.

Tier 2 — DOM selectors
  Targeted CSS selectors for fields JSON-LD missed.
  Every selector wrapped in try/catch. Fragile but fast.

Tier 3 — Screenshot gap-fill
  chrome.tabs.captureVisibleTab() for fields tiers 1+2 couldn't get,
  and for image analysis. Cropped to listing content area.
  Sent to the vision model alongside text signals.
```

---

## Core user flow

1. User installs the Verid Chrome extension.
2. User opens a Jumia or Temu product listing page.
3. Extension content script fires automatically on matching URLs.
4. Three-tier extraction runs: JSON-LD → DOM selectors → screenshot gap-fill.
5. Payload sent to `POST /api/analyze` on the Verid backend.
6. Verdict returned. Extension injects the Verid overlay onto the page.
7. UI renders friction proportional to the score — badge, banner, or blocker.

---

## Extension UI — blue/white modern theme

The extension overlay uses a modern blue/white design system, distinct from both the old dark Verid overlay and the mock marketplace palette.

**Design tokens:**
```css
--v-bg:          #FFFFFF;
--v-surface:     #F0F4FF;
--v-border:      #C7D7FD;
--v-text:        #0F172A;
--v-text-dim:    #64748B;
--v-blue:        #2563EB;   /* primary brand */
--v-blue-light:  #EFF6FF;
--v-clear:       #16A34A;   /* green  — 0-30  */
--v-caution:     #D97706;   /* amber  — 31-85 */
--v-block:       #DC2626;   /* red    — 86-100 */
--v-unknown:     #94A3B8;   /* grey   — unavailable */
--v-scrim:       rgba(15, 23, 42, 0.65);
```

**Type:** Inter (system fallback: -apple-system, sans-serif). Clean, modern, readable at small sizes.

**Popup:** 380px wide, white card, blue header bar with the Verid wordmark + shield icon. Shows last verdict, scan button, on/off toggle.

**Injected overlay:** floats as a fixed panel in the bottom-right of the listing page. Does not reflow the marketplace layout. Collapses to a small badge when clear; expands to a banner for caution; fires a centred modal for block.

---

## Friction thresholds (unchanged)

| Band | Score | UI response | Blocks checkout |
|---|---|---|---|
| **Clear** | 0–30 | Small blue shield badge, bottom-right | No |
| **Caution** | 31–85 | Expanded panel with signal breakdown | No |
| **Block** | 86–100 | Full-screen modal on Buy click | Until dismissed |

**Low-confidence override:** capped at 60, never fires the blocker.

---

## Target marketplaces

- **Jumia** — primary demo target. Relatively stable DOM, embeds JSON-LD.
- **Temu** — secondary. More aggressive bot detection on server-side fetches, but extension reads rendered DOM so this is not a concern.

---

## In scope

- Chrome MV3 browser extension (manifest, content script, background service worker, popup).
- Three-tier extraction: JSON-LD → DOM → screenshot.
- Verid overlay injected onto real marketplace pages (badge / banner / blocker).
- Existing backend unchanged — same `POST /api/analyze` route.
- Updated scoring signals (`no_seller_store`, `single_listing_seller` replace `new_account`, `price_anomaly`).
- Blue/white modern UI design system for the extension.
- Mock marketplace (frontend/) retained as fallback demo only.

## Out of scope

- Any Python service. Any `.pkl`. Any `child_process`.
- Firefox extension — Chrome only for the demo.
- Safari extension.
- Real bank integration.
- Buyer accounts in the extension — it is a read-only tool.

---

## Known limitations — say these before a judge does

1. **Selector fragility.** Jumia's DOM uses build-hashed class names that can change on redeploy. JSON-LD is stable; CSS selectors are not. If a selector breaks, the signal is absent, not wrong — the confidence model handles this.
2. **No price baseline.** `price_anomaly` is gone. We replaced it with structural signals (`no_seller_store`, `single_listing_seller`) that are observable without a price index.
3. **Review timestamps.** Jumia doesn't always expose review timestamps in the DOM. `review_burst` may not fire on real listings — the templating signal carries the review layer alone if timestamps are absent.
4. **Weights are chosen, not learned.** Say so first. Transparent heuristics calibrated against test cases, explainable in the UI, honest about their provenance.
