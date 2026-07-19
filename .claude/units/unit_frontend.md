# Verid Extension — Implementation Units

**Last revised:** 19 July 2026

One unit at a time. Complete and verify before starting the next.
Commit format: `feat(E#.#): short description`

The mock marketplace (frontend/) is complete and retained as a fallback demo. No further work needed there. All new work is in `extension/`.

---

## Phase 1 — Extension scaffold

- [ ] **Unit E1.1: Manifest + project setup**
  - `extension/manifest.json` — Chrome MV3.
  - `host_permissions`: `*://*.jumia.com.ng/*`, `*://*.jumia.com/*`, `*://*.temu.com/*`
  - `permissions`: `activeTab`, `scripting`, `storage`
  - Content script registered for Jumia + Temu listing URL patterns.
  - Background service worker registered.
  - Popup registered.
  - `extension/tsconfig.json` — strict, no path aliases (extension has no Next.js resolver).
  - `extension/package.json` — build script using `esbuild` or `tsc`. No webpack, no bundler complexity.
  - **Verify:** extension loads in Chrome (`chrome://extensions` → Load unpacked). No manifest errors. Icon appears in toolbar.

- [ ] **Unit E1.2: Shared types bridge**
  - `extension/src/shared/types.ts` — copy (not symlink) of the relevant types from `shared/types.ts`. Extensions can't use tsconfig path aliases or monorepo imports at runtime.
  - Types needed: `AnalyzeRequest`, `AnalyzeResponse`, `Signal`, `DEGRADED_RESPONSE`.
  - **Verify:** `tsc --noEmit` passes on the extension package.

---

## Phase 2 — Extraction

- [ ] **Unit E2.1: JSON-LD tier**
  - `extension/src/content/extract.ts` — `extractFromJsonLd(): Partial<AnalyzeRequest>`.
  - Parse `<script type="application/ld+json">`. Handle `schema.org/Product` shape.
  - Extract: `title`, `price`, `description`, `images[]`, `reviews[]`.
  - Return only fields that were present — never fill missing fields with defaults here.
  - **Verify:** open a Jumia listing, run `extractFromJsonLd()` in the console (injected via content script). Log the result. Title, price, description should all be present.

- [ ] **Unit E2.2: DOM selector tier**
  - `extractFromDom(): Partial<AnalyzeRequest>` — fills fields JSON-LD missed.
  - Every selector in try/catch. A failed selector returns undefined for that field, never throws.
  - Extract: seller name, seller store link presence (`sellerHasStorePage`), seller listing count (`sellerListingCount`), review bodies + ratings, additional images.
  - `sellerHasStorePage`: `!!document.querySelector('a[href*="/shop/"]')` — adjust selector after testing on real Jumia page.
  - `sellerListingCount`: parse text near seller name matching `/(\d+)\s+products?/i`, default 0.
  - **Verify:** on a Jumia listing, the DOM tier fills seller fields that JSON-LD missed. Log the merged result.

- [ ] **Unit E2.3: Screenshot tier + merge**
  - `extension/src/background/service-worker.ts` — message handler for `CAPTURE_SCREENSHOT`. Calls `chrome.tabs.captureVisibleTab()`, returns base64 data URL.
  - `extension/src/content/extract.ts` — `captureScreenshot(): Promise<string | null>`. Sends message to background, receives data URL.
  - `mergeExtraction(jsonLd, dom, screenshot): AnalyzeRequest` — merges all three tiers. JSON-LD wins over DOM for the same field. Screenshot data URL appended to `images[]`. Missing required fields filled with safe defaults (empty string, 0, false).
  - **Verify:** `mergeExtraction()` returns a valid `AnalyzeRequest` shape on a Jumia listing. No TypeScript errors. Screenshot data URL present in `images`.

---

## Phase 3 — Overlay UI

- [ ] **Unit E3.1: Overlay scaffold + scanning state**
  - `extension/src/content/overlay.ts` — creates `#verid-overlay-root` div, appends to `document.body`.
  - `extension/styles/overlay.css` — all blue/white design tokens from `ui-context.md`. Scoped to `#verid-overlay-root`.
  - Scanning state: small pill, bottom-right, blue border, pulsing dots, "Checking listing…"
  - Space reserved on mount — overlay position is fixed, never causes layout shift.
  - **Verify:** overlay appears on a Jumia listing page immediately on load. Does not shift any marketplace content. Pulse animation runs.

- [ ] **Unit E3.2: Clear + Unknown states**
  - Clear: green shield badge, collapses after 3s, tooltip on hover.
  - Unknown: grey dash, "Couldn't check this listing." Never green on failure.
  - 400ms minimum scanning display even on fast response.
  - **Verify:** hardcode a clear verdict → green badge. Hardcode null → grey dash. Badge never causes layout shift.

- [ ] **Unit E3.3: Caution panel**
  - Caution: 320px panel, amber top strip, signal chips, expandable disclosure.
  - Signal chips from `verdict.signals`, max 4 visible + overflow count.
  - Disclosure: `explanation` + confidence sentence.
  - **Verify:** hardcode a caution verdict. Panel renders. Disclosure expands. Marketplace Buy button is NOT intercepted in caution state.

- [ ] **Unit E3.4: Block modal**
  - Content script intercepts clicks on buy/checkout elements: `[data-qa*="buy"]`, `button[class*="buy"]`, `button[class*="cart"]`, `a[class*="checkout"]` — test on real Jumia page and adjust.
  - On intercept: prevent default, fire modal.
  - Modal: scrim, white panel, red top rule, explanation, signal bullets, three buttons.
  - Focus trap. Escape → Go back. "Proceed anyway" closes modal and re-fires the original click.
  - **Verify:** hardcode a block verdict. Click Add to Cart on Jumia. Modal fires. Tab stays trapped. Escape closes. Proceed anyway completes the add-to-cart.

---

## Phase 4 — Wire + Popup

- [ ] **Unit E4.1: Live API call**
  - `extension/src/content/index.ts` — on page load: extract → POST to `VERID_API_URL` → render verdict.
  - `VERID_API_URL` from `chrome.storage.sync` or hardcoded to deployed backend URL.
  - `AbortController`, 5000ms timeout.
  - Any failure → unknown state. Never crashes the page.
  - **Verify:** open a Jumia listing with the backend running. Verdict renders. Kill the backend — unknown state renders, page still works.

- [ ] **Unit E4.2: Popup**
  - `extension/src/popup/popup.ts` — reads last verdict from `chrome.storage.local`, renders it.
  - Shows: site name, score, band, top 3 signals, "Scan this page" button, on/off toggle.
  - "Scan this page" sends a message to the content script to re-run extraction + analysis.
  - On/off toggle stored in `chrome.storage.sync`. Content script checks it on load.
  - **Verify:** popup opens, shows last verdict. Toggle off → overlay disappears on next page load. Scan button triggers a fresh analysis.

---

## Cut list — drop in this order if time runs out

1. Temu selectors → Jumia only for the demo.
2. Popup "Scan this page" button → popup is display-only.
3. On/off toggle → always on.
4. Screenshot tier → JSON-LD + DOM only, pass empty screenshot.
5. Block modal buy-click interception → modal fires on a dedicated "Check this listing" button in the overlay instead.

**Never cut:** the three-band overlay states, the extraction pipeline, the failure state.
