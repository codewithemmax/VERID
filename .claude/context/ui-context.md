# Verid — UI Context

**Last revised:** 15 July 2026 (marketplace visual direction changed — see "Design direction change" below)

---

## Design direction change — read this first

The previous version of this file told you to keep the mock marketplace **deliberately ugly** — system fonts, no design effort, "the control condition." That is **reversed.** The marketplace is now a **vibrant, expressive, genuinely beautiful** craft/maker marketplace. It should look like a real product someone is proud of.

The reason the old rule existed still matters, and it is preserved — just re-engineered. The old contrast was *plain host vs. distinctive overlay*. The new contrast is **warm expressive art vs. cold precise instrument.** Verid still reads instantly as "not part of this page." It just earns that separation through *character* now, not by being the only thing on screen with any care put into it.

**What did NOT change:** everything about how Verid *behaves* — the four states, the friction thresholds, the escape hatch, the confidence sentence, the demo staging. Verid's own visual system (dark, clinical, Space Grotesk) is untouched. Only the marketplace host got beautiful.

---

## What we are building, and why — read this before anything else

**One Next.js app. Two component trees, side by side, on the same page. No browser extension.**

1. **The marketplace host** — `ProductGallery`, `ProductDetails`, `SellerCard`, `ReviewSection`, `BuyButton`. Three seeded listings (clean / caution / high-risk). Now a **vibrant, expressive marketplace** — bold color, playful geometry, craft-fair energy. It is the stage, and the stage is beautiful, but it is still the stage, not the product being pitched.
2. **The Verid overlay** — `VeridBadge`, `VeridBanner`, `VeridBlocker`. Reads the marketplace's own DOM via `data-verid-target` attributes, calls the real backend, renders one of four states based on the score. Cold, precise, dark — the instrument laid over the art.

Both live in one repo, one `npm run dev`. A read-only browser-extension probe exists separately (see below) but it is **not** part of what ships Sunday — don't confuse the two while building.

### Why a UI at all — three distinct reasons

1. **It's the only way to demonstrate the loop.** The scoring engine and AI signal extraction are real logic, but a judge can't watch a `POST /api/analyze` response and understand anything. The UI turns "we built a fraud detector" into something a judge can *see happen*.
2. **The UI states ARE the pitch's answers, not decoration around them.** The friction thresholds, the caution banner's expandable disclosure, the "proceed anyway" button that always exists — each one is a direct, demonstrable answer to a judging question (false positives, explainability, overreach). See Section 7 for the explicit mapping. Building the UI is how you *show* the answers instead of just stating them.
3. **Building our own host page means we control every variable.** We seed exactly the clean/caution/high-risk cases we need, in a fixed, repeatable state, so a 3-minute video can hit all three bands on command. A real Jumia page can't guarantee that — prices change, listings get taken down, reviews shift. The mock marketplace exists specifically so the demo is reliable.

### What this UI is explicitly NOT claiming

It does not demonstrate that Verid works on a real marketplace yet. That gap is named plainly in `project-overview.md`'s Known Limitations. If a judge asks "how would you extract data from a real site," the answer is a verbal explanation of the three-tier extraction strategy (JSON-LD → Open Graph meta → heuristic DOM scan) plus, only if pushed for proof, a separate read-only probe extension that logs which tier succeeded on a live page. That probe is a pocket answer for skepticism, not a headline feature, and it is not the thing described in the rest of this document.

---

## Design principle: appropriate friction (unchanged)

Verid is an overlay on someone else's page. Two failure modes, both fatal:

- **Too quiet** — the buyer scrolls past the warning and loses their money. The product did nothing.
- **Too loud** — the buyer sees a red screen on a legitimate listing, learns Verid cries wolf, and disables it. The product did worse than nothing.

Friction is the product. It must scale with the score and never exceed it.

**Corollary the judges will test:** the caution state must be visually distinguishable from the block state *at a glance, without reading*. Amber banner vs. red modal. Inline vs. interrupting. If a user has to read the text to know how worried to be, the design failed.

---

## Two visual systems, kept apart (re-engineered)

There are still two worlds on the page, and they must never blur into one. What changed is *how* they stay apart.

**The marketplace host — vibrant expressive.** A modern craft/maker marketplace with real design intent: saturated color, expressive display type, playful geometry, generous but energetic layout. It is warm, human, and inviting. This is now a place you'd actually want to shop.

**The Verid overlay — cold precise instrument.** Dark matte surface, a hairline border, a subtle drop shadow that implies it floats above the page. A different typeface (Space Grotesk / DM Sans — never used anywhere in the marketplace). No playfulness, no springy motion, no expressive color — only status color. It reads as a measuring device set down on top of a colorful table.

**The contrast is now art vs. instrument.** When judges watch the demo they must still instantly grasp which pixels are the marketplace and which pixels are the product being pitched. Before, Verid stood out because it was the only careful thing on a dull page. Now it stands out because it is the only *cold, still, dark* thing on a warm, expressive page. Same outcome, better-looking demo.

