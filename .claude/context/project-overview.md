# Verid — Project Overview

**Last revised:** 15 July 2026
**Deadline:** Sunday, 19 July 2026 — **4 days remaining, not 7.**

---

## What Verid is

Verid is a contextual fraud detection assistant for online marketplace buyers. It reads publicly visible listing data — description, price, seller profile, product images, customer reviews — and returns a plain-language risk verdict before the buyer sends money.

It does not read the buyer's data. It reads the seller's public page.

---

## Strategic decisions (locked)

**Consumer-first standalone MVP.** Verid is a browser-side assistant operating on public page data. No marketplace API, no platform partnership, no bank integration required to function. Union Bank middleware (pre-authorisation risk check on transfer) is the Phase 3 pitch, not Phase 1 code.

**Seeded mock marketplace as the demo host.** We build a Next.js marketplace with deliberately seeded clean / caution / high-risk listings so the demo can trigger every UI state on command inside a 3-minute video. The extraction logic we write against our own DOM is the same shape we would write against Jumia's. It is not the same selectors — see "Known limitations."

**Review analysis is in scope.** A scammer can steal a legitimate description. Faking an aged, linguistically varied review history is much harder. Reviews are the hardest layer to forge and therefore the highest-value signal.

---

## REVERSED DECISION: no Hugging Face ML model

The previous handover locked in "Hybrid ML Scoring via a Hugging Face XGBoost model" and marked it *do not alter*. **It is altered. Reason, on the record:**

All three candidate repos exist. None of them scores marketplace listings.

- `shahviransh/fraud-detection` — trained on synthetic e-commerce **transaction** data (`Is Fraudulent` label), 52 features covering transaction amount, quantity, purchase frequency, payment method. Zero overlap with our feature space. Its own published ensemble metrics: **precision 0.2640, recall 0.5868, F1 0.3642**. Roughly three of every four fraud flags are false alarms. On a 5.01% fraud base rate, "always predict legit" scores 94.99% accuracy; their ensemble scores 89.73% — *worse than a constant*. Its card also warns it requires a CUDA GPU. It is a McMaster COMPSCI 4AL3 course group project.
- `vaibhav07112004/fraud-detection-models` — 1.27 GB, and the model card is broken. It tells you to download `ecommerce_fraud_model.pkl`; the repo contains `fraud_model_ecommerce.pkl`. Every code snippet points at `repo_id="vaibhavnsingh07/..."` — a different account name. The e-commerce pickle is RandomForest/DecisionTree, not XGBoost. No feature schema is published, and it ships a separate scaler, imputer, and label encoder whose column order you would have to reverse-engineer blind.
- `jamal-ibrahim/distilbert-hybrid-fraud-detector-v2` — the most honest card of the three, and irrelevant: trained on the **Enron Spam** corpus to classify email as spam/ham. Its six engineered features are caps ratio, exclamation count, URL count, email-address count. Email artifacts. Our AI provider already does this job on our input, better.

Feeding our `urgency_score` / `image_stock_probability` / `account_age` array into any of these produces a number with no causal relationship to the input. It would be a score with fabricated provenance. That is exactly the failure the "Machine Learning Question" pitch prep was written to avoid, and it collapses the moment a judge asks what the model was trained on.

**Replacement: transparent weighted heuristics.** See `architecture.md` for the full specification. This is defensible under questioning, explainable to the user in the UI, runs in-process with no Python bridge, and is honest. The Phase 2 pitch is that our confirmed-fraud feedback loop generates the labelled listing-fraud dataset that does not currently exist — which is a genuinely interesting claim, and true.

Secondary benefit: this deletes an entire phase of work from a 4-day build.

---

## Core user flow

1. Buyer opens a product listing on the seeded mock marketplace.
2. Verid's content layer extracts public data from the DOM: title, price, description, seller account age, seller rating, image URLs, review bodies. Review author names are stripped client-side before transmission.
3. A single multimodal AI call extracts structured signals from text + images + reviews together — Groq if the Thursday vision decision gate passes, a Groq+Gemini parallel hybrid if it doesn't. See `architecture.md`.
4. The backend scoring module applies documented weights and a cross-layer compounding rule to produce a 0–100 score and a confidence rating.
5. Verdict returns to the frontend. Target p50 under 1.5s, hard timeout 4s.
6. UI renders friction proportional to the score.

---

## Friction thresholds (single source of truth)

Previously specified three different ways across four files (`>60` in project-overview, `86-100` in the handover, `0-30/31-85/86-100` in UX prose, `0-85` in unit_frontend). **The following is authoritative. Every other number in every other file is void.**

