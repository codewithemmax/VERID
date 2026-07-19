# Verid — UI Context

**Last revised:** 19 July 2026

---

## What changed

The mock marketplace is no longer the demo host. Verid is now a Chrome browser extension that injects an overlay onto real marketplace pages (Jumia, Temu). The old dark/clinical overlay design and the vibrant marketplace design system are both replaced by a single unified **blue/white modern** design system for the extension UI.

The mock marketplace (frontend/) is retained as a fallback demo only — its visual system is unchanged but no longer the focus.

---

## Design principle: appropriate friction (unchanged)

Two failure modes, both fatal:
- **Too quiet** — buyer scrolls past the warning and loses money.
- **Too loud** — buyer sees a false alarm, disables the extension.

Friction scales with the score. The caution state must be distinguishable from the block state at a glance, without reading.

---

## Extension design system — blue/white modern

Clean, trustworthy, professional. The overlay reads as a security tool, not a browser widget. It sits on top of Jumia's colourful, busy layout and must be immediately legible without competing with the marketplace for attention.

### Design tokens

```css
/* Surface */
--v-bg:           #FFFFFF;
--v-surface:      #F0F4FF;   /* light blue tint — panel backgrounds */
--v-surface-alt:  #E8EFFE;   /* slightly deeper tint */
--v-border:       #C7D7FD;   /* blue-tinted border */
--v-shadow:       0 4px 24px rgba(37, 99, 235, 0.12);

/* Text */
--v-text:         #0F172A;   /* near-black */
--v-text-dim:     #64748B;   /* muted — captions, confidence */
--v-text-inv:     #FFFFFF;   /* on blue backgrounds */

/* Brand */
--v-blue:         #2563EB;   /* primary — header, CTAs, scanning state */
--v-blue-dark:    #1D4ED8;   /* hover state */
--v-blue-light:   #EFF6FF;   /* very light tint */

/* Status — sacred, appear nowhere else */
--v-clear:        #16A34A;   /* green  — 0-30  */
--v-clear-bg:     #F0FDF4;
--v-caution:      #D97706;   /* amber  — 31-85 */
--v-caution-bg:   #FFFBEB;
--v-block:        #DC2626;   /* red    — 86-100 */
--v-block-bg:     #FEF2F2;
--v-unknown:      #94A3B8;   /* grey   — unavailable */
--v-unknown-bg:   #F8FAFC;

/* Scrim (blocker modal) */
--v-scrim:        rgba(15, 23, 42, 0.65);
```

### Typography

- **Font:** Inter — clean, modern, highly legible at small sizes. System fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- **Headings:** Inter 600–700, 14–16px
- **Body:** Inter 400, 13–14px
- **Score numeral:** Inter 800, 32px
- **Chips/labels:** Inter 500, 11–12px

### Motion

- Badge state change: 150ms ease-out
- Panel expand: 200ms ease-out
- Modal appear: 250ms ease-out
- Scanning pulse: 1.5s ease-in-out infinite opacity cycle
- Nothing bounces. This is a security tool.

---

## Extension components

### Popup (380px wide)

Shown when user clicks the extension icon in the toolbar.

```
┌─────────────────────────────────────┐
│  🛡 VERID          [toggle on/off]  │  ← blue header bar (#2563EB)
├─────────────────────────────────────┤
│  Last scan: Jumia listing           │
│                                     │
│  [Score: 73]  ⚠ Caution            │  ← score numeral + band
│                                     │
│  • Seller requests off-platform...  │
│  • Product images appear synthetic  │
│                                     │
│  [Scan this page]                   │  ← blue CTA button
└─────────────────────────────────────┘
```

- White background, blue header
- Score displayed as a large numeral with band colour
- Top 3 fired signals listed
- "Scan this page" button triggers a manual re-scan
- Toggle disables the extension on the current domain

### Injected overlay — four states

The overlay is injected as a fixed panel, bottom-right of the viewport. It does not reflow the marketplace layout. Z-index: 2147483647 (max).

#### 1. Scanning

```
┌──────────────────────┐
│  🛡 Verid  ●●●       │  ← pulsing blue dots
│  Checking listing…   │
└──────────────────────┘
```

Small pill, 280px wide. Blue border, white background. Minimum 400ms display.

#### 2. Clear — score 0–30

```
┌──────────────────────┐
│  ✓ No risk signals   │  ← green shield icon
└──────────────────────┘
```

Collapses to a small green badge after 3s. Tooltip on hover: "Verid checked this listing — no fraud signals detected."

#### 3. Caution — score 31–85

```
┌────────────────────────────────────┐
│  ⚠ Caution · Score 73             │  ← amber header strip
│  ─────────────────────────────── │
│  [Off-platform contact] [Synthetic │
│   images] [Vague description]      │  ← signal chips
│                                    │
│  ▸ What does this mean?            │  ← expandable
└────────────────────────────────────┘
```

320px wide panel. Amber top strip, white body. Signal chips in `--v-surface`. Expandable disclosure shows `explanation` + confidence sentence. Buy button on the marketplace page is NOT disabled.

#### 4. Block — score 86–100

Fires on Buy click interception (content script intercepts click on elements matching buy/checkout selectors). Full-screen modal:

```
┌─────────────────────────────────────────┐
│  ████████████████████████████████████  │  ← red top rule
│                                         │
│  ⛔ Stop — confirmed scam pattern       │
│                                         │
│  [explanation sentence]                 │
│                                         │
│  • Signal one                           │
│  • Signal two                           │
│  • Signal three                         │
│                                         │
│  Confidence: High                       │
│                                         │
│  [Go back]          ← solid red        │
│  [Report listing]   ← outlined         │
│  Proceed anyway     ← dim text link    │
└─────────────────────────────────────────┘
```

Scrim: `--v-scrim`. Panel: white, max-width 480px, border-radius 16px. Focus trap. Escape → Go back.

#### 5. Unknown

```
┌──────────────────────┐
│  — Couldn't check    │  ← grey dash icon
└──────────────────────┘
```

Never green. "We didn't check" ≠ "we checked and it's fine."

---

## The color rule (unchanged in principle)

Status colours — green, amber, red — appear **only** on Verid status indicators. Never as decorative elements. On a busy Jumia page full of orange sale badges and green "In Stock" labels, this rule is harder to enforce — but the Verid overlay is a separate injected DOM tree with scoped CSS, so marketplace colours don't bleed in. The risk is the reverse: don't use Jumia's orange or green in the Verid overlay.

---

## Overlay injection rules

- Injected into `document.body` as a shadow DOM or isolated div with a unique ID (`verid-overlay-root`).
- CSS is scoped — no global styles leak into the marketplace page.
- The overlay never modifies the marketplace's DOM except to intercept Buy click events.
- On navigation (SPA route change), the overlay re-initialises and re-scans.
- If the extension is toggled off, the overlay is removed from the DOM entirely.

---

## Demo staging

The demo shows the extension firing on a real Jumia listing:

1. Open a clean Jumia listing → green badge appears (5s)
2. Open a suspicious listing → caution panel expands, show signal chips, expand disclosure (25s)
3. Open a high-risk listing → click Add to Cart / Buy → red modal fires (30s)

The mock marketplace localhost demo is the fallback if Jumia's DOM changes break extraction before the recording.