**Three rules enforce the separation — do not break them under deadline:**

1. **Typeface is the tell.** The marketplace uses its own display + body faces. Verid uses Space Grotesk + DM Sans and *nothing else does*. Seeing Space Grotesk anywhere on screen means "this is Verid." If a marketplace component ever renders in Verid's type, the separation is broken.
2. **The marketplace may not touch the status hues.** See the color rule below. This is the single most important new constraint the vibrant direction introduces.
3. **Verid still wins the frame when it fires.** A beautiful, colorful page is more visually competitive than a dull one. So when the blocker fires, its scrim *darkens the entire vibrant page*, and the red modal pops against the dimmed canvas — Verid earns attention by removing the marketplace's color, not by out-shouting it. When the caution banner inserts, its dark instrument surface is a deliberate cold rectangle in a warm layout; it does not adopt the marketplace's rounded, playful card styling.

---

## Marketplace design system — vibrant expressive

This is new. The marketplace now has a real design language. Build it with intent, but remember it is the host, not the hero (see "Effort budget" below).

### Marketplace tokens

```css
/* Canvas & ink — warm, not white */
--mk-canvas:      #FBF5EC;   /* warm ivory — the page ground */
--mk-surface:     #FFFFFF;   /* product cards, panels */
--mk-tint:        #F3E3D0;   /* soft warm block for color-blocking */
--mk-ink:         #1C1420;   /* deep plum-black — primary text */
--mk-ink-soft:    #6C5F6E;   /* muted text, captions */
--mk-line:        #E7DAC9;   /* hairlines, dividers */

/* Expressive brand palette — saturated, cool-leaning, deliberately
   clear of the green/amber/red status spectrum (see color rule) */
--mk-magenta:     #E22C8B;   /* primary — CTAs, brand marks, Buy button */
--mk-violet:      #6D3BF5;   /* secondary — links, highlights */
--mk-cyan:        #12B5C9;   /* accent — tags, category chips */
--mk-cobalt:      #2547E8;   /* deep accent — sparingly */
```

**Type (marketplace):**
- Display / headings / price: `Bricolage Grotesque` — expressive, characterful, on-trend. Big and confident.
- Body / descriptions / reviews: `Manrope` — clean, warm, readable.
- Both from Google Fonts. **Neither is Space Grotesk or DM Sans** — those two belong to Verid alone.

**Layout language:** asymmetric editorial grids, generous whitespace with energetic breaks, bold oversized headings, playful geometric shapes/blobs as background accents, color-blocked sections, sticker-style category tags with confident rounded corners, vivid product imagery. Cards may lift and rotate slightly on hover. It should feel curated and alive.

**Motion (marketplace):** playful is allowed here — gentle spring on hover lifts, 200–300ms ease with a touch of overshoot on interactive cards. **This is the opposite of Verid's motion, and that's intentional** — the marketplace bounces a little; Verid never does. The contrast in motion reinforces art vs. instrument.

### Effort budget — the honest guardrail

Making the marketplace beautiful is now in scope, but it is still not the thing being judged. Rank effort in this order and stop when time runs out:

1. **Verid's four states** — always first. This is the product.
2. **The caution banner disclosure** — the demo's money shot.
3. **Marketplace polish** — real, but capped. A cohesive, confident, vibrant look beats a fussy one. Get the type, color, and one strong hero listing layout right; do not gold-plate every card.

If Saturday night is going badly, marketplace polish is still what gets cut first (see `unit_frontend.md` cut list) — but "cut back to a clean vibrant baseline," not "cut to system-font gray." The baseline itself is now beautiful.

---

## Verid tokens (unchanged)

```css
/* Verid overlay surface */
--verid-surface:      #0F1115;   /* near-black, matte */
--verid-surface-alt:  #1A1D24;
--verid-border:       #2A2F3A;
--verid-text:         #E8EAED;
--verid-text-dim:     #9AA0AA;

/* Status — the ONLY status colours in the entire system */
--verid-clear:        #22C55E;   /* green  — 0-30  */
--verid-caution:      #F59E0B;   /* amber  — 31-85 */
--verid-block:        #EF4444;   /* red    — 86-100 */
--verid-unknown:      #6B7280;   /* grey   — analysis unavailable / low confidence */

/* Backdrop */
--verid-scrim:        rgba(9, 10, 13, 0.72);
```

**Type (Verid):**
- Verid overlay: `Space Grotesk` — headings, score numerals.
- Verid body text: `DM Sans`.

