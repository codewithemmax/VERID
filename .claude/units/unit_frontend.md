# Verid Extension — Implementation Units

**Last revised:** 20 July 2026

All extension units are complete. Extension builds successfully to `dist/`.

---

## Completed

- [x] E1.1 — Manifest + project setup (Chrome MV3, Jumia + Temu host_permissions)
- [x] E1.2 — Shared types bridge (extension/src/shared/types.ts)
- [x] E2.1 — JSON-LD extraction tier
- [x] E2.2 — DOM selector tier (sellerHasStorePage, sellerListingCount)
- [x] E2.3 — Screenshot tier + mergeExtraction()
- [x] E3.1 — Overlay scaffold + scanning state
- [x] E3.2 — Clear + Unknown states
- [x] E3.3 — Caution panel
- [x] E3.4 — Block modal
- [x] E4.1 — Live API call (AbortController, 5s timeout, failure → unknown)
- [x] E4.2 — Popup (last verdict, score, signals, scan button, on/off toggle)
- [x] Build — esbuild → dist/, popup.html copied, manifest paths corrected

---

## Remaining

- [ ] **Load in Chrome**
  - Run `npm run build` in `extension/` (now also copies popup.html to dist/popup/)
  - Go to `chrome://extensions` → Load unpacked → select the `extension/` folder
  - Open a Jumia listing and verify overlay appears

- [ ] **Update API_URL**
  - After backend is deployed, update `API_URL` in `extension/src/content/index.ts`
  - Rebuild: `npm run build` in `extension/`
  - Reload extension in Chrome