| Band | Score | UI response | Blocks checkout |
|---|---|---|---|
| **Clear** | 0–30 | Small green shield near the title. No layout shift. | No |
| **Caution** | 31–85 | Amber banner above the Buy button, with expandable signal breakdown. | No |
| **Block** | 86–100 | Full-screen interruption modal fired on Buy click. | Until dismissed |

**Low-confidence override:** a verdict with `confidence: "low"` is capped at 60 and can never fire the blocker. Thin data must not produce loud certainty.

---

## SCOPE EXPANSION (15 July): real marketplace with accounts and seller-posted listings

**Reversed decision, on the record.** The marketplace is no longer a static three-listing mock. It is now a real (if minimal) marketplace: users sign up with email + password, and signed-in sellers post their own products, which are stored in Supabase and appear alongside the three crafted demo listings. This moves "Auth, accounts" from Out of scope into In scope. Reason: the product is more compelling as a live marketplace than a hard-coded stage, and Verid analyses a real user-posted listing exactly as it analyses a seeded one.

**The three crafted demo listings survive as seeded DB rows** owned by demo accounts. They are the deterministic demo anchors — the guaranteed clear/caution/block cases for the 3-minute video. Real user listings coexist with them.

**Privacy pitch — reframed, and the reframing matters.** The old line was "we store no PII, full stop." That is no longer literally true: the marketplace host now stores seller accounts and their listings, like any marketplace does. The honest, still-strong pitch is now two-layered:

- **The marketplace host** stores what a marketplace must: accounts, listings, seller display names. Ordinary host data, held under Supabase Row-Level Security — a seller can only write their own rows.
- **Verid's analysis layer stores no PII.** The `risk_logs` table is unchanged — anonymised signal vectors and scores only. No seller identity, no buyer identity, no listing URL, no review author.

Say it to a judge as: *"Verid works on top of any marketplace without storing personal data about who it analyses. The demo marketplace is our own, so it has accounts — but Verid's own storage is PII-free by design."* The `risk_logs` invariant in `architecture.md` is what backs this claim.

## In scope

- Next.js 15 marketplace with **email/password auth (Supabase Auth)** and a **seller "post a product" flow**. Products stored in Supabase and rendered from the DB.
- Three crafted demo listings (clean / caution / high-risk) **seeded into the DB** as demo-account rows — the deterministic demo cases.
- Node.js + Express + TypeScript API, single `POST /api/analyze` route.
- One multimodal AI call per analysis on the primary provider (Groq), with a specified parallel-hybrid fallback if Groq's vision model doesn't hold up under testing.
- In-process heuristic scoring module with documented weights.
- Verid UI: shield badge, caution banner, blocker modal, scanning state.
- Supabase: marketplace tables (`profiles`, `listings`) under RLS, plus the anonymised `risk_logs` logging table (unchanged).

## Out of scope

- Any Python service. Any `.pkl` file. Any `child_process`.
- Any trained ML model.
- Real marketplace scraping. Real bank integration.
- Cart, orders, payments, checkout beyond the mock Buy button. Accounts and seller listings are now IN scope; buying is still mocked.
- Buyer-posted reviews on user listings, and image **uploads** — sellers paste image URLs (the vision model needs public URLs regardless). Reviews exist on the seeded demo listings only; user listings start with none.
- The confirmed-fraud feedback loop as running code. It is a pitch claim and a schema column, not a Phase 1 feature.

---

## Known limitations — say these out loud in the pitch before a judge says them to you

1. **The mock marketplace does not prove the extraction layer works.** Our seeded DOM has clean `data-verid-*` attributes. Jumia's has build-hashed class names that change on redeploy, reviews behind lazy-load and pagination, and anti-bot measures. Extraction is the hard part of the real product, and the demo does not test it. Do not claim "the same logic works on Jumia" — claim "the detection loop is proven; the extraction adapter is per-platform engineering."
2. **Price deviation needs a market baseline we do not have.** In the mock, the category median comes from seed data. In production it requires a price index Verid does not own. This is a real Phase 2 dependency.
3. **The weights are not learned, they are chosen.** Say so first. "Transparent heuristics, calibrated against seeded cases, explainable to the user today" is a strong answer. "We used an ML model" followed by "trained on what?" is not.
4. **Verid sees what the buyer sees, which is a ceiling.** No device fingerprint, no IP, no cross-account link analysis, no transaction history. Everything a real marketplace's Trust & Safety stack uses that lives behind their login is unavailable to us. Our advantage is that we work on every platform without permission; our limit is that we work on the surface only.