**Motion (Verid):** 150ms ease-out on badge state change. 200ms on banner insert. 250ms on modal. Nothing bounces. Nothing pulses except the scanning state. This is a security tool; jitter reads as unserious. (Contrast this deliberately with the marketplace's springy motion above.)

---

## The color rule (the one most likely to break now)

Under the old plain-marketplace design this rule was trivial, because the marketplace had no color. Now the marketplace is *full* of saturated color, so the rule is both harder and more important:

**Status color — green (clear), amber (caution), red (block) — appears ONLY on Verid status, nowhere else on the entire page.** The marketplace's expressive palette is magenta / violet / cyan / cobalt on warm ivory — deliberately chosen to sit *clear of the status spectrum*. No green, amber, orange, or red as a marketplace brand color. Not on a "Sale" tag, not on a category chip, not on the Buy button (the Buy button is magenta).

The reason: the moment a red "Hot Deal" badge or a green "In Stock" pill appears in the marketplace, Verid's red and green stop carrying meaning. A judge glancing at the page can no longer tell a Verid verdict from marketplace decoration. The whole friction-scales-with-risk thesis depends on status color being *sacred* — and a vibrant marketplace is exactly the environment where someone will reflexively reach for a cheerful green or an urgent red. Don't. Those three hues are Verid's.

**Verid's colors are also its own:** no magenta/violet/cyan anywhere on the Verid overlay. The instrument is dark neutral plus one status hue at a time. The two palettes never touch.

---

## The four states (behavior unchanged)

### 1. Scanning
Small grey dot beside the Buy button, gentle opacity pulse. Text: `Verid is checking…` in `--verid-text-dim`. **Zero layout shift** — reserve the space on mount. If the badge pops in and pushes the Buy button down, the demo looks broken.

Hold for a 400ms minimum even if the response is faster. A verdict that appears instantly reads as pre-baked, and a judge watching a 3-minute video will assume it is hardcoded. The 400ms is what makes real work look like real work.

### 2. Clear — score 0–30
Grey dot becomes a green shield with a check. No banner. No layout change. No copy beyond a tooltip on hover: `No risk signals detected.`

The temptation is to celebrate. Resist it. A tool that congratulates you on every safe listing becomes wallpaper, and then it is wallpaper on the one listing that mattered.

### 3. Caution — score 31–85
Amber banner inserts directly above the Buy button. It pushes content down — being unavoidable is its job. It is a **cold dark instrument rectangle** deliberately styled unlike the marketplace's warm rounded cards. Structure:

```
⚠  Caution — 3 unusual signals
   [Seller account is 3 days old]  [Price is 42% below market]  [Vague description]
   ▸ What does this mean?
```

- Signal chips render from `response.signals`, ordered by weight. Cap at 4 visible, then `+N more`.
- The disclosure expands to the plain-language `explanation` plus per-signal detail.
- **The Buy button remains fully enabled and visually unchanged.** The buyer is informed, not obstructed. This is the whole thesis of the band.

### 4. Block — score 86–100
Fires **on Buy click**, not on page load. Load-time interruption trains people to dismiss reflexively before reading; click-time interruption lands at the moment of decision, which is the only moment it can change anything.

- Scrim `--verid-scrim` with 4px backdrop blur. **This scrim is now doing extra work** — it darkens the whole vibrant marketplace so the red panel pops against a dimmed page. Against a colorful host, the scrim is how Verid wins the frame.
- Centred panel, `--verid-surface`, red top rule, max-width 480px.
- Header: `Stop — this listing shows a confirmed scam pattern`
- Body: `explanation`, then bulleted signal list. Plain English. Not "urgency_score: 0.91" — "The seller is pressuring you to pay quickly."
- Buttons, in this order and weight:
  - `Go back` — solid, `--verid-block`, primary. The safe path is the loud path.
  - `Report this listing` — solid, `--verid-surface-alt`, secondary.
  - `Proceed anyway` — text link, `--verid-text-dim`, smallest. Available, deliberately unattractive.

**The escape hatch must exist.** A tool that cannot be overridden is a tool that gets uninstalled, and we do not have the precision to justify hard blocking. Making it ugly is the honest compromise: we are confident, not infallible.

- Focus trap. `Escape` maps to `Go back`, not to dismiss.

### 5. Unknown — analysis unavailable or low confidence
Grey dot with a small dash. Tooltip: `Verid couldn't check this listing.`

**This is not the clear state.** Never render green on a failed analysis. "We didn't check" and "we checked and it's fine" are different claims, and conflating them is the exact false-certainty failure the confidence indicator exists to prevent. Grey, not green.

---

## Confidence display (unchanged)

Every verdict above the clear band shows confidence inline, small, `--verid-text-dim`:

`Confidence: Medium — limited review history on this seller`

Not a badge. Not a colour. A sentence. It should read as a caveat, not a feature.

---

## Demo staging notes

The video is max 3 minutes and the UI states are the deliverable. Sequence: clean listing (green, 5s) → caution listing (amber banner, expand the disclosure, 25s) → high-risk listing (click Buy, modal fires, 30s). The expansion of the caution disclosure is the single most persuasive shot in the demo — it is where explainability stops being a claim and becomes visible. Do not rush it.

**New with the vibrant marketplace:** the beauty of the host now works *for* the demo. A judge's first impression is a polished, real-looking marketplace — which makes Verid's cold overlay read as a serious tool laid over a serious product, not a widget on a wireframe. But the beauty must never compete with Verid during the three key moments above. When a Verid state is on screen, the eye goes to Verid. Frame each shot so the instrument, not the art, is the subject.
