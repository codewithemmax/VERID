# Verid — Code Standards

**Last revised:** 15 July 2026

---

## Hard rules

1. **No secrets in the repo.** `GROQ_API_KEY`, `GEMINI_API_KEY` (only if the vision fallback is triggered), `SUPABASE_SERVICE_KEY` — all in `.env`, `.env` in `.gitignore` from commit one. Every AI call is server-side. If an API key can reach the browser, the security pitch is dead and a judge who opens devtools will find it.
2. **No Python. No `child_process`. No `.pkl`.** If any of these appear in the repo, an agent has read a stale context file. Stop and re-read `architecture.md`.
3. **No hardcoded model strings.** `process.env.GROQ_MODEL_TEXT` (default `openai/gpt-oss-120b`), `process.env.GROQ_MODEL_VISION` (default `qwen/qwen3.6-27b`), and `process.env.GEMINI_MODEL` (default `gemini-3.5-flash`, only read if the vision fallback path is active). Never in a service file.
4. **No magic numbers in scoring.** Every weight and threshold lives in `backend/src/scoring/weights.ts`. Nowhere else.
5. **The mock marketplace never imports from the Verid overlay, and vice versa.** One-directional at most: Verid reads the DOM. The marketplace does not know Verid exists.
6. **Never log a review body, a seller name, or a listing URL.** Not to console, not to Supabase. Signal vectors and scores only.

---

## TypeScript

- `strict: true`. Both packages.
- No `any`. `unknown` plus a narrowing check where the type is genuinely unknown — which, for AI output, it is.
- Shared request/response types live in one file and are imported by both frontend and backend. **The API contract is a type, not a paragraph in a doc.** If it drifts, the compiler says so rather than the demo saying so.
- Zod-validate every AI response before touching it, regardless of provider. The model returns JSON-shaped text, not JSON. It will eventually return something else. Parse, do not trust.

## AI calls (Groq, primary)

- Groq's endpoint is OpenAI-compatible (`https://api.groq.com/openai/v1`) — use the `openai` npm client pointed at that base URL, or `groq-sdk`.
- Text signals: one call to `GROQ_MODEL_TEXT`, `response_format: { type: "json_object" }`.
- **Groq's JSON mode is a looser guarantee than schema-constrained output** — it does not enforce a shape the way a `responseSchema` would. The prompt must state exact key names and types explicitly, and Zod validation carries more weight here than it would on a schema-enforced provider. Do not treat Groq's "JSON mode" as equivalent to a validated contract; it's a request, not a guarantee.
- Every call wrapped in try/catch with an explicit 4000ms `AbortController` timeout.
- On any failure: return the degraded verdict from `architecture.md`. Never throw into the route handler. Never return 503.
- Prompts live in `backend/src/ai/prompts.ts` as exported template functions, not inline in service code. They will be rewritten twenty times in four days.
- **Vision path depends on the Thursday decision gate in `architecture.md`.** If the hybrid fallback is active, the Gemini call runs in `Promise.all` alongside the Groq call — parallel, not sequential — and gets the same try/catch/timeout/degraded-verdict treatment.

## Scoring module

- Pure. Synchronous. No I/O, no `await`, no `Date.now()`, no randomness.
- Signature: `scoreListing(signals: SignalInput): Verdict`.
- Same input, same output, always. This is what makes the five worked cases in `architecture.md` testable, and those tests are the evidence that the scoring is real logic and not a lookup table. A judge asking "is this hardcoded?" gets a test run, not a speech.

## Testing

Only one test file matters. `backend/src/scoring/scoring.test.ts`, asserting the five worked cases from `architecture.md`.

Not for coverage. Because "well-implemented logic vs. hardcoded dummy script" is an explicit judging criterion, and a passing test suite over the scoring rules is the cheapest possible proof. Twenty minutes of work. Write it.

No other tests. There is no time and nothing else earns it.

## Errors

- Backend: single error middleware, last in the chain. Shape `{ error: { code: string, message: string } }`.
- `message` is safe to show a human. No stack traces, no upstream Groq or Gemini errors leaking through.
- Frontend: Verid failing renders the grey unknown state. It never renders a React error boundary over someone's shopping page.

## Git

- `feat(F#.#):` frontend units, `feat(B#.#):` backend units. One commit per unit, at unit completion.
- Commit at the end of every unit even if the next one is half-written. It is Wednesday and the deadline is Sunday; the cost of losing three hours of work exceeds the cost of an imperfect commit.
- Branch directly on `main`. Two people, four days, no time for review ceremony.
- `README.md` written on day one, not day four: what it is, how to run it, what the env vars are. Judges clone repos.

## Naming

- DOM hooks for extraction: `data-verid-target="description"`. Never CSS classes, never `id`. Tailwind classes change when styling changes; extraction must not break because someone adjusted padding.
- Files: `kebab-case.ts`. Components: `PascalCase.tsx`. Types: `PascalCase`. Constants: `SCREAMING_SNAKE`.

## What good looks like on Sunday

A judge clones the repo, sets two env vars, runs `npm run dev` twice, opens localhost, and sees all three states fire correctly. Then they open `weights.ts` and read the entire scoring logic in one screen without scrolling.

That is the deliverable. Optimise for that reader.