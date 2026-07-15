# AI Workflow Rules

## Approach
Build this prototype incrementally using a spec-driven workflow. Address the seeded mock marketplace structure first, followed by backend logic, AI integration, and finally the interceptive UI overlays.

## Scoping Rules
- Work on one feature unit at a time.
- Prefer small, verifiable increments over large speculative changes.
- Do not combine UI scaffolding with complex backend AI logic in a single step.

## Handling Missing Requirements
- If a requirement is ambiguous, clarify it based on the `project-overview.md` limits before writing code.
- Never invent dummy data for the AI logic. [cite_start]Always utilize the live Gemini API endpoints as requested for the HackX submission[cite: 150].
- [cite_start]Do not simulate Union Bank integrations; stick to the standalone Phase 1 MVP constraints[cite: 94, 107].

## Keeping Docs in Sync
Update `progress-tracker.md` whenever an implementation stage (e.g., Backend API, Gemini Vision integration, Next.js UI) is successfully completed.

## Before Moving to the Next Unit
1. The current unit works end-to-end within its defined scope.
2. [cite_start]The UI does not crash during standard user flows[cite: 152].
3. [cite_start]Ensure no un-anonymized data leaks into the Supabase database[cite: 63